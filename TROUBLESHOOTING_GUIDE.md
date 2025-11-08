# Agent Pet System - Troubleshooting Guide

Quick reference for diagnosing issues with the Agent Pet system.

---

## Quick Diagnostic Commands

Open browser console (F12) on `stream.html` and run these:

```javascript
// WebSocket Status
ws.readyState           // 1 = connected, 3 = disconnected
isConnected            // true/false

// Pet Status
petIsAwake             // true/false
petAnimationState      // 'idle', 'walking', 'sleeping', etc.
petStage               // 1, 2, 3, or 4
petLogCount           // Number of logs received

// Countdown Status
restCountdownEndTime   // null or timestamp (milliseconds)
isInFlowerMode        // true/false

// Last log received (seconds ago)
Math.floor((Date.now() - lastLogTime) / 1000)
```

---

## Issue #1: Logs Not Appearing

**Symptoms**:
- Terminal shows "STANDBY" but no logs appear
- Console shows `[WS] ✓ Connected` but no messages

**Diagnosis Steps**:

1. Check WebSocket connection:
   ```javascript
   ws.readyState  // Should be 1 (OPEN)
   ```

2. Check if vercept is actually running:
   - Open MacBook terminal
   - Look for vercept Python process: `ps aux | grep vercept`

3. Check if vercept is sending logs:
   - In vercept terminal, look for console output
   - Check stream_logger.py output: "✓ Connected to Railway stream server"

4. Check browser console for errors:
   - Look for `[WS] Error:` messages
   - Look for `[WS] Disconnected` messages

**Common Causes**:

| Symptom | Cause | Solution |
|---------|-------|----------|
| `readyState: 3` | WebSocket disconnected | Refresh page |
| No `[WS] ⬇ Message received` | Vercept not running | Start vercept |
| `[WS] Error:` messages | Network/Railway issue | Check Railway deployment |
| `stream_available = False` | Railway server down | Check Railway logs |

**Manual Fix**:

If logs aren't flowing, try this in console:
```javascript
// Reconnect WebSocket
initWebSocket()
```

---

## Issue #2: Countdown Not Showing

**Symptoms**:
- Vercept finishes cycle but "REST: X:XX" doesn't appear
- Countdown container hidden

**Diagnosis Steps**:

1. Check if countdown is active:
   ```javascript
   restCountdownEndTime  // Should be a number, not null
   ```

2. Check if container is visible:
   ```javascript
   document.getElementById('rest-countdown-container').style.display
   // Should be 'block' when countdown active
   ```

3. Check console for detection logs:
   - Look for: `[Pet] Detected rest period: X minutes`
   - Look for: `[Countdown] Starting rest countdown`

**Common Causes**:

| Symptom | Cause | Solution |
|---------|-------|----------|
| `restCountdownEndTime: null` | No countdown detected | Vercept not in night mode |
| Container `display: none` | Countdown never started | Check logs for "Cooldown period" |
| No detection logs | Pattern not matching | Check vercept log format |

**Test Pattern Matching**:

Run this in console with a sample log line:
```javascript
const testLog = "Cooldown period: 45 minutes before next iteration...";
detectRestPeriod(testLog);  // Should log: "[Pet] Detected rest period: 45 minutes"
```

**Manual Start** (for testing):
```javascript
// Start 1-minute countdown
startRestCountdown(60)
```

---

## Issue #3: Pet Not Transforming to Flower

**Symptoms**:
- Countdown shows but pet stays normal size
- Stage doesn't change to "4 (BLOOM)"

**Diagnosis Steps**:

1. Check flower mode flag:
   ```javascript
   isInFlowerMode  // Should be true during countdown
   ```

2. Check pet classes:
   ```javascript
   document.getElementById('agent-pet').className
   // Should include 'stage-4' and 'sleeping'
   ```

3. Check console for transformation logs:
   - Look for: `[Pet] Transforming to flower mode`
   - Look for: `[Pet] Flower transformation complete`

**Common Causes**:

