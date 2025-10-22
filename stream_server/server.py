#!/usr/bin/env python3
"""
Ghostline Stream Server for Railway
aiohttp server: HTTP POST + WebSocket on single port
"""

import asyncio
import json
import os
import time
from datetime import datetime
from typing import Set, Dict
from collections import defaultdict
from aiohttp import web

# Auth password from environment
AUTH_PASSWORD = os.environ.get('STREAM_PASSWORD', 'ghostline2025')

# Store connected WebSocket clients
clients: Set = set()

# Rate limiting: Track connections per IP
connection_tracker: Dict[str, list] = defaultdict(list)
MAX_CONNECTIONS_PER_IP = 5  # Max 5 concurrent connections per IP
CONNECTION_WINDOW = 60  # 60 seconds window


def convert_event_to_frontend_format(event: dict) -> dict:
    """Convert log event to frontend WebSocket format."""
    # Get timestamp
    if isinstance(event.get('timestamp'), (int, float)):
        timestamp_str = time.strftime('%H:%M:%S', time.localtime(event['timestamp']))
        timestamp_ms = int((event['timestamp'] % 1) * 1000)
        timestamp_formatted = f"{timestamp_str}.{timestamp_ms:03d}"
    else:
        timestamp_formatted = event.get('timestamp', datetime.now().strftime('%H:%M:%S.%f')[:-3])

    # Map log levels
    level_map = {
        'ACTION': 'action',
        'THINKING': 'thinking',
        'SUCCESS': 'success',
        'ERROR': 'error',
        'INFO': 'info',
        'WARNING': 'warning'
    }

    return {
        'type': 'log',
        'content': event.get('message', event.get('content', '')),
        'timestamp': timestamp_formatted,
        'level': level_map.get(event.get('level', 'INFO'), 'info').lower(),
        'metadata': event.get('metadata', {})
    }


async def broadcast_log(message: dict):
    """Broadcast log message to all connected WebSocket clients"""
    if clients:
        print(f"[Broadcast] Sending to {len(clients)} clients: {message.get('content', '')[:50]}...")
        # Send to all clients, ignore errors
        success_count = 0
        for client in list(clients):
            try:
                await client.send_str(json.dumps(message))
                success_count += 1
            except Exception as e:
                # Client disconnected, will be removed by handler
                print(f"[Broadcast] Failed to send to client: {e}")
        print(f"[Broadcast] Sent to {success_count}/{len(clients)} clients")
    else:
        print(f"[Broadcast] No clients connected, message not sent")


def check_rate_limit(ip: str) -> bool:
    """Check if IP has exceeded connection rate limit."""
    now = time.time()

    # Clean old connections (older than window)
    connection_tracker[ip] = [
        conn_time for conn_time in connection_tracker[ip]
        if now - conn_time < CONNECTION_WINDOW
    ]

    # Check if limit exceeded
    if len(connection_tracker[ip]) >= MAX_CONNECTIONS_PER_IP:
        return False

    # Add new connection
    connection_tracker[ip].append(now)
    return True


async def handle_websocket(request):
    """Handle WebSocket connections (frontend clients)"""
    # Get client IP (check X-Forwarded-For for Railway proxy)
    ip = request.headers.get('X-Forwarded-For', request.remote).split(',')[0].strip()

    # Rate limiting check
    if not check_rate_limit(ip):
        print(f"[WebSocket] RATE LIMIT EXCEEDED for {ip}")
        return web.Response(text='Too many connections', status=429)

    ws = web.WebSocketResponse()
    await ws.prepare(request)

    clients.add(ws)
    print(f"[WebSocket] Client connected from {ip}. Total: {len(clients)}")

    try:
        async for msg in ws:
            # Echo back if client sends anything
            if msg.type == web.WSMsgType.TEXT:
                print(f"[WebSocket] Received from {ip}: {msg.data}")
    finally:
        clients.discard(ws)
        print(f"[WebSocket] Client {ip} disconnected. Total: {len(clients)}")

    return ws


async def handle_log_post(request):
    """Handle HTTP POST /api/logs - receive logs from MacBook"""
    # Check authorization header
    auth_header = request.headers.get('Authorization', '')

    if auth_header != f'Bearer {AUTH_PASSWORD}':
        print(f"[HTTP] Unauthorized attempt from {request.remote}")
        return web.json_response({'error': 'Unauthorized'}, status=401)

    try:
        # Parse JSON body
        event = await request.json()

        # SECURITY: Limit message size to prevent DoS (5000 chars = ~1-2 paragraphs)
        message_text = event.get('message', '')
        if len(message_text) > 5000:
            print(f"[HTTP] WARNING: Message too long ({len(message_text)} chars), truncating to 5000")
            event['message'] = message_text[:5000] + '... [TRUNCATED]'

        # Convert to frontend format and broadcast
        message = convert_event_to_frontend_format(event)
        await broadcast_log(message)

        print(f"[HTTP] Log: {event.get('message', '')[:60]}...")

        return web.json_response({'status': 'ok'})

    except json.JSONDecodeError:
        return web.json_response({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"[HTTP] Error: {e}")
        return web.json_response({'error': str(e)}, status=500)


async def handle_health(request):
    """Health check endpoint"""
    return web.json_response({
        'status': 'ok',
        'clients': len(clients),
        'server': 'Ghostline Stream Server'
    })


def create_app():
    """Create aiohttp application"""
    app = web.Application()

    # Routes
    app.router.add_get('/ws', handle_websocket)  # WebSocket endpoint
    app.router.add_post('/api/logs', handle_log_post)  # HTTP POST for logs
    app.router.add_get('/health', handle_health)  # Health check

    return app


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))

    print("=" * 70)
    print("🟢 GHOSTLINE STREAM SERVER 🟢")
    print("=" * 70)
    print(f"Server: http://0.0.0.0:{port}")
    print(f"  GET  /ws        - WebSocket (frontend clients)")
    print(f"  POST /api/logs  - Receive logs (Bearer token required)")
    print(f"  GET  /health    - Health check")
    print(f"Auth: Bearer {AUTH_PASSWORD[:5]}***")
    print(f"Waiting for connections...")
    print("=" * 70)

    app = create_app()
    web.run_app(app, host='0.0.0.0', port=port)
