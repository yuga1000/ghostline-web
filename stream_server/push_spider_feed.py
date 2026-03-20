#!/usr/bin/env python3
"""
Push spider logs to Railway stream server.
Parses today's spider log file and POSTs to /api/spider-log.json

Run via cron every 30 seconds, or as a daemon:
  python3 push_spider_feed.py --daemon
"""

import json
import os
import re
import sys
import time
from datetime import datetime, date
from pathlib import Path

import requests

# Config
RAILWAY_URL = os.environ.get(
    'RAILWAY_URL',
    'https://ghostline-web-production-7bc6.up.railway.app'
)
AUTH_TOKEN = os.environ.get('STREAM_PASSWORD', 'Gho$tline_2025!')
SPIDER_LOG_DIR = os.environ.get(
    'SPIDER_LOG_DIR',
    str(Path.home() / 'Documents/spider_web/ghostline-spider/logs')
)
MAX_EVENTS = 50  # Last N events to send
PUSH_INTERVAL = 30  # seconds (daemon mode)


def parse_spider_log(log_path: str, max_events: int = MAX_EVENTS) -> dict:
    """Parse spider log file into feed format."""
    events = []

    try:
        with open(log_path, 'r') as f:
            lines = f.readlines()
    except FileNotFoundError:
        return {
            "generated_at": datetime.now().isoformat(),
            "event_count": 0,
            "events": []
        }

    # Parse log lines: "2026-03-15 12:00:00,744 | module | LEVEL | message"
    pattern = re.compile(
        r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ \| '
        r'([\w.]+)\s*\| '
        r'(\w+)\s*\| '
        r'(.+)'
    )

    for line in lines:
        m = pattern.match(line.strip())
        if m:
            ts_str, module, level, message = m.groups()
            # Extract just the time part
            time_part = ts_str.split(' ')[1] if ' ' in ts_str else ts_str
            events.append({
                "time": time_part,
                "event": f"[{module}] {message.strip()}",
                "level": level
            })

    # Take last N events (newest last)
    events = events[-max_events:]

    return {
        "generated_at": datetime.now().isoformat(),
        "event_count": len(events),
        "events": events
    }


def get_today_log_path() -> str:
    """Get path to today's spider log file."""
    today = date.today().strftime('%Y-%m-%d')
    return os.path.join(SPIDER_LOG_DIR, f'spider_{today}.log')


def push_feed(feed_data: dict) -> bool:
    """Push feed data to Railway server."""
    url = f"{RAILWAY_URL}/api/spider-log.json"
    try:
        resp = requests.post(
            url,
            json=feed_data,
            headers={
                'Authorization': f'Bearer {AUTH_TOKEN}',
                'Content-Type': 'application/json'
            },
            timeout=10
        )
        if resp.status_code == 200:
            print(f"[Push] ✓ {feed_data['event_count']} events → Railway")
            return True
        else:
            print(f"[Push] ✗ HTTP {resp.status_code}: {resp.text[:100]}")
            return False
    except Exception as e:
        print(f"[Push] ✗ Error: {e}")
        return False


def run_once():
    """Parse and push once."""
    log_path = get_today_log_path()
    print(f"[Spider Feed] Parsing: {log_path}")
    feed = parse_spider_log(log_path)
    print(f"[Spider Feed] {feed['event_count']} events found")
    push_feed(feed)


def run_daemon():
    """Run in loop, pushing every PUSH_INTERVAL seconds."""
    print(f"[Daemon] Spider feed pusher started (interval: {PUSH_INTERVAL}s)")
    print(f"[Daemon] Railway: {RAILWAY_URL}")
    print(f"[Daemon] Log dir: {SPIDER_LOG_DIR}")

    while True:
        try:
            run_once()
        except Exception as e:
            print(f"[Daemon] Error: {e}")
        time.sleep(PUSH_INTERVAL)


if __name__ == '__main__':
    if '--daemon' in sys.argv:
        run_daemon()
    else:
        run_once()
