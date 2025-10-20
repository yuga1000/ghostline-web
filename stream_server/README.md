# Ghostline Stream Server

WebSocket server for broadcasting agent logs to ghostline.live/stream.html

## Deploy to Railway

1. **Create new service** on Railway
2. **Connect to GitHub** repo: `yuga1000/ghostline-web`
3. **Set Root Directory**: `stream_server`
4. **Add environment variable**:
   - `STREAM_PASSWORD` = your secret password
5. **Deploy!**

Railway will automatically:
- Install dependencies from `requirements.txt`
- Run `server.py` via Procfile
- Expose WebSocket on `$PORT`

## Architecture

```
MacBook (GLVSF Pipeline)
    ↓ TCP (with password)
Railway Stream Server
    ↓ WebSocket
ghostline.live/stream.html (all devices)
```

## Configuration

### Environment Variables

- `PORT` - WebSocket port (set by Railway automatically)
- `STREAM_PASSWORD` - Password for TCP authentication (set manually)

### Ports

- WebSocket: `PORT` (for frontend clients)
- TCP: `PORT + 1` (for receiving logs from MacBook)

## Usage

### From MacBook (send logs):

```python
import socket
import json

# Send password first
sock = socket.socket()
sock.connect(('your-railway-url.up.railway.app', PORT+1))
sock.send(b'your_password\n')

# Send log event
event = {
    'timestamp': time.time(),
    'level': 'SUCCESS',
    'message': '✓ Generation complete!',
    'metadata': {'pipeline': 'GLVSF'}
}
sock.send((json.dumps(event) + '\n').encode('utf-8'))
sock.close()
```

### From Browser (receive logs):

```javascript
const ws = new WebSocket('wss://your-railway-url.up.railway.app');
ws.onmessage = (event) => {
    const log = JSON.parse(event.data);
    console.log(log.content);
};
```

## Security

- TCP connection requires password authentication
- WebSocket is public (read-only for viewers)
- Only authenticated senders can push logs

---

**Deployed at**: https://ghostline-stream.up.railway.app (example)
