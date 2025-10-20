#!/usr/bin/env python3
"""
Ghostline Stream Server for Railway
WebSocket server for broadcasting logs to ghostline.live
"""

import asyncio
import websockets
import json
import os
import time
from datetime import datetime
from typing import Set

# Auth password from environment
AUTH_PASSWORD = os.environ.get('STREAM_PASSWORD', 'ghostline2025')

# Store connected clients
clients: Set = set()


def convert_event_to_frontend_format(event: dict) -> dict:
    """
    Convert log event to frontend WebSocket format.
    """
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
    print(f"[Stream Server] Client connected. Total clients: {len(clients)}")


async def unregister_client(websocket):
    """Unregister a disconnected WebSocket client"""
    clients.remove(websocket)
    print(f"[Stream Server] Client disconnected. Total clients: {len(clients)}")


async def broadcast_log(message: dict):
    """Broadcast log message to all connected clients"""
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
            print(f"[Stream Server] Received from client: {message}")
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        await unregister_client(websocket)


async def handle_tcp_client(reader, writer):
    """Handle TCP client connection (receives logs from pipeline)"""
    addr = writer.get_extra_info('peername')
    print(f"[TCP] Connection from {addr}")

    # Simple auth: first line should be password
    try:
        auth_line = await asyncio.wait_for(reader.readline(), timeout=5.0)
        password = auth_line.decode('utf-8').strip()

        if password != AUTH_PASSWORD:
            print(f"[TCP] Auth failed from {addr}")
            writer.close()
            await writer.wait_closed()
            return

        print(f"[TCP] Auth success from {addr}")

        # Now receive log events
        while True:
            data = await reader.readline()
            if not data:
                break

            # Parse JSON event
            try:
                event = json.loads(data.decode('utf-8'))
                # Convert to frontend format and broadcast
                message = convert_event_to_frontend_format(event)
                await broadcast_log(message)
            except json.JSONDecodeError:
                pass  # Invalid JSON, skip
    except asyncio.TimeoutError:
        print(f"[TCP] Auth timeout from {addr}")
    except Exception as e:
        print(f"[TCP] Error: {e}")
    finally:
        writer.close()
        await writer.wait_closed()


async def main():
    """Start WebSocket server and TCP listener"""
    # Get port from environment (Railway provides PORT)
    ws_port = int(os.environ.get('PORT', 8765))
    tcp_port = ws_port + 1  # TCP on PORT+1

    print("=" * 70)
    print("🟢 GHOSTLINE STREAM SERVER 🟢")
    print("=" * 70)
    print(f"WebSocket Server: ws://0.0.0.0:{ws_port}")
    print(f"TCP Log Receiver: 0.0.0.0:{tcp_port}")
    print(f"Auth: Password required for TCP")
    print(f"Waiting for connections...")
    print("=" * 70)

    # Start TCP server for receiving logs from pipelines
    tcp_server = await asyncio.start_server(
        handle_tcp_client, '0.0.0.0', tcp_port
    )

    # Start WebSocket server for frontend clients
    async with websockets.serve(handle_websocket_client, '0.0.0.0', ws_port):
        # Run both servers forever
        async with tcp_server:
            await asyncio.Future()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[Stream Server] Shutting down...")
