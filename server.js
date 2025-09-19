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

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json());
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

// Hide admin entry under secret slug and protect direct file access
app.get(`/${ADMIN_SLUG}`, requireAdmin, (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.sendFile(path.join(__dirname, 'admin.html'));
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

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin available at /${ADMIN_SLUG} (protected)`);
});
