# ROADMAP: Railway Stream Server Integration

## CURRENT STATUS (2025-10-20)

✅ **COMPLETED:**
- Stream server code deployed to GitHub (`stream_server/` directory)
- Railway-ready server with password authentication
- Local testing successful (Chrome on MacBook)
- Placeholder behavior fixed (clears old logs on disconnect)

🔄 **IN PROGRESS:**
- Waiting for Railway deployment

❌ **NOT YET DONE:**
- Update frontend to use Railway WebSocket URL
- Update MacBook to send logs to Railway with password auth

---

## ARCHITECTURE OVERVIEW

```
MacBook (GLVSF Pipeline)
    ↓ TCP + Password Auth
Railway Stream Server (Cloud)
    ↓ WebSocket (Public)
ghostline.live/stream.html (All Devices)
```

**Why Railway?**
- `localhost` only works on MacBook Chrome
- Tablet/Safari/other devices can't connect to `localhost`
- Railway provides public URL accessible from anywhere

---

## NEXT STEPS (AFTER RAILWAY DEPLOYS)

### 1. Get Railway Deployment Info

User will deploy to Railway and get:
- **WebSocket URL:** `wss://ghostline-stream-production.up.railway.app` (example)
- **TCP Port:** Railway's `$PORT + 1` (usually 443 + 1 = 444, or they'll specify)
- **Password:** User chose password in Railway environment variables (`STREAM_PASSWORD`)

### 2. Update Frontend WebSocket Connection

**File:** `/Users/yuga/Desktop/ghostline-web/stream.html`

**Change this line (around line 150):**
```javascript
// OLD (localhost only):
ws = new WebSocket('ws://localhost:8765');

// NEW (Railway public URL):
ws = new WebSocket('wss://YOUR-RAILWAY-URL.up.railway.app');
```

**Important:**
- Use `wss://` (secure WebSocket) not `ws://`
- Don't include port number - Railway handles this automatically
- Keep all other WebSocket code the same

**Then commit and push:**
```bash
cd /Users/yuga/Desktop/ghostline-web
git add stream.html
git commit -m "Update WebSocket to Railway URL"
git push origin main
```

### 3. Update MacBook StreamLogger to Send to Railway

**File:** `/Users/yuga/Documents/Ghostline_art_module/core/stream/stream_logger.py`

**Find the `_send_to_stream_server()` method (around line 200)** and update:

```python
def _send_to_stream_server(self, event: Dict[str, Any]):
    """Send log event to stream server via TCP socket"""
    if not self.stream_socket_available:
        return

    try:
        # Railway TCP endpoint
        RAILWAY_HOST = 'your-railway-url.up.railway.app'  # ← UPDATE THIS
        RAILWAY_TCP_PORT = 444  # ← UPDATE THIS (usually PORT+1)
        RAILWAY_PASSWORD = 'your_password'  # ← UPDATE THIS

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2.0)
        sock.connect((RAILWAY_HOST, RAILWAY_TCP_PORT))

        # Send password first (required by Railway server)
        sock.send((RAILWAY_PASSWORD + '\n').encode('utf-8'))

        # Then send log event
        message = json.dumps(event, ensure_ascii=False) + '\n'
        sock.sendall(message.encode('utf-8'))
        sock.close()
    except Exception as e:
        # Server not available, disable future attempts temporarily
        self.stream_socket_available = False
        print(f"[StreamLogger] Failed to send to Railway: {e}")
```

**Also update the initialization check (around line 150):**
```python
# Try to connect to Railway stream server
self.stream_socket_available = False
try:
    RAILWAY_HOST = 'your-railway-url.up.railway.app'  # ← UPDATE THIS
    RAILWAY_TCP_PORT = 444  # ← UPDATE THIS
    RAILWAY_PASSWORD = 'your_password'  # ← UPDATE THIS

    test_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    test_sock.settimeout(1.0)
    test_sock.connect((RAILWAY_HOST, RAILWAY_TCP_PORT))

    # Test auth
    test_sock.send((RAILWAY_PASSWORD + '\n').encode('utf-8'))
    test_sock.close()

    self.stream_socket_available = True
    print(f"✓ Connected to Railway stream server")
except Exception as e:
    print(f"⚠️  Railway stream server not available: {e}")
```

### 4. Test Complete Flow

1. **Start GLVSF Pipeline on MacBook**
   ```bash
   cd /Users/yuga/Documents/Ghostline_art_module
   source venv/bin/activate
   python3 tools/art_agent_unified.py
   ```

