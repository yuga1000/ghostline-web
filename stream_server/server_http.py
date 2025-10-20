#!/usr/bin/env python3
"""
Ghostline Stream Server for Railway (HTTP + WebSocket)
HTTP endpoint for receiving logs, WebSocket for broadcasting
"""

import asyncio
import websockets
import json
import os
import time
from datetime import datetime
from typing import Set
from aiohttp import web

# Auth password from environment
AUTH_PASSWORD = os.environ.get('STREAM_PASSWORD', 'ghostline2025')

# Store connected WebSocket clients
clients: Set = set()


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


async def register_client(websocket):
    """Register a new WebSocket client"""
    clients.add(websocket)
    print(f"[WebSocket] Client connected. Total clients: {len(clients)}")


async def unregister_client(websocket):
    """Unregister a disconnected WebSocket client"""
    clients.remove(websocket)
    print(f"[WebSocket] Client disconnected. Total clients: {len(clients)}")


async def broadcast_log(message: dict):
    """Broadcast log message to all connected WebSocket clients"""
    if clients:
        await asyncio.gather(
            *[client.send(json.dumps(message)) for client in clients],
            return_exceptions=True
        )


async def handle_websocket_client(websocket):
    """Handle WebSocket client connection (frontend)"""
    await register_client(websocket)
    try:
        async for message in websocket:
            # Echo back if client sends anything (for testing)
            print(f"[WebSocket] Received from client: {message}")
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        await unregister_client(websocket)


async def handle_log_post(request):
    """Handle HTTP POST /api/logs - receive logs from MacBook"""
    # Check authorization header
    auth_header = request.headers.get('Authorization', '')

    if auth_header != f'Bearer {AUTH_PASSWORD}':
        return web.json_response({'error': 'Unauthorized'}, status=401)

    try:
        # Parse JSON body
        event = await request.json()

        # Convert to frontend format and broadcast
        message = convert_event_to_frontend_format(event)
        await broadcast_log(message)

        print(f"[HTTP] Received log: {event.get('message', '')[:50]}...")

        return web.json_response({'status': 'ok'})

    except json.JSONDecodeError:
        return web.json_response({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"[HTTP] Error: {e}")
        return web.json_response({'error': str(e)}, status=500)


async def start_servers():
    """Start both HTTP and WebSocket servers"""
    port = int(os.environ.get('PORT', 8080))

    print("=" * 70)
    print("🟢 GHOSTLINE STREAM SERVER (HTTP + WebSocket) 🟢")
    print("=" * 70)
    print(f"HTTP Server: http://0.0.0.0:{port}")
    print(f"  POST /api/logs - Receive logs (with Bearer token)")
    print(f"WebSocket Server: ws://0.0.0.0:{port}/ws")
    print(f"Auth: Password required (Bearer token)")
    print(f"Waiting for connections...")
    print("=" * 70)

    # Create HTTP app
    app = web.Application()
    app.router.add_post('/api/logs', handle_log_post)

    # Create HTTP server runner
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()

    # Start WebSocket server on same port, different path
    # Note: We'll use a different port for WebSocket since Railway only gives one PORT
    ws_port = port + 1000  # Temporary workaround

    print(f"⚠️  WebSocket on port {ws_port} (internal only)")

    async with websockets.serve(handle_websocket_client, '0.0.0.0', ws_port):
        # Run forever
        await asyncio.Future()


if __name__ == '__main__':
    try:
        asyncio.run(start_servers())
    except KeyboardInterrupt:
        print("\n[Stream Server] Shutting down...")
