// MYSTRA Depth Watch — cinema lanes: one full-width strip per asset,
// each lane auto-scaled to its own window range (real wave shape),
// Δ label shows the honest % range of the visible window.
(function () {
"use strict";

const COINS = [
  { sym: "BTCUSDT",  name: "BTC",  color: "#ffb142", group: "major" },
  { sym: "ETHUSDT",  name: "ETH",  color: "#d8e05a", group: "major" },
  { sym: "AAVEUSDT", name: "AAVE", color: "#8a6cf0", group: "major" },
  { sym: "SOLUSDT",  name: "SOL",  color: "#4ed7a0", group: "major" },
  { sym: "HYPEUSDT", name: "HYPE", color: "#4f9fff", group: "major" },
  { sym: "XRPUSDT",  name: "XRP",  color: "#8fd75a", group: "alt" },
  { sym: "LINKUSDT", name: "LINK", color: "#ff8f5a", group: "alt" },
  { sym: "AVAXUSDT", name: "AVAX", color: "#ff5a5a", group: "alt" },
  { sym: "SUIUSDT",  name: "SUI",  color: "#5ad7ff", group: "alt" },
  { sym: "ADAUSDT",  name: "ADA",  color: "#ff6ea0", group: "alt" },
  { sym: "TRXUSDT",  name: "TRX",  color: "#d7b45a", group: "alt" },
  { sym: "DOGEUSDT", name: "DOGE", color: "#3fc6d7", group: "alt" },
  { sym: "PEPEUSDT", name: "PEPE", color: "#a0e05a", group: "alt" },
];
const SIM_BASE = { BTC: 118000, ETH: 4200, AAVE: 320, SOL: 210, HYPE: 42, XRP: 2.9, LINK: 24, AVAX: 55, SUI: 3.4, ADA: 0.8, TRX: 0.35, DOGE: 0.24, PEPE: 0.000012 };

const CW = 7;      // candle slot px (body ~5 + gap 2)
const BODYW = 5;   // body width px
const WICKW = 1;   // wick width px (centered)
const PX = 1;      // fine grid — crisp candles, no smearing
const PAD = 16;    // page side padding
const UP = "#26a17b";   // Bybit-ish green
const DN = "#e15241";   // Bybit-ish red

// Single overlaid field, no scroll. Each coin gets a vertical BAND
// (its center + amplitude) but bands OVERLAP so waves cross each other —
// crossing points reveal sync/desync. Order deep→surface:
// BTC highest, ETH below, alts stacked toward the floor.
// center = fraction of field height (0 = top). amp = half-height fraction.
const BANDS = [
  { name: "BTC",  center: 0.12, amp: 0.14 },
  { name: "ETH",  center: 0.28, amp: 0.14 },
  { name: "AAVE", center: 0.42, amp: 0.12 },
  { name: "SOL",  center: 0.52, amp: 0.12 },
  { name: "HYPE", center: 0.60, amp: 0.11 },
  { name: "XRP",  center: 0.68, amp: 0.10 },
  { name: "LINK", center: 0.74, amp: 0.10 },
  { name: "AVAX", center: 0.78, amp: 0.09 },
  { name: "SUI",  center: 0.82, amp: 0.08 },
  { name: "ADA",  center: 0.85, amp: 0.07 },
  { name: "TRX",  center: 0.88, amp: 0.06 },
  { name: "DOGE", center: 0.905, amp: 0.055 },
  { name: "PEPE", center: 0.925, amp: 0.05 },
];
const BAND = Object.fromEntries(BANDS.map(b => [b.name, b]));
const TOP_PAD = 12, BOT_PAD = 12;

const REST_HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];
const WS_HOSTS = ["wss://data-stream.binance.vision", "wss://stream.binance.com:9443"];
let restHost = 0, wsHost = 0, simMode = false;

let interval = localStorage.getItem("dw-interval") || "1m";
let ws = null, wsTries = 0;
let layers = COINS.map(c => ({ cfg: c, candles: [], price: 0, chg: 0, live: false, dead: false, sim: false }));

const tank   = document.getElementById("tank");
const ctx    = tank.getContext("2d");
const labels = document.getElementById("labels");
const elWs   = document.getElementById("ws-status");
const elBtcPx  = document.getElementById("btc-px");
const elBtcChg = document.getElementById("btc-chg");

// ── layout: single fixed-height field, no scroll ──────────
let W = 0, H = 0, N = 240, mobile = false;

function resize() {
  const r = tank.parentElement.getBoundingClientRect();
  W = Math.floor(r.width);
  H = Math.floor(r.height);
  mobile = W < 720;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  tank.width = W * dpr; tank.height = H * dpr;
  tank.style.width = W + "px"; tank.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.max(60, Math.floor((W - PAD * 2 - 20) / CW) + 10);
  if (n > N) { N = n; fetchAll(); } else { N = n; }
}

// ── data ──────────────────────────────────────────────────
// blocked networks (e.g. ISP blackholes Binance) leave fetches hanging
// forever — every request gets a hard timeout, then we fall back to SIM
function fetchT(url, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return fetch(url, { signal: ac.signal }).finally(() => clearTimeout(t));
}
async function fetchOne(L) {
  for (let h = 0; h < REST_HOSTS.length; h++) {
    const host = REST_HOSTS[(restHost + h) % REST_HOSTS.length];
    try {
      const u = `${host}/api/v3/klines?symbol=${L.cfg.sym}&interval=${interval}&limit=${Math.min(N + 10, 500)}`;
      const rs = await fetchT(u, 6000);
      if (rs.status === 400) { L.dead = true; return; } // not listed
      if (!rs.ok) throw 0;
      const rows = await rs.json();
      L.candles = rows.map(r => ({ t: r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4] }));
      L.price = L.candles.length ? L.candles[L.candles.length - 1].c : 0;
      L.dead = false; L.sim = false;
      restHost = (restHost + h) % REST_HOSTS.length;
      return;
    } catch (e) { /* next host */ }
  }
  simFill(L);
}
function fetchAll() { layers.forEach(fetchOne); }