2. **Run Night Mode Generation**
   - Click "Start Night Mode" in GUI

3. **Check Logs Appear on ALL Devices**
   - Open `https://ghostline.live/stream.html` on:
     - MacBook Chrome ✓
     - MacBook Safari ✓
     - Tablet ✓
     - Phone ✓
     - Any other device ✓

4. **Verify Placeholder Behavior**
   - Close Vercept agent
   - Noise-mask placeholder should return
   - Old logs should clear
   - Uptime should reset to `--:--:--`

---

## TROUBLESHOOTING

### Frontend not connecting?
- Check browser console for errors
- Verify Railway WebSocket URL is correct
- Try `wss://` vs `ws://`
- Check Railway deployment status

### MacBook not sending logs?
- Check TCP port is correct (usually `$PORT + 1`)
- Verify password matches Railway environment variable
- Check Railway logs for auth failures
- Ensure MacBook has internet connection

### Logs appearing but placeholder not clearing?
- Already fixed in latest code
- If still broken, check `showPlaceholder()` function clears `innerHTML`

### Railway server crashing?
- Check Railway logs
- Verify `requirements.txt` has `websockets==15.0.1`
- Ensure `Procfile` says `web: python server.py`

---

## FILE LOCATIONS REFERENCE

**Railway Stream Server (GitHub):**
- `/Users/yuga/Desktop/ghostline-web/stream_server/server.py`
- `/Users/yuga/Desktop/ghostline-web/stream_server/requirements.txt`
- `/Users/yuga/Desktop/ghostline-web/stream_server/Procfile`
- `/Users/yuga/Desktop/ghostline-web/stream_server/README.md`

**Frontend:**
- `/Users/yuga/Desktop/ghostline-web/stream.html` (WebSocket client)

**MacBook Pipeline:**
- `/Users/yuga/Documents/Ghostline_art_module/core/stream/stream_logger.py` (TCP sender)
- `/Users/yuga/Documents/Ghostline_art_module/core/utils/ascii_logger.py` (Visual logger)
- `/Users/yuga/Documents/Ghostline_art_module/core/vercept/run_glvsf_image_pipeline.py` (Main pipeline)

**Local Stream Server (for testing):**
- `/Users/yuga/Documents/Ghostline_art_module/core/stream/log_stream_server.py`
- Only use for local testing, not for production

---

## RAILWAY DEPLOYMENT CHECKLIST

When user says "Railway is deployed", ask for:
1. ✅ Railway WebSocket URL (e.g., `ghostline-stream-production.up.railway.app`)
2. ✅ TCP Port (usually `$PORT + 1`, Railway will show this)
3. ✅ Password they set in `STREAM_PASSWORD` environment variable

Then execute steps 2, 3, 4 above.

---

## EXPECTED BEHAVIOR AFTER DEPLOYMENT

**When Agent is Running:**
- Status: `STREAMING` (green indicator)
- Logs appear in real-time on all devices
- Uptime counter running
- Auto-scroll to latest logs

**When Agent is Stopped:**
- Status: `STANDBY` (gray indicator)
- Noise-mask placeholder visible
- No old logs visible
- Uptime shows `--:--:--`

**On Connection Issues:**
- Auto-reconnect every 5 seconds
- Status shows `STANDBY`
- Placeholder remains visible

---

## IMPORTANT NOTES

- **Password Security:** Never commit password to GitHub - only use Railway environment variables
- **WebSocket Protocol:** Railway uses `wss://` (secure), localhost uses `ws://` (insecure)
- **TCP vs WebSocket:** MacBook sends via TCP (write), browsers receive via WebSocket (read)
- **Port Assignment:** Railway auto-assigns `$PORT`, TCP is always `$PORT + 1`
- **Format Conversion:** Railway server converts StreamLogger format → frontend format
- **No Welcome Message:** Server should NOT send "Connected" message (already removed)

---

## WHAT WAS ALREADY FIXED

1. ✅ Vercept launches correctly (regex bug fixed in `security_filters.py`)
2. ✅ File path issue fixed (temp folder copied before playbook creation)
3. ✅ Placeholder clears old logs on disconnect
4. ✅ No welcome message spam
5. ✅ websockets 15.x API compatibility
6. ✅ Local testing working on MacBook Chrome
7. ✅ All Railway deployment files ready in GitHub

---

**END OF ROADMAP**

User will provide Railway deployment URL when ready.
Then update steps 2, 3, and test step 4.