| Symptom | Cause | Solution |
|---------|-------|----------|
| `isInFlowerMode: false` | Transformation not triggered | Countdown didn't call transformToFlower() |
| No `stage-4` class | CSS class not applied | Check transformToFlower() function |
| Pet not green | Not sleeping | transformToFlower() calls goToSleep() first |

**Manual Transformation** (for testing):
```javascript
transformToFlower()    // Transform to flower
transformFromFlower()  // Return to normal
```

---

## Issue #4: Pet Animations Not Visible

**Symptoms**:
- Pet appears static (not moving)
- No walking, waving, dancing animations

**Diagnosis Steps**:

1. Check if pet is awake:
   ```javascript
   petIsAwake  // Should be true when logs arrive
   ```

2. Check animation state:
   ```javascript
   petAnimationState  // 'idle', 'walking', 'dancing', etc.
   ```

3. Check if idle loop is running:
   ```javascript
   idleAnimationInterval  // Should be a number (interval ID), not null
   ```

4. Check console for animation logs:
   - Look for: `[Pet Animation] Starting idle animation loop`
   - Look for: `[Pet Animation] Idle loop tick - rand: 0.XX`
   - Look for: `[Pet Animation] Triggering: walking for 3000ms`

**Common Causes**:

| Symptom | Cause | Solution |
|---------|-------|----------|
| `petIsAwake: false` | Pet is sleeping | Wait for logs to wake up pet |
| `idleAnimationInterval: null` | Loop not started | Idle loop should start on wakeUpPet() |
| No animation logs | Loop not ticking | Check console for errors |
| CSS not applied | Class not added | Check pet.className |

**Animation Class Check**:
```javascript
const pet = document.getElementById('agent-pet');
console.log('Pet classes:', pet.className);
// Should show: 'pet active idle stage-2' (or similar)
// Active animations add: 'walking', 'waving', 'dancing', etc.
```

**Manual Trigger** (for testing):
```javascript
// Wake up pet first
wakeUpPet()

// Then trigger animations
triggerPetAnimation('walking', 3000)   // Walk for 3 seconds
triggerPetAnimation('dancing', 3000)   // Dance for 3 seconds
triggerPetAnimation('waving', 2500)    // Wave for 2.5 seconds
triggerPetAnimation('playing', 3000)   // Play for 3 seconds
triggerPetAnimation('blinking', 2000)  // Blink for 2 seconds
```

**Expected CSS Animation**:

Each animation class triggers CSS keyframes:
- `.pet.walking` → `@keyframes leg-step-1/2/3/4`
- `.pet.dancing` → `@keyframes legs-dance`
- `.pet.waving` → `@keyframes arm-wave`
- `.pet.blinking` → `@keyframes eye-blink`
- `.pet.playing` → `@keyframes legs-wiggle`

Check browser DevTools → Elements → Inspect pet → Check "Animations" tab

---

## Issue #5: Image Preview Not Showing

**Symptoms**:
- Vercept generates image but preview doesn't appear
- Image window stays hidden

**Diagnosis Steps**:

1. Check if image detection is active:
   ```javascript
   window.expectingImageFilename  // true after "IMAGE GENERATED" log
   ```

2. Check if image window is visible:
   ```javascript
   const imgWindow = document.getElementById('pet-image-window');
   console.log('Opacity:', imgWindow.style.opacity);
   console.log('Classes:', imgWindow.className);
   // Should be opacity: 1 and class: 'fade-in'
   ```

3. Check console for detection logs:
   - Look for: `[Image Display] Found IMAGE GENERATED marker`
   - Look for: `[Image Display] Found filename: Angel_20251105_HHMMSS.png`
   - Look for: `[Image Display] Constructed image path: /generated-images/...`

4. Check if image loaded successfully:
   ```javascript
   const img = document.getElementById('pet-image-preview');
   console.log('Image src:', img.src);
   console.log('Image naturalWidth:', img.naturalWidth);
   // naturalWidth > 0 means image loaded successfully
   ```

