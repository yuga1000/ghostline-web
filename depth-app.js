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

const CW = 7;   // candle slot (body 5 + gap 2)
const PX = 2;   // pixel grid
const PAD = 16; // page side padding

// lane heights: sized so the median 1m candle body lands ≥3px after
// auto-fit (body_px ≈ laneH/30 for majors) — see calc in commit msg
const MAJOR_H = { BTC: 340, ETH: 260, AAVE: 170, SOL: 170, HYPE: 170 };
const MAJOR_ORDER = ["BTC", "ETH", "AAVE", "SOL", "HYPE"];
const GAP = 28;        // between major lanes
const ALT_H = 110;     // alt lane height
const ALT_GAP = 18;    // alt grid gap
const SEC_H = 30;      // ALT_FIELD section header height
const LABEL_ROW = 24;  // reserved for in-lane label

const REST_HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];
const WS_HOSTS = ["wss://data-stream.binance.vision", "wss://stream.binance.com:9443"];
let restHost = 0, wsHost = 0, simMode = false;

let interval = localStorage.getItem("dw-interval") || "1m";
let ws = null, wsTries = 0;
let layers = COINS.map(c => ({ cfg: c, candles: [], price: 0, chg: 0, live: false, dead: false, sim: false }));

const tank   = document.getElementById("tank");
const ctx    = tank.getContext("2d");
const labels = document.getElementById("labels");
const secEl  = document.getElementById("alt-sec");
const elWs   = document.getElementById("ws-status");
const elBtcPx  = document.getElementById("btc-px");
const elBtcChg = document.getElementById("btc-chg");

// ── layout: fixed vertical lanes, page scrolls ────────────
let W = 0, H = 0, N = 240, mobile = false;

function laneH(name) {
  const h = MAJOR_H[name] || ALT_H;
  return mobile ? Math.round(h * 0.72) : h;
}
function layout() {
  const out = new Map();
  let y = 10;
  for (const name of MAJOR_ORDER) {
    const L = layers.find(l => l.cfg.name === name);
    if (!L) continue;
    out.set(L.cfg.sym, { top: y, h: laneH(name), x: PAD, w: W - PAD * 2 });
    y += laneH(name) + (mobile ? 18 : GAP);
  }
  const altTop = y + 4;
  y = altTop + SEC_H;
  const alts = layers.filter(l => l.cfg.group === "alt");
  const cols = mobile ? 1 : 2;
  const colW = (W - PAD * 2 - (cols - 1) * ALT_GAP) / cols;
  const ah = mobile ? Math.round(ALT_H * 0.85) : ALT_H;
  alts.forEach((L, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    out.set(L.cfg.sym, {
      top: y + r * (ah + ALT_GAP),
      h: ah,
      x: PAD + c * (colW + ALT_GAP),
      w: colW,
    });
  });
  const rows = Math.ceil(alts.length / cols);
  const totalH = y + rows * (ah + ALT_GAP) - ALT_GAP + 20;
  return { out, altTop, totalH };
}

function resize() {
  const r = tank.parentElement.getBoundingClientRect();
  W = Math.floor(r.width);
  mobile = W < 720;
  const { totalH } = layout();
  H = totalH;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  tank.width = W * dpr; tank.height = H * dpr;
  tank.style.width = W + "px"; tank.style.height = H + "px";
  tank.parentElement.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // fetch enough candles for the widest lane
  const n = Math.max(60, Math.floor((W - PAD * 2 - 20) / CW) + 10);
  if (n > N) { N = n; fetchAll(); } else { N = n; }
}

