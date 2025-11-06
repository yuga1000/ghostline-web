const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SLUG = process.env.ADMIN_SLUG || 'admin';
const ADMIN_IP_ALLOW = (process.env.ADMIN_IP_ALLOW || '').split(',').map(s => s.trim()).filter(Boolean);

// Trust Railway proxy
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
// Increase payload limit to 10MB for base64-encoded images
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser(SESSION_SECRET));

// Basic rate limits (adjust as needed)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use('/api/login', authLimiter);

function isIpAllowed(req) {
  if (!ADMIN_IP_ALLOW.length) return true;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
  return ADMIN_IP_ALLOW.some(prefix => ip.startsWith(prefix));
}

function requireAdmin(req, res, next) {
  if (!isIpAllowed(req)) return res.status(403).send('Forbidden');
  const token = req.signedCookies && req.signedCookies.gl_admin;
  if (!token) return res.status(401).send('Unauthorized');
  try {
    const [ts, sig] = token.split('.');
    const h = crypto.createHmac('sha256', SESSION_SECRET).update(ts).digest('hex');
    const age = Date.now() - Number(ts);
    if (h !== sig || age > 24 * 60 * 60 * 1000) return res.status(401).send('Unauthorized');
    return next();
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
}

app.post('/api/login', (req, res) => {
  const { password, remember } = req.body || {};
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return res.status(403).json({ message: 'Wrong password' });
  }
  const ts = Date.now().toString();
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(ts).digest('hex');
  const token = `${ts}.${sig}`;
  const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30d or 24h
  res.cookie('gl_admin', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    signed: true,
    maxAge,
    path: '/',
  });
  res.json({ message: 'success' });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('gl_admin', { path: '/' });
  res.json({ message: 'logged_out' });
});

// Log streaming endpoint for Ghostline Agent
const LOG_STREAM_PASSWORD = process.env.LOG_STREAM_PASSWORD || 'Gho$tline_2025!';
const recentLogs = []; // Keep last 100 logs in memory
const MAX_LOGS = 100;
const recentImages = []; // Keep last 10 images in memory
const MAX_IMAGES = 10;

app.post('/api/logs', (req, res) => {
  // Check Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Logs API] Missing or invalid Authorization header');
    return res.status(401).json({ error: 'Unauthorized - missing Bearer token' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '
  console.log('[Logs API] Received token:', JSON.stringify(token));
  console.log('[Logs API] Expected token:', JSON.stringify(LOG_STREAM_PASSWORD));
  console.log('[Logs API] Token length:', token.length, 'vs', LOG_STREAM_PASSWORD.length);
  console.log('[Logs API] Tokens match:', token === LOG_STREAM_PASSWORD);

  if (token !== LOG_STREAM_PASSWORD) {
    console.log('[Logs API] Token mismatch - rejecting request');
    return res.status(401).json({ error: 'Unauthorized - invalid token' });
  }

  // Store log
  const logEvent = req.body;
  console.log('[Logs API] Storing log:', logEvent.message);
  recentLogs.push(logEvent);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.shift(); // Remove oldest
  }

  res.json({ status: 'ok' });
});

// Get recent logs (for stream.html) - GET endpoint
app.get('/api/logs', (req, res) => {
  console.log('[Logs API] GET request - returning', recentLogs.length, 'logs');
  res.json({ logs: recentLogs });
});

// Image streaming endpoint for Ghostline Agent
app.post('/api/images', (req, res) => {
  // Check Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Images API] Missing or invalid Authorization header');
    return res.status(401).json({ error: 'Unauthorized - missing Bearer token' });
  }

  const token = authHeader.substring(7);
  if (token !== LOG_STREAM_PASSWORD) {
    console.log('[Images API] Token mismatch - rejecting request');
    return res.status(401).json({ error: 'Unauthorized - invalid token' });
  }

  // Store image
  const imageEvent = req.body;
  console.log('[Images API] Storing image:', imageEvent.filename);
  recentImages.push(imageEvent);
  if (recentImages.length > MAX_IMAGES) {
    recentImages.shift(); // Remove oldest
  }

  res.json({ status: 'ok' });
});

// Get recent images (for stream.html) - GET endpoint
app.get('/api/images', (req, res) => {
  console.log('[Images API] GET request - returning', recentImages.length, 'images');
  res.json({ images: recentImages });
});