// ── sim fallback ──────────────────────────────────────────
function ivMs() { return { "1s": 1000, "1m": 6e4, "5m": 3e5, "15m": 9e5, "1h": 36e5 }[interval] || 6e4; }
function simFill(L) {
  simMode = true; L.sim = true; L.dead = false;
  let p = SIM_BASE[L.cfg.name] || 100;
  const vol = p * 0.0018, now = Date.now(), arr = [];
  for (let i = N + 5; i > 0; i--) {
    const o = p;
    p += (Math.random() - 0.5) * 2 * vol;
    const c = p;
    arr.push({ t: now - i * ivMs(), o, c, h: Math.max(o, c) + Math.random() * vol * 0.7, l: Math.min(o, c) - Math.random() * vol * 0.7 });
  }
  L.candles = arr; L.price = p;
  L.chg = (Math.random() - 0.45) * 6;
}
function simTick() {
  if (!simMode) return;
  for (const L of layers) {
    if (!L.sim || !L.candles.length) continue;
    const arr = L.candles, last = arr[arr.length - 1];
    const vol = last.c * 0.0009;
    if (Date.now() - last.t > ivMs()) {
      arr.push({ t: last.t + ivMs(), o: last.c, c: last.c, h: last.c, l: last.c });
      if (arr.length > 520) arr.shift();
    } else {
      last.c += (Math.random() - 0.5) * 2 * vol;
      last.h = Math.max(last.h, last.c); last.l = Math.min(last.l, last.c);
    }
    L.price = arr[arr.length - 1].c;
    L.live = true;
  }
  setWsStatus("SIM FEED", false);
}
setInterval(simTick, 900);

function connectWS() {
  if (ws) { ws.onclose = null; ws.close(); }
  const streams = layers.filter(L => !L.dead && !L.sim).flatMap(L => [
    L.cfg.sym.toLowerCase() + "@kline_" + interval,
    L.cfg.sym.toLowerCase() + "@miniTicker",
  ]).join("/");
  if (!streams) return;
  ws = new WebSocket(WS_HOSTS[wsHost % WS_HOSTS.length] + "/stream?streams=" + streams);
  ws.onopen = () => { wsTries = 0; simMode = false; layers.forEach(L => L.sim = false); setWsStatus("LIVE", true); };
  ws.onclose = () => {
    setWsStatus(simMode ? "SIM FEED" : "RECONNECT", false);
    layers.forEach(L => { if (!L.sim) L.live = false; });
    wsHost++;
    setTimeout(connectWS, Math.min(15000, 1000 * Math.pow(2, wsTries++)));
  };
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    const sym = (m.data && m.data.s) || "";
    const L = layers.find(x => x.cfg.sym === sym);
    if (!L) return;
    L.live = true;
    if (m.data.e === "kline") {
      const k = m.data.k;
      const cd = { t: k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c };
      const arr = L.candles;
      if (arr.length && arr[arr.length - 1].t === cd.t) arr[arr.length - 1] = cd;
      else { arr.push(cd); if (arr.length > 520) arr.shift(); }
      L.price = cd.c;
    } else if (m.data.e === "24hrMiniTicker") {
      L.price = +m.data.c;
      L.chg = (+m.data.c - +m.data.o) / +m.data.o * 100;
    }
  };
}
function setWsStatus(txt, ok) {
  elWs.textContent = txt;
  elWs.className = "dw-ws " + (ok ? "is-ok" : "is-bad");
}

