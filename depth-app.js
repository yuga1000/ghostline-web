// MYSTRA Depth Watch — price-proportional layered live candles (Binance)
(function () {
"use strict";

// majors: vertical position ∝ log(price). alts: one shared field at the bottom.
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
const CW = 6;  // candle slot width (body 4 + gap 2) — real chart proportions
const PX = 2;  // pixel grid
const LABELW = 200; // left terminal-box column

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

// ── layout ────────────────────────────────────────────────
let W = 0, H = 0, N = 60;
function resize() {
  const r = tank.parentElement.getBoundingClientRect();
  W = Math.floor(r.width); H = Math.floor(r.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  tank.width = W * dpr; tank.height = H * dpr;
  tank.style.width = W + "px"; tank.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.max(20, Math.floor((W - LABELW - 24) / CW));
  if (n > N) fetchAll();
  N = n;
}

// price → vertical placement: log scale between heaviest and lightest major
function layout() {
  const majors = layers.filter(L => L.cfg.group === "major");
  const alts   = layers.filter(L => L.cfg.group === "alt");
  const altH = Math.max(120, Math.round(H * 0.16));
  const region = H - altH - 14;
  const bandH = Math.min(150, Math.max(76, Math.round(region * 0.21)));
  const logs = majors.map(L => Math.log10(L.price || SIM_BASE[L.cfg.name] || 1));
  const maxL = Math.max(...logs), minL = Math.min(...logs);
  const span = (maxL - minL) || 1;
  const out = new Map();
  majors.forEach((L, i) => {
    const t = (maxL - logs[i]) / span * (region - bandH);
    out.set(L.cfg.sym, { top: t, h: bandH });
  });
  // alt field: thin ribbons cascaded through a slim shared band
  const subH = Math.max(44, Math.round(altH * 0.5));
  const step = alts.length > 1 ? (altH - subH) / (alts.length - 1) : 0;
  alts.forEach((L, i) => out.set(L.cfg.sym, { top: H - altH + i * step, h: subH }));
  return { out, altTop: H - altH };
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
  if (L.dead || !L.candles.length) return;
  const col = L.cfg.color;
  const win = L.candles.slice(-N);
  let lo = Infinity, hi = -Infinity;
  for (const c of win) { if (c.l < lo) lo = c.l; if (c.h > hi) hi = c.h; }
  const pad = (hi - lo) * 0.04 || hi * 0.001 || 1;
  lo -= pad; hi += pad;
  const inTop = b.top + 4, inH = b.h - 8;
  const y = v => snap(inTop + (1 - (v - lo) / (hi - lo)) * inH);
  const x0 = W - 16 - win.length * CW;
  for (let j = 0; j < win.length; j++) {
    const c = win[j], x = snap(x0 + j * CW);
    const up = c.c >= c.o;
    const yH = y(c.h), yL = y(c.l);
    const yO = y(c.o), yC = y(c.c);
    const bt = Math.min(yO, yC), bh = Math.max(PX, Math.abs(yC - yO));
    ctx.fillStyle = rgba(col, 0.45);
    ctx.fillRect(x + CW / 2 - 1, yH, PX, Math.max(PX, yL - yH));
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
  ctx.fillRect(W - 10, y(last.c), 10, PX);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  const { out, altTop } = layout();
  // alts field first (behind), then majors deep→surface
  const alts = layers.filter(L => L.cfg.group === "alt");
  const majors = layers.filter(L => L.cfg.group === "major")
    .slice().sort((a, b) => (a.price || SIM_BASE[a.cfg.name]) - (b.price || SIM_BASE[b.cfg.name]));
  for (const L of alts) drawLayer(L, out.get(L.cfg.sym));
  for (const L of majors) drawLayer(L, out.get(L.cfg.sym));
  drawLabels(out, altTop);
}

function drawLabels(out, altTop) {
  // resolve major-label collisions: sort by y, push apart to ≥18px
  const majors = layers.filter(L => L.cfg.group === "major")
    .map(L => ({ L, y: out.get(L.cfg.sym).top + 4 }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < majors.length; i++) {
    if (majors[i].y < majors[i - 1].y + 28) majors[i].y = majors[i - 1].y + 28;
  }
  for (let i = majors.length - 1; i >= 0; i--) { // keep on screen
    const maxY = altTop - 32 - (majors.length - 1 - i) * 28;
    if (majors[i].y > maxY) majors[i].y = maxY;
    if (i && majors[i - 1].y > majors[i].y - 28) majors[i - 1].y = majors[i].y - 28;
  }
  const yFor = new Map(majors.map(m => [m.L.cfg.sym, m.y]));
  // alt panel occupies the bottom-left — shift any major box that would overlap it to the right
  const panelEl = document.getElementById("alts");
  const pTop = panelEl.offsetTop, pRight = panelEl.offsetLeft + panelEl.offsetWidth + 8;
  layers.filter(L => L.cfg.group === "major").forEach(L => {
    let el = L._el;
    if (!el) {
      el = document.createElement("div");
      el.className = "dw-label";
      el.innerHTML = '<span class="l-dot"></span><b class="l-name"></b><span class="l-px"></span><span class="l-chg"></span><span class="l-off"></span>';
      labels.appendChild(el);
      L._el = el;
    }
    const yy = yFor.get(L.cfg.sym);
    el.style.left = (yy + 24 > pTop ? pRight : 12) + "px";
    el.style.top = yy + "px";
    el.style.color = L.cfg.color;
    el.style.borderColor = rgba(L.cfg.color, 0.5);
    el.querySelector(".l-name").textContent = L.cfg.name;
    el.querySelector(".l-px").textContent = L.dead ? "" : fmtPrice(L.price);
    const chg = el.querySelector(".l-chg");
    chg.textContent = L.dead ? "" : (L.chg >= 0 ? "+" : "") + L.chg.toFixed(2) + "%";
    chg.className = "l-chg " + (L.chg >= 0 ? "is-up" : "is-dn");
    el.querySelector(".l-dot").className = "l-dot" + (L.live ? " is-live" : "");
    const off = el.querySelector(".l-off");
    off.textContent = L.sim ? "SIM" : (L.dead ? "OFFLINE" : "");
  });
  drawAltPanel();
  layers.forEach(L => {
    if (L.cfg.name === "BTC" && !L.dead && L.price) {
      elBtcPx.textContent = "$" + fmtPrice(L.price);
      elBtcChg.textContent = (L.chg >= 0 ? "▲ " : "▼ ") + Math.abs(L.chg).toFixed(2) + "%";
      elBtcChg.className = "btc-chg " + (L.chg >= 0 ? "is-up" : "is-dn");
    }
  });
}

// ── collapsible terminal panel for the alt field ──────────
const altBody = document.getElementById("alts-body");
const altCount = document.getElementById("alts-count");
function drawAltPanel() {
  const alts = layers.filter(L => L.cfg.group === "alt");
  altCount.textContent = alts.length;
  alts.forEach(L => {
    let row = L._row;
    if (!row) {
      row = document.createElement("div");
      row.className = "alt-row";
      row.innerHTML = '<span class="l-dot"></span><b class="a-name"></b><span class="a-px"></span><span class="a-chg"></span>';
      altBody.appendChild(row);
      L._row = row;
    }
    row.style.color = L.cfg.color;
    row.querySelector(".a-name").textContent = L.cfg.name;
    row.querySelector(".a-px").textContent = L.dead ? "—" : fmtPrice(L.price);
    const chg = row.querySelector(".a-chg");
    chg.textContent = L.dead ? (L.sim ? "SIM" : "OFF") : (L.chg >= 0 ? "+" : "") + L.chg.toFixed(2) + "%";
    chg.className = "a-chg " + (L.chg >= 0 ? "is-up" : "is-dn");
    row.querySelector(".l-dot").className = "l-dot" + (L.live ? " is-live" : "");
  });
}
(function initAltPanel() {
  const panel = document.getElementById("alts");
  const open = localStorage.getItem("dw-alts-open") !== "0";
  panel.classList.toggle("is-open", open);
  document.getElementById("alts-head").addEventListener("click", () => {
    const now = !panel.classList.contains("is-open");
    panel.classList.toggle("is-open", now);
    localStorage.setItem("dw-alts-open", now ? "1" : "0");
  });
})();

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