**Common Causes**:

| Symptom | Cause | Solution |
|---------|-------|----------|
| No detection logs | Pattern not matching | Check vercept log format |
| `expectingImageFilename: false` | Filename never found | Check next log after "IMAGE GENERATED" |
| Image fails to load | Wrong path | Check server.js /generated-images/ route |
| `naturalWidth: 0` | Image not found | Check GLVSF_Images folder for file |

**Test Image Path**:

Run this in console to verify image route:
```javascript
// Test if server is serving images
fetch('/generated-images/test.png')
    .then(r => console.log('Status:', r.status))
    .catch(e => console.error('Error:', e));
// Status: 200 = working, 404 = not found
```

**Manual Image Display** (for testing):

```javascript
// Display a specific image (replace with actual filename)
showImagePreview('/generated-images/Angel_20251105_123456.png')
```

**Check Server Route**:

In server.js, verify this line exists:
```javascript
const GENERATED_IMAGES_PATH = path.join(__dirname, '..', '..', 'Documents', 'Ghostline_art_module', 'art_outputs', 'generated', 'GLVSF_Images');
app.use('/generated-images', express.static(GENERATED_IMAGES_PATH));
```

**Verify Folder Path**:

In terminal:
```bash
ls -la /Users/yuga/Documents/Ghostline_art_module/art_outputs/generated/GLVSF_Images/
# Should show generated .png files
```

---

## WebSocket Connection Issues

### Symptom: `readyState: 0` (CONNECTING) for >10 seconds

**Cause**: WebSocket can't reach Railway server

**Check**:
1. Railway deployment status: https://ghostline-web-production-7bc6.up.railway.app/health
2. Network connectivity: `ping ghostline-web-production-7bc6.up.railway.app`

**Fix**: Restart Railway deployment or check network firewall

---

### Symptom: `readyState: 3` (CLOSED) immediately after connection

**Cause**: WebSocket handshake failed

**Check console for**:
- `[WS] Error:` message
- Network tab in DevTools → WebSocket connection status

**Common reasons**:
- Railway server not running
- WebSocket path wrong (should be `/ws`)
- CORS issue (unlikely with Railway)

**Fix**: Check Railway logs for server errors

---

## Vercept Not Sending Logs

### Check Vercept Status

In MacBook terminal:
```bash
# Check if vercept is running
ps aux | grep vercept

# Check vercept console output
# Should see: "✓ Connected to Railway stream server"
```

### Check StreamLogger Connection

In vercept Python code (stream_logger.py), check initialization:
```python
self.stream_available = True  # Should be True
self.stream_url = 'https://ghostline-web-production-7bc6.up.railway.app/api/logs'
```

### Test Manual Log Send

In MacBook terminal:
```bash
curl -X POST https://ghostline-web-production-7bc6.up.railway.app/api/logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Gho\$tline_2025!" \
  -d '{"message": "Test log", "level": "INFO", "timestamp": 1699999999}'

# Should return: {"status": "ok"}
```

---

## Railway Server Issues

### Check Railway Server Status

Visit: https://ghostline-web-production-7bc6.up.railway.app/health

Should return:
```json
{
  "status": "ok",
  "clients": 1,
  "server": "Ghostline Stream Server"
}
```

### Check Railway Logs

1. Go to Railway dashboard: https://railway.app
2. Select ghostline-web project
3. Click "Deployments" → "View Logs"
4. Look for:
   - `[WebSocket] Client connected from X.X.X.X. Total: 1`
   - `[HTTP] POST /api/logs from X.X.X.X`
   - `[Broadcast] Sending to 1 clients`

### Check Railway Environment Variables

Required env vars in Railway:
- `STREAM_PASSWORD=Gho$tline_2025!`
- `PORT=8080` (auto-set by Railway)

---

## Emergency Reset Procedures

### Reset WebSocket Connection

```javascript
// In browser console
if (ws) ws.close();
initWebSocket();
```

### Reset Pet State