// ── drawing ───────────────────────────────────────────────
function snap(v) { return Math.round(v / PX) * PX; }
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
// blend hex a toward hex b by t (0..1) — coin hue + up/down tint
function mix(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const r = Math.round((A >> 16 & 255) * (1 - t) + (B >> 16 & 255) * t);
  const g = Math.round((A >> 8 & 255) * (1 - t) + (B >> 8 & 255) * t);
  const bl = Math.round((A & 255) * (1 - t) + (B & 255) * t);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}
function fmtPrice(p) {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 10)   return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(8);
}

// each coin draws inside its band; returns per-column close Y (for crossings)
function drawLayer(L, fieldTop, fieldH) {
  if (L.dead || !L.candles.length) return null;
  const col = L.cfg.color;
  const band = BAND[L.cfg.name];
  if (!band) return null;
  const cy = fieldTop + band.center * fieldH;     // band center (px)
  const half = band.amp * fieldH;                 // half-height (px)

  const n = Math.max(10, Math.floor((W - PAD * 2 - 20) / CW));
  const win = L.candles.slice(-n);
  let lo = Infinity, hi = -Infinity;
  for (const c of win) { if (c.l < lo) lo = c.l; if (c.h > hi) hi = c.h; }
  const rangePct = lo > 0 ? (hi - lo) / lo * 100 : 0;
  const mid = (hi + lo) / 2 || 1;
  const span = (hi - lo) || mid * 0.001 || 1;
  // price → Y: map [lo,hi] into [cy+half, cy-half] around the band center
  const y = v => Math.round(cy - ((v - mid) / (span / 2)) * half);
  const x0 = Math.round(W - PAD - win.length * CW);
  const bodyOff = Math.floor((CW - BODYW) / 2);
  const wickOff = Math.floor((CW - WICKW) / 2);

  const closeY = new Float32Array(win.length);
  for (let j = 0; j < win.length; j++) {
    const c = win[j], x = x0 + j * CW;
    const up = c.c >= c.o;
    const yH = y(c.h), yL = y(c.l);
    const yO = y(c.o), yC = y(c.c);
    const bt = Math.min(yO, yC);
    const bh = Math.max(1, Math.abs(yC - yO));  // 1px min body (doji)
    closeY[j] = yC;
    // per-coin tinted green/red: keep the layer hue, up bright / down dim
    const gc = up ? mix(col, UP, 0.55) : mix(col, DN, 0.55);
    // wick: 1px, dead-centered
    ctx.fillStyle = rgba(gc, 0.55);
    ctx.fillRect(x + wickOff, yH, WICKW, Math.max(1, yL - yH));
    // body: solid up, hollow(-ish) down — crisp edges
    if (up) {
      ctx.fillStyle = rgba(gc, 0.95);
      ctx.fillRect(x + bodyOff, bt, BODYW, bh);
    } else {
      ctx.fillStyle = rgba(gc, 0.9);
      ctx.fillRect(x + bodyOff, bt, BODYW, bh);
    }
  }
  // last-price marker at right edge
  const last = win[win.length - 1];
  ctx.fillStyle = rgba(col, 0.95);
  ctx.fillRect(W - PAD, y(last.c), PAD, PX);
  return { closeY, x0, col, rangePct, name: L.cfg.name };
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  const fieldTop = TOP_PAD;
  const fieldH = H - TOP_PAD - BOT_PAD;

  // draw deep→surface so BTC sits on top; collect close lines for crossings
  const lines = [];
  for (let i = layers.length - 1; i >= 0; i--) {
    const r = drawLayer(layers[i], fieldTop, fieldH);
    if (r) lines.push(r);
  }
  drawCrossings(lines);
  drawLabels(fieldTop, fieldH, lines);
}