// ── data ──────────────────────────────────────────────────
async function fetchOne(L) {
  for (let h = 0; h < REST_HOSTS.length; h++) {
    const host = REST_HOSTS[(restHost + h) % REST_HOSTS.length];
    try {
      const u = `${host}/api/v3/klines?symbol=${L.cfg.sym}&interval=${interval}&limit=${Math.min(N + 10, 500)}`;
      const rs = await fetch(u);
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
function fmtPrice(p) {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 10)   return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(8);
}

function drawLayer(L, b) {
  if (!b) return 0;
  const col = L.cfg.color;
  // lane frame
  ctx.strokeStyle = rgba(col, 0.22);
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x + 0.5, b.top + 0.5, b.w - 1, b.h - 1);
  if (L.dead || !L.candles.length) return 0;

  const n = Math.max(10, Math.floor((b.w - 18) / CW));
  const win = L.candles.slice(-n);
  let lo = Infinity, hi = -Infinity;
  for (const c of win) { if (c.l < lo) lo = c.l; if (c.h > hi) hi = c.h; }
  const rangePct = lo > 0 ? (hi - lo) / lo * 100 : 0;
  const pad = (hi - lo) * 0.06 || hi * 0.001 || 1;
  lo -= pad; hi += pad;

  const inTop = b.top + LABEL_ROW, inH = b.h - LABEL_ROW - 10;
  const y = v => snap(inTop + (1 - (v - lo) / (hi - lo)) * inH);
  const x0 = b.x + b.w - 10 - win.length * CW;

  // faint midline
  ctx.fillStyle = rgba(col, 0.08);
  ctx.fillRect(b.x + 6, snap(inTop + inH / 2), b.w - 12, 1);

  for (let j = 0; j < win.length; j++) {
    const c = win[j], x = snap(x0 + j * CW);
    const up = c.c >= c.o;
    const yH = y(c.h), yL = y(c.l);
    const yO = y(c.o), yC = y(c.c);
    const bt = Math.min(yO, yC), bh = Math.max(PX, Math.abs(yC - yO));
    ctx.fillStyle = rgba(col, 0.45);
    ctx.fillRect(x + Math.floor(CW / 2) - 1, yH, PX, Math.max(PX, yL - yH));
    if (up) {
      ctx.fillStyle = rgba(col, 0.92);
      ctx.fillRect(x + 1, bt, CW - 2, bh);
    } else {
      ctx.fillStyle = rgba(col, 0.30);
      ctx.fillRect(x + 1, bt, CW - 2, bh);
      ctx.fillStyle = rgba(col, 0.8);
      ctx.fillRect(x + 1, bt, CW - 2, PX);
      ctx.fillRect(x + 1, bt + bh - PX, CW - 2, PX);
    }
  }
  const last = win[win.length - 1];
  ctx.fillStyle = rgba(col, 0.95);
  ctx.fillRect(b.x + b.w - 8, y(last.c), 8, PX);
  return rangePct;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  const { out, altTop } = layout();
  const ranges = new Map();
  for (const L of layers) {
    const pct = drawLayer(L, out.get(L.cfg.sym));
    ranges.set(L.cfg.sym, pct);
  }
  drawLabels(out, ranges, altTop);
}

function drawLabels(out, ranges, altTop) {
  secEl.style.top = altTop + "px";
  secEl.style.left = PAD + "px";
  layers.forEach(L => {
    const b = out.get(L.cfg.sym);
    if (!b) return;
    let el = L._el;
    if (!el) {
      el = document.createElement("div");
      el.className = "dw-label" + (L.cfg.group === "alt" ? " is-alt" : "");
      el.innerHTML = '<span class="l-dot"></span><b class="l-name"></b><span class="l-px"></span><span class="l-chg"></span><span class="l-rng"></span><span class="l-off"></span>';
      labels.appendChild(el);
      L._el = el;
    }
    el.style.left = (b.x + 6) + "px";
    el.style.top = (b.top + 4) + "px";
    el.style.color = L.cfg.color;
    el.querySelector(".l-name").textContent = L.cfg.name;
    el.querySelector(".l-px").textContent = L.dead ? "" : fmtPrice(L.price);
    const chg = el.querySelector(".l-chg");
    chg.textContent = L.dead ? "" : (L.chg >= 0 ? "+" : "") + L.chg.toFixed(2) + "%";
    chg.className = "l-chg " + (L.chg >= 0 ? "is-up" : "is-dn");
    const rng = ranges.get(L.cfg.sym);
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
