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
AUTH_PASSWORD = os.environ.get('STREAM_PASSWORD', 'Gho$tline_2025!')

# Store connected WebSocket clients
clients: Set = set()

# Store recent logs (last 100)
recent_logs: list = []
MAX_LOGS = 100

# Spider feed data (in-memory store)
spider_feed_data: dict = {
    "generated_at": None,
    "event_count": 0,
    "events": []
}

# Agent status (in-memory store)
agent_status_data: dict = {
    "status": "offline",
    "updated_at": None
}

# Images store
images_data: list = []

# Division status
division_status_data: dict = {}

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

    # DEBUG: Log ALL incoming requests
    print(f"[HTTP] POST /api/logs from {request.remote}")
    print(f"[HTTP] Auth header: {auth_header[:20]}... (expected: Bearer {AUTH_PASSWORD[:10]}...)")

    if auth_header != f'Bearer {AUTH_PASSWORD}':
        print(f"[HTTP] ❌ UNAUTHORIZED from {request.remote}")
        print(f"[HTTP]    Got:      '{auth_header}'")
        print(f"[HTTP]    Expected: 'Bearer {AUTH_PASSWORD}'")
        response = web.json_response({'error': 'Unauthorized'}, status=401)
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    try:
        # Parse JSON body
        event = await request.json()

        # DEBUG: Log received event
        print(f"[HTTP] ✓ Authorized - received event: level={event.get('level')}, message={event.get('message', '')[:40]}...")

        # SECURITY: Limit message size to prevent DoS (5000 chars = ~1-2 paragraphs)
        message_text = event.get('message', '')
        if len(message_text) > 5000:
            print(f"[HTTP] WARNING: Message too long ({len(message_text)} chars), truncating to 5000")
            event['message'] = message_text[:5000] + '... [TRUNCATED]'

        # Convert to frontend format and broadcast
        message = convert_event_to_frontend_format(event)

        # Store in recent logs
        recent_logs.append(message)
        if len(recent_logs) > MAX_LOGS:
            recent_logs.pop(0)

        print(f"[HTTP] Broadcasting to {len(clients)} clients...")
        await broadcast_log(message)

        print(f"[HTTP] ✓ Broadcast complete")

        response = web.json_response({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    except json.JSONDecodeError:
        print(f"[HTTP] ❌ Invalid JSON from {request.remote}")
        return web.json_response({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"[HTTP] ❌ Error: {type(e).__name__}: {e}")
        return web.json_response({'error': str(e)}, status=500)


async def handle_get_logs(request):
    """Handle HTTP GET /api/logs - retrieve recent logs for polling"""
    print(f"[HTTP] GET /api/logs from {request.remote} - returning {len(recent_logs)} logs")

    # CORS headers for ghostline.live
    response = web.json_response({'logs': recent_logs})
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'

    return response


async def handle_health(request):
    """Health check endpoint"""
    response = web.json_response({
        'status': 'ok',
        'clients': len(clients),
        'server': 'Ghostline Stream Server'
    })
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


async def handle_spider_log_get(request):
    """GET /api/spider-log.json — return spider feed for frontend"""
    response = web.json_response(spider_feed_data)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Cache-Control'] = 'no-cache'
    return response


async def handle_spider_log_post(request):
    """POST /api/spider-log.json — receive spider feed from spider process"""
    auth_header = request.headers.get('Authorization', '')
    if auth_header != f'Bearer {AUTH_PASSWORD}':
        return web.json_response({'error': 'Unauthorized'}, status=401)

    global spider_feed_data
    try:
        data = await request.json()
        spider_feed_data = data
        print(f"[SpiderFeed] Updated: {data.get('event_count', 0)} events, generated_at: {data.get('generated_at')}")
        response = web.json_response({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)


async def handle_agent_status(request):
    """GET /api/agent-status — return agent status"""
    response = web.json_response(agent_status_data)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


async def handle_agent_status_post(request):
    """POST /api/agent-status — update agent status"""
    auth_header = request.headers.get('Authorization', '')
    if auth_header != f'Bearer {AUTH_PASSWORD}':
        return web.json_response({'error': 'Unauthorized'}, status=401)

    global agent_status_data
    try:
        agent_status_data = await request.json()
        agent_status_data['updated_at'] = datetime.now().isoformat()
        response = web.json_response({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)


async def handle_images_get(request):
    """GET /api/images — return images list"""
    response = web.json_response({'images': images_data})
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


async def handle_images_post(request):
    """POST /api/images — update images list"""
    auth_header = request.headers.get('Authorization', '')
    if auth_header != f'Bearer {AUTH_PASSWORD}':
        return web.json_response({'error': 'Unauthorized'}, status=401)

    global images_data
    try:
        data = await request.json()
        images_data = data.get('images', data if isinstance(data, list) else [])
        response = web.json_response({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)


async def handle_division_status(request):
    """GET /api/division-status.json — return division status"""
    response = web.json_response(division_status_data)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


async def handle_division_status_post(request):
    """POST /api/division-status.json — update division status"""
    auth_header = request.headers.get('Authorization', '')
    if auth_header != f'Bearer {AUTH_PASSWORD}':
        return web.json_response({'error': 'Unauthorized'}, status=401)

    global division_status_data
    try:
        division_status_data = await request.json()
        response = web.json_response({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)


async def handle_cors_preflight(request):
    """Handle CORS preflight OPTIONS requests"""
    response = web.Response()
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response


def create_app():
    """Create aiohttp application"""
    app = web.Application()

    # Routes
    app.router.add_get('/ws', handle_websocket)  # WebSocket endpoint
    app.router.add_post('/api/logs', handle_log_post)  # HTTP POST for logs
    app.router.add_get('/api/logs', handle_get_logs)  # HTTP GET for recent logs
    app.router.add_options('/api/logs', handle_cors_preflight)  # CORS preflight
    app.router.add_get('/health', handle_health)  # Health check
    app.router.add_options('/health', handle_cors_preflight)  # CORS preflight

    # Spider feed
    app.router.add_get('/api/spider-log.json', handle_spider_log_get)
    app.router.add_post('/api/spider-log.json', handle_spider_log_post)
    app.router.add_options('/api/spider-log.json', handle_cors_preflight)

    # Agent status
    app.router.add_get('/api/agent-status', handle_agent_status)
    app.router.add_post('/api/agent-status', handle_agent_status_post)
    app.router.add_options('/api/agent-status', handle_cors_preflight)

    # Images
    app.router.add_get('/api/images', handle_images_get)
    app.router.add_post('/api/images', handle_images_post)
    app.router.add_options('/api/images', handle_cors_preflight)

    # Division status
    app.router.add_get('/api/division-status.json', handle_division_status)
    app.router.add_post('/api/division-status.json', handle_division_status_post)
    app.router.add_options('/api/division-status.json', handle_cors_preflight)

    return app


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))

    print("=" * 70)
    print("🟢 GHOSTLINE STREAM SERVER 🟢")
    print("=" * 70)
    print(f"Server: http://0.0.0.0:{port}")
    print(f"  GET  /ws                    - WebSocket (frontend clients)")
    print(f"  POST /api/logs              - Receive logs (Bearer token)")
    print(f"  GET  /api/logs              - Retrieve recent logs")
    print(f"  GET  /api/spider-log.json   - Spider feed (GET/POST)")
    print(f"  GET  /api/agent-status      - Agent status (GET/POST)")
    print(f"  GET  /api/images            - Images (GET/POST)")
    print(f"  GET  /api/division-status   - Division status (GET/POST)")
    print(f"  GET  /health                - Health check")
    print(f"Auth: Bearer {AUTH_PASSWORD[:5]}***")
    print(f"Waiting for connections...")
    print("=" * 70)

    app = create_app()
    web.run_app(app, host='0.0.0.0', port=port)