```javascript
// Clear localStorage
localStorage.removeItem('ghostline-pet-state');

// Reload page
location.reload();
```

### Reset Countdown

```javascript
stopRestCountdown();
```

### Reset Flower Mode

```javascript
if (isInFlowerMode) {
    transformFromFlower();
}
```

### Full Reset

```javascript
// Nuclear option - resets everything
localStorage.clear();
location.reload();
```

---

## Performance Monitoring

### Check Message Rate

```javascript
// In browser console after 1 minute of operation
const messagesPerMinute = (petLogCount / ((Date.now() - startTime) / 60000)).toFixed(2);
console.log('Messages per minute:', messagesPerMinute);
// Typical: 5-20 messages/minute during active generation
```

### Check Animation Performance

```javascript
// Check if animations are dropping frames
const pet = document.getElementById('agent-pet');
const computed = window.getComputedStyle(pet);
console.log('Animation play state:', computed.animationPlayState);
// Should be 'running' when animated
```

### Check Memory Usage

In browser console:
```javascript
// Check number of log lines in DOM
document.getElementById('agent-log-content').children.length
// Should be ≤100 (auto-cleanup after 100 lines)
```

---

## Console Log Patterns

### Normal Operation

```
[WS] ✓ Connected to agent terminal stream
[WS] URL: wss://ghostline-web-production-7bc6.up.railway.app/ws
[WS] ReadyState: 1
[WS] ⬇ Message received at 2025-11-05T10:30:15.123Z
[WS] Data length: 256 bytes
[WS] Parsed message: {type: 'log', level: 'action', content: '▓ Pinterest scraper started...'}
[Pet Animation] Starting idle animation loop
[Pet Animation] Idle loop tick - rand: 0.45
[Pet Animation] Triggering: waving for 2500ms
[Pet Animation] Applied classes: pet active idle waving stage-2
```

### Rest Period Start

```
[Pet] Detected rest period: 45 minutes
[Countdown] Starting rest countdown: 2700 seconds
[Pet] Transforming to flower mode
[Pet] Flower transformation complete
```

### Image Generation Complete

```
[Image Display] Found IMAGE GENERATED marker
[Image Display] Found filename after IMAGE GENERATED: Angel_20251105_103045.png
[Image Display] Constructed image path: /generated-images/Angel_20251105_103045.png
[Image Display] Image loaded successfully!
[Pet Animation] Triggering: dancing for 3000ms
```

---

## Support Checklist

Before reporting an issue, gather this info:

1. **Browser Console Output**:
   - Copy all console logs
   - Note any errors in red

2. **WebSocket Status**:
   ```javascript
   {
     readyState: ws.readyState,
     isConnected: isConnected,
     lastLogTime: new Date(lastLogTime).toISOString()
   }
   ```

3. **Pet Status**:
   ```javascript
   {
     isAwake: petIsAwake,
     state: petAnimationState,
     stage: petStage,
     logCount: petLogCount,
     inFlowerMode: isInFlowerMode
   }
   ```

4. **Countdown Status**:
   ```javascript
   {
     endTime: restCountdownEndTime ? new Date(restCountdownEndTime).toISOString() : null,
     remaining: restCountdownEndTime ? Math.floor((restCountdownEndTime - Date.now()) / 1000) : null
   }
   ```

5. **Vercept Status**:
   - Is vercept running?
   - Console output from vercept
   - Any Python errors?

6. **Railway Status**:
   - Health check: https://ghostline-web-production-7bc6.up.railway.app/health
   - Recent logs from Railway dashboard

---

## Contact

For implementation questions, refer to:
- `/Users/yuga/Desktop/ghostline-web/AGENT_PET_FIXES_REPORT.md` - Full implementation details
- This troubleshooting guide

For Railway/infrastructure issues:
- Check Railway dashboard logs
- Verify environment variables
- Test health endpoint

For vercept/Python issues:
- Check stream_logger.py connection status
- Verify Bearer token matches between vercept and Railway
- Test manual log send with curl command above