// mark columns where two close-lines cross — the sync/desync detector
function drawCrossings(lines) {
  if (lines.length < 2) return;
  const cols = Math.min(...lines.map(l => l.closeY.length));
  for (let j = 1; j < cols; j++) {
    // count how many pairs cross at this column
    let hits = 0, cx = 0, cyAcc = 0;
    for (let a = 0; a < lines.length; a++) {
      for (let b = a + 1; b < lines.length; b++) {
        const A = lines[a].closeY, B = lines[b].closeY;
        const d0 = A[j - 1] - B[j - 1], d1 = A[j] - B[j];
        if (d0 === 0 || (d0 < 0) !== (d1 < 0)) {
          hits++;
          cyAcc += (A[j] + B[j]) / 2;
        }
      }
    }
    if (hits >= 3) {  // a cluster of crossings — a real sync knot
      const x = snap((lines[0].x0) + j * CW);
      const y = snap(cyAcc / hits);
      const s = Math.min(6, 2 + hits);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(x - 1, y - s, PX, s * 2);
      ctx.fillRect(x - s, y - 1, s * 2, PX);
    }
  }
}

const LBL_MIN = 19;  // min vertical gap between labels (px)
function drawLabels(fieldTop, fieldH, lines) {
  const rngBy = new Map(lines.map(l => [l.name, l.rangePct]));
  // 1) desired Y for each label = just above its band top
  const items = layers.map(L => {
    const band = BAND[L.cfg.name];
    if (!band) return null;
    return { L, band, y: fieldTop + band.center * fieldH - band.amp * fieldH - 14 };
  }).filter(Boolean).sort((a, b) => a.y - b.y);
  // 2) push apart top→bottom so none overlap
  for (let i = 1; i < items.length; i++) {
    if (items[i].y < items[i - 1].y + LBL_MIN) items[i].y = items[i - 1].y + LBL_MIN;
  }
  // 3) clamp to field bottom, then relax upward if it overflowed
  const maxY = fieldTop + fieldH - LBL_MIN;
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].y > maxY - (items.length - 1 - i) * LBL_MIN)
      items[i].y = maxY - (items.length - 1 - i) * LBL_MIN;
    if (i && items[i - 1].y > items[i].y - LBL_MIN) items[i - 1].y = items[i].y - LBL_MIN;
  }
  items.forEach(({ L, y }) => {
    let el = L._el;
    if (!el) {
      el = document.createElement("div");
      el.className = "dw-label";
      el.innerHTML = '<span class="l-dot"></span><b class="l-name"></b><span class="l-px"></span><span class="l-chg"></span><span class="l-rng"></span><span class="l-off"></span>';
      labels.appendChild(el);
      L._el = el;
    }
    el.style.left = PAD + "px";
    el.style.top = Math.round(y) + "px";
    el.style.color = L.cfg.color;
    el.querySelector(".l-name").textContent = L.cfg.name;
    el.querySelector(".l-px").textContent = L.dead ? "" : fmtPrice(L.price);
    const chg = el.querySelector(".l-chg");
    chg.textContent = L.dead ? "" : (L.chg >= 0 ? "+" : "") + L.chg.toFixed(2) + "%";
    chg.className = "l-chg " + (L.chg >= 0 ? "is-up" : "is-dn");
    const rng = rngBy.get(L.cfg.name);
    el.querySelector(".l-rng").textContent = rng ? "Δ " + rng.toFixed(2) + "%" : "";
    el.querySelector(".l-dot").className = "l-dot" + (L.live ? " is-live" : "");
    el.querySelector(".l-off").textContent = L.sim ? "SIM" : (L.dead ? "OFFLINE" : "");
  });
  const btc = layers.find(L => L.cfg.name === "BTC");
  if (btc && !btc.dead && btc.price) {
    elBtcPx.textContent = "$" + fmtPrice(btc.price);
    elBtcChg.textContent = (btc.chg >= 0 ? "▲ " : "▼ ") + Math.abs(btc.chg).toFixed(2) + "%";
    elBtcChg.className = "btc-chg " + (btc.chg >= 0 ? "is-up" : "is-dn");
  }
}

// ── interval chips ────────────────────────────────────────
document.querySelectorAll(".dw-int").forEach(btn => {
  if (btn.dataset.iv === interval) btn.classList.add("is-on");
  btn.addEventListener("click", () => {
    interval = btn.dataset.iv;
    localStorage.setItem("dw-interval", interval);
    document.querySelectorAll(".dw-int").forEach(b => b.classList.toggle("is-on", b === btn));
    layers.forEach(L => { L.candles = []; });
    fetchAll();
    connectWS();
  });
});

// ── boot ──────────────────────────────────────────────────
window.addEventListener("resize", resize);
resize();
Promise.allSettled(layers.map(fetchOne)).then(() => {
  connectWS();
  layers.filter(L => L.dead).forEach(L => setTimeout(() => fetchOne(L), 4000));
  setInterval(() => { if (simMode) { fetchAll(); connectWS(); } }, 30000);
});
setInterval(draw, 400);
draw();
})();