// Agent status endpoint - checks if agent is in cooldown based on recent logs
app.get('/api/agent-status', (req, res) => {
  console.log('[Agent Status API] Checking agent status from recent logs');

  let status = 'idle'; // idle, working, cooldown
  let cooldownMinutes = 0;
  let cooldownStartTime = null;

  // Check recent logs for cooldown messages
  for (let i = recentLogs.length - 1; i >= 0; i--) {
    const log = recentLogs[i];
    const message = log.message || '';

    // Check for cooldown message: "Cooldown period: X minutes before next iteration..."
    const cooldownMatch = message.match(/Cooldown period: (\d+) minutes/i);
    if (cooldownMatch) {
      status = 'cooldown';
      cooldownMinutes = parseInt(cooldownMatch[1]);
      cooldownStartTime = log.timestamp;
      console.log('[Agent Status API] Found cooldown:', cooldownMinutes, 'minutes at', cooldownStartTime);
      break;
    }

    // Check for working indicators
    if (message.includes('GLVSF Image') || message.includes('Vercept is') || message.includes('Starting')) {
      status = 'working';
      console.log('[Agent Status API] Found working indicator');
      break;
    }
  }

  // If we found cooldown, calculate remaining time
  let remainingMinutes = 0;
  if (status === 'cooldown' && cooldownStartTime) {
    const elapsed = (Date.now() - new Date(cooldownStartTime).getTime()) / 1000 / 60; // minutes
    remainingMinutes = Math.max(0, cooldownMinutes - elapsed);

    // If cooldown expired, change status to idle
    if (remainingMinutes <= 0) {
      status = 'idle';
      console.log('[Agent Status API] Cooldown expired');
    }
  }

  console.log('[Agent Status API] Returning status:', status, 'remaining:', remainingMinutes);

  res.json({
    status,
    cooldownMinutes: Math.ceil(remainingMinutes),
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify deployment
app.get('/api/test-deployment', (req, res) => {
  res.json({ status: 'ok', message: 'Deployment verified', timestamp: new Date().toISOString() });
});

// Hide admin entry under secret slug - show login form if not authenticated
app.get(`/${ADMIN_SLUG}`, (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  // Check if already authenticated
  const token = req.signedCookies && req.signedCookies.gl_admin;
  if (token) {
    try {
      const [ts, sig] = token.split('.');
      const h = crypto.createHmac('sha256', SESSION_SECRET).update(ts).digest('hex');
      const age = Date.now() - Number(ts);
      if (h === sig && age < 24 * 60 * 60 * 1000) {
        // Valid token - show admin panel
        return res.sendFile(path.join(__dirname, 'admin.html'));
      }
    } catch (e) {
      // Invalid token - clear it and show login
      res.clearCookie('gl_admin', { path: '/' });
    }
  }

  // Not authenticated - show login form
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GHOSTLINE - Login</title>
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
    <style>
        body {
            background: #000;
            color: #00ff00;
            font-family: 'Share Tech Mono', monospace;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .login-box {
            border: 2px solid #00ff00;
            padding: 40px;
            max-width: 400px;
            width: 100%;
        }
        h1 {
            margin: 0 0 30px 0;
            font-size: 24px;
        }
        input {
            background: #000;
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 12px;
            width: 100%;
            font-family: 'Share Tech Mono', monospace;
            font-size: 14px;
            margin-bottom: 20px;
            box-sizing: border-box;
        }
        input:focus {
            outline: none;
        }
        button {
            background: #000;
            border: 2px solid #00ff00;
            color: #00ff00;
            padding: 12px 24px;
            cursor: pointer;
            font-family: 'Share Tech Mono', monospace;
            font-size: 14px;
            width: 100%;
        }
        button:hover {
            background: #00ff00;
            color: #000;
        }
        .error {
            color: #ff0000;
            margin-top: 20px;
            display: none;
        }
        label {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="login-box">
        <h1>[GHOSTLINE_ADMIN]</h1>
        <form id="loginForm">
            <input type="password" id="password" placeholder="Enter password" required autofocus>
            <label>
                <input type="checkbox" id="remember">
                <span>Remember for 30 days</span>
            </label>
            <button type="submit">LOGIN</button>
            <div class="error" id="error">Invalid password</div>
        </form>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            const error = document.getElementById('error');

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password, remember })
                });

                if (res.ok) {
                    window.location.reload();
                } else {
                    error.style.display = 'block';
                }
            } catch (err) {
                error.style.display = 'block';
            }
        });
    </script>
</body>
</html>
  `);
});

app.use((req, res, next) => {
  if (req.path === '/admin.html') {
    if (!req.signedCookies || !req.signedCookies.gl_admin) {
      // pretend it does not exist
      return res.status(404).send('Not found');
    }
    return requireAdmin(req, res, () => {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.sendFile(path.join(__dirname, 'admin.html'));
    });
  }
  return next();
});

// Serve generated images from Ghostline_art_module
const GENERATED_IMAGES_PATH = path.join(__dirname, '..', '..', 'Documents', 'Ghostline_art_module', 'art_outputs', 'generated', 'GLVSF_Images');
app.use('/generated-images', express.static(GENERATED_IMAGES_PATH));
console.log('[Server] Serving generated images from:', GENERATED_IMAGES_PATH);

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin available at /${ADMIN_SLUG} (protected)`);
});
