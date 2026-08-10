// MYSTRA Depth Watch — timestamp-aligned, indexed market comparison.
(function () {
"use strict";

const COINS = [
  { sym: "BTCUSDT",  name: "BTC",  color: "#ffb142", beta: 1.00, sigma: 0.00055 },
  { sym: "ETHUSDT",  name: "ETH",  color: "#d8e05a", beta: 1.12, sigma: 0.00078 },
  { sym: "AAVEUSDT", name: "AAVE", color: "#9b7cff", beta: 1.24, sigma: 0.00115 },
  { sym: "SOLUSDT",  name: "SOL",  color: "#4ed7a0", beta: 1.22, sigma: 0.00105 },
  { sym: "HYPEUSDT", name: "HYPE", color: "#579dff", beta: 1.28, sigma: 0.00125 },
  { sym: "XRPUSDT",  name: "XRP",  color: "#8fd75a", beta: 0.92, sigma: 0.00088 },
  { sym: "LINKUSDT", name: "LINK", color: "#ff8f5a", beta: 1.10, sigma: 0.00096 },
  { sym: "AVAXUSDT", name: "AVAX", color: "#ff6868", beta: 1.20, sigma: 0.00108 },
  { sym: "SUIUSDT",  name: "SUI",  color: "#5ad7ff", beta: 1.26, sigma: 0.00118 },
  { sym: "ADAUSDT",  name: "ADA",  color: "#ff77ad", beta: 1.02, sigma: 0.00092 },
  { sym: "TRXUSDT",  name: "TRX",  color: "#d7b45a", beta: 0.62, sigma: 0.00048 },
  { sym: "DOGEUSDT", name: "DOGE", color: "#42c9d7", beta: 1.18, sigma: 0.00116 },
  { sym: "PEPEUSDT", name: "PEPE", color: "#a5e660", beta: 1.34, sigma: 0.00142 },
];

const SIM_BASE = {
  BTC: 118000, ETH: 4200, AAVE: 320, SOL: 210, HYPE: 42,
  XRP: 2.9, LINK: 24, AVAX: 55, SUI: 3.4, ADA: 0.8,
  TRX: 0.35, DOGE: 0.24, PEPE: 0.000012,
};
const INTERVAL_MS = { "1s": 1000, "1m": 60000, "5m": 300000, "15m": 900000, "1h": 3600000 };
const REST_HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];
const WS_HOSTS = ["wss://data-stream.binance.vision", "wss://stream.binance.com:9443"];
const MAX_BARS = 420;
const MIN_BARS = 64;
const UP = "#36c995";
const DOWN = "#ef5f67";

const tank = document.getElementById("tank");
const ctx = tank.getContext("2d");
const labels = document.getElementById("labels");
const elWs = document.getElementById("ws-status");
const elBtcPx = document.getElementById("btc-px");
const elBtcChg = document.getElementById("btc-chg");
const elWindow = document.getElementById("window-meta");
const elFocus = document.getElementById("focus-name");
const hoverCard = document.getElementById("hover-card");
const hoverName = document.getElementById("hover-name");
const hoverRet = document.getElementById("hover-ret");
const hoverPx = document.getElementById("hover-px");
const hoverTime = document.getElementById("hover-time");

const layers = COINS.map(cfg => ({
  cfg,
  candles: [],
  price: 0,
  dayChg: null,
  source: "loading",
  dead: false,
  live: false,
  ui: null,
}));

let interval = safeStoreGet("dw-interval") || "1m";
if (!INTERVAL_MS[interval]) interval = "1m";
let focusName = safeStoreGet("dw-focus") || "BTC";
if (!COINS.some(c => c.name === focusName)) focusName = "BTC";
let W = 0;
let H = 0;
let dpr = 1;
let mobile = false;
let frame = null;
let drawQueued = false;
let feedEpoch = 0;
let feedLoading = true;
let restHost = 0;
let wsHost = 0;
let wsTries = 0;
let ws = null;
let socketOpen = false;
let socketTimer = null;
let reconnectTimer = null;
let recoveryTimer = null;
const pendingFetches = new Set();
const pointer = { active: false, x: 0, y: 0 };

function safeStoreGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function safeStoreSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* storage can be blocked */ }
}

function ivMs(value = interval) {
  return INTERVAL_MS[value] || INTERVAL_MS["1m"];
}

function rgba(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16 & 255},${value >> 8 & 255},${value & 255},${alpha})`;
}

function fmtPrice(value, currency = false) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  let text;
  if (value >= 1000) text = value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  else if (value >= 100) text = value.toFixed(1);
  else if (value >= 10) text = value.toFixed(2);
  else if (value >= 1) text = value.toFixed(3);
  else if (value >= 0.01) text = value.toFixed(4);
  else text = value.toFixed(8);
  return currency ? "$" + text : text;
}

function fmtPct(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.abs(value) < Math.pow(10, -digits) / 2 ? 0 : value;
  return (rounded > 0 ? "+" : "") + rounded.toFixed(digits) + "%";
}

function setText(node, value) {
  if (node && node.textContent !== value) node.textContent = value;
}

function initLegend() {
  const fragment = document.createDocumentFragment();
  for (const L of layers) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dw-label";
    button.style.color = L.cfg.color;
    button.innerHTML = '<span class="l-dot"></span><b class="l-name"></b><span class="l-rel"></span><span class="l-px"></span><span class="l-corr"></span>';
    const ui = {
      button,
      name: button.querySelector(".l-name"),
      rel: button.querySelector(".l-rel"),
      px: button.querySelector(".l-px"),
      corr: button.querySelector(".l-corr"),
    };
    L.ui = ui;
    setText(ui.name, L.cfg.name);
    button.addEventListener("click", () => setFocus(L.cfg.name));
    fragment.appendChild(button);
  }
  labels.replaceChildren(fragment);
}

function setFocus(name) {
  const layer = layers.find(L => L.cfg.name === name);
  if (!layer || layer.dead || layer.source === "offline") return;
  focusName = name;
  safeStoreSet("dw-focus", name);
  pointer.active = false;
  invalidate();
}

function abortFetches() {
  for (const controller of pendingFetches) controller.abort();
  pendingFetches.clear();
}

async function fetchMarket(url, timeout) {
  const controller = new AbortController();
  pendingFetches.add(controller);
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const rows = response.ok ? await response.json() : null;
    return { response, rows };
  } finally {
    clearTimeout(timer);
    pendingFetches.delete(controller);
  }
}

async function fetchReal(L, epoch, requestedInterval) {
  const firstHost = restHost;
  for (let offset = 0; offset < REST_HOSTS.length; offset++) {
    const hostIndex = (firstHost + offset) % REST_HOSTS.length;
    try {
      const url = `${REST_HOSTS[hostIndex]}/api/v3/klines?symbol=${L.cfg.sym}&interval=${requestedInterval}&limit=${MAX_BARS}`;
      const result = await fetchMarket(url, 6500);
      const response = result.response;
      if (epoch !== feedEpoch || requestedInterval !== interval) return "stale";
      if (response.status === 400) {
        L.candles = [];
        L.price = 0;
        L.source = "offline";
        L.dead = true;
        L.live = false;
        return "offline";
      }
      if (!response.ok) throw new Error("market request failed");
      const rows = result.rows;
      if (!Array.isArray(rows) || !rows.length) throw new Error("empty market response");
      const candleByTime = new Map();
      for (const row of rows) {
        if (!Array.isArray(row) || row.length < 5) continue;
        const candle = { t: +row[0], o: +row[1], h: +row[2], l: +row[3], c: +row[4] };
        if (validCandle(candle)) candleByTime.set(candle.t, candle);
      }
      const candles = [...candleByTime.values()].sort((a, b) => a.t - b.t);
      if (!candles.length) throw new Error("invalid market response");
      if (epoch !== feedEpoch || requestedInterval !== interval) return "stale";
      L.candles = candles;
      L.price = candles[candles.length - 1].c;
      L.dayChg = null;
      L.source = "real";
      L.dead = false;
      L.live = false;
      restHost = hostIndex;
      return "real";
    } catch (error) {
      if (epoch !== feedEpoch || requestedInterval !== interval) return "stale";
    }
  }
  return "failed";
}

function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function normalish(random) {
  return random() + random() + random() + random() + random() + random() - 3;
}

function dayChangeFromCandles(candles, step) {
  const bars = Math.max(1, Math.round(86400000 / step));
  if (candles.length <= bars) return null;
  const base = candles[candles.length - 1 - bars].c;
  const current = candles[candles.length - 1].c;
  return base > 0 ? (current / base - 1) * 100 : null;
}

function fillSimulation(simLayers, requestedInterval) {
  if (!simLayers.length) return;
  const step = ivMs(requestedInterval);
  const end = Math.floor(Date.now() / step) * step;
  const marketRandom = seededRandom(hashSeed(requestedInterval + ":" + end));
  const market = Array.from({ length: MAX_BARS }, () => normalish(marketRandom));
  const scale = Math.sqrt(step / INTERVAL_MS["1m"]);

  for (const L of simLayers) {
    const random = seededRandom(hashSeed(L.cfg.sym + ":" + requestedInterval + ":" + end));
    const candles = [];
    let price = SIM_BASE[L.cfg.name] || 100;
    const sigma = L.cfg.sigma * scale;
    for (let i = 0; i < MAX_BARS; i++) {
      const open = price;
      const cluster = 0.78 + Math.min(1.1, Math.abs(market[i]) * 0.34);
      const move = (market[i] * 0.72 * L.cfg.beta + normalish(random) * 0.54) * sigma * cluster;
      price = Math.max(open * 0.02, open * (1 + move));
      const wick = sigma * (0.16 + Math.abs(normalish(random)) * 0.30);
      const high = Math.max(open, price) * (1 + wick * random());
      const low = Math.min(open, price) * Math.max(0.01, 1 - wick * random());
      candles.push({
        t: end - (MAX_BARS - 1 - i) * step,
        o: open,
        h: high,
        l: low,
        c: price,
      });
    }
    L.candles = candles;
    L.price = price;
    L.dayChg = dayChangeFromCandles(candles, step);
    L.source = "sim";
    L.dead = false;
    L.live = true;
  }
}

function closeSocket() {
  clearTimeout(socketTimer);
  socketTimer = null;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  socketOpen = false;
  if (!ws) return;
  const old = ws;
  ws = null;
  old.onclose = null;
  old.close();
}

function validCandle(candle) {
  return Object.values(candle).every(Number.isFinite) &&
    candle.t > 0 && candle.o > 0 && candle.h > 0 && candle.l > 0 && candle.c > 0 &&
    candle.h >= Math.max(candle.o, candle.c) && candle.l <= Math.min(candle.o, candle.c) &&
    candle.h >= candle.l;
}

function upsertCandle(L, candle) {
  const candles = L.candles;
  const last = candles[candles.length - 1];
  if (!last || candle.t > last.t) {
    candles.push(candle);
  } else if (candle.t === last.t) {
    candles[candles.length - 1] = candle;
  } else {
    const index = candles.findIndex(item => item.t === candle.t);
    if (index >= 0) candles[index] = candle;
    else {
      candles.push(candle);
      candles.sort((a, b) => a.t - b.t);
    }
  }
  if (candles.length > MAX_BARS) candles.splice(0, candles.length - MAX_BARS);
}

function connectSocket(epoch) {
  if (epoch !== feedEpoch) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (ws) closeSocket();
  const realLayers = layers.filter(L => L.source === "real" && !L.dead);
  if (!realLayers.length) {
    updateStatus();
    return;
  }
  const requestedInterval = interval;
  const streams = realLayers.flatMap(L => [
    L.cfg.sym.toLowerCase() + "@kline_" + requestedInterval,
    L.cfg.sym.toLowerCase() + "@miniTicker",
  ]).join("/");
  let socket;
  try {
    socket = new WebSocket(WS_HOSTS[wsHost % WS_HOSTS.length] + "/stream?streams=" + streams);
  } catch (error) {
    socketOpen = false;
    wsHost++;
    updateStatus();
    reconnectTimer = setTimeout(() => connectSocket(epoch), Math.min(15000, 900 * Math.pow(2, wsTries++)));
    return;
  }
  ws = socket;
  socketTimer = setTimeout(() => {
    if (socket === ws && !socketOpen) socket.close();
  }, 8000);
  updateStatus();

  socket.onopen = () => {
    if (socket !== ws || epoch !== feedEpoch || requestedInterval !== interval) return;
    clearTimeout(socketTimer);
    socketTimer = null;
    socketOpen = true;
    wsTries = 0;
    realLayers.forEach(L => { L.live = true; });
    updateStatus();
    invalidate();
  };

  socket.onmessage = event => {
    if (socket !== ws || epoch !== feedEpoch || requestedInterval !== interval) return;
    try {
      const message = JSON.parse(event.data);
      const data = message.data || {};
      const L = layers.find(layer => layer.cfg.sym === data.s);
      if (!L || L.source !== "real") return;
      L.live = true;
      if (data.e === "kline" && data.k) {
        const k = data.k;
        const candle = { t: +k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c };
        if (validCandle(candle)) {
          upsertCandle(L, candle);
          L.price = candle.c;
        }
      } else if (data.e === "24hrMiniTicker") {
        const close = +data.c;
        const open = +data.o;
        if (Number.isFinite(close) && close > 0) L.price = close;
        if (Number.isFinite(open) && open > 0) L.dayChg = (close / open - 1) * 100;
      }
      invalidate();
    } catch (error) { /* ignore malformed socket frames */ }
  };

  socket.onclose = () => {
    if (socket !== ws || epoch !== feedEpoch || requestedInterval !== interval) return;
    clearTimeout(socketTimer);
    socketTimer = null;
    ws = null;
    socketOpen = false;
    realLayers.forEach(L => { L.live = false; });
    wsHost++;
    const delay = Math.min(15000, 900 * Math.pow(2, wsTries++));
    updateStatus();
    invalidate();
    reconnectTimer = setTimeout(() => connectSocket(epoch), delay);
  };
}

function scheduleRecovery(epoch) {
  clearTimeout(recoveryTimer);
  recoveryTimer = setTimeout(async () => {
    if (epoch !== feedEpoch) return;
    const simulated = layers.filter(L => L.source === "sim");
    if (!simulated.length) return;
    const results = await Promise.all(simulated.map(L => fetchReal(L, epoch, interval)));
    if (epoch !== feedEpoch) return;
    if (results.some(result => result === "real")) connectSocket(epoch);
    updateStatus();
    invalidate();
    scheduleRecovery(epoch);
  }, 30000);
}

async function loadInterval(nextInterval) {
  if (!INTERVAL_MS[nextInterval]) return;
  interval = nextInterval;
  safeStoreSet("dw-interval", interval);
  document.querySelectorAll(".dw-int").forEach(button => {
    const selected = button.dataset.iv === interval;
    button.classList.toggle("is-on", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });

  const epoch = ++feedEpoch;
  wsTries = 0;
  feedLoading = true;
  pointer.active = false;
  clearTimeout(recoveryTimer);
  recoveryTimer = null;
  abortFetches();
  closeSocket();
  for (const L of layers) {
    L.candles = [];
    L.price = 0;
    L.dayChg = null;
    L.source = "loading";
    L.dead = false;
    L.live = false;
  }
  updateStatus();
  invalidate();

  const results = await Promise.all(layers.map(L => fetchReal(L, epoch, interval)));
  if (epoch !== feedEpoch) return;
  const simulated = layers.filter((L, index) => results[index] === "failed");
  fillSimulation(simulated, interval);
  feedLoading = false;
  connectSocket(epoch);
  scheduleRecovery(epoch);
  updateStatus();
  invalidate();
}

function updateStatus() {
  const realCount = layers.filter(L => L.source === "real").length;
  const simCount = layers.filter(L => L.source === "sim").length;
  let text = "NO DATA";
  let state = "is-bad";
  if (feedLoading) {
    text = "LOADING";
  } else if (socketOpen) {
    text = simCount ? "LIVE + SIM" : "LIVE";
    state = simCount ? "is-warn" : "is-ok";
  } else if (ws && ws.readyState === WebSocket.CONNECTING) {
    text = simCount ? "SIM + LINK" : "CONNECTING";
    state = "is-warn";
  } else if (realCount) {
    text = simCount ? "MIXED FEED" : "RECONNECT";
    state = "is-warn";
  } else if (simCount) {
    text = "SIM FEED";
    state = "is-warn";
  }
  setText(elWs, text);
  elWs.className = "dw-ws " + state;
}

function simTick() {
  const simulated = layers.filter(L => L.source === "sim" && L.candles.length);
  if (!simulated.length || feedLoading) return;
  const step = ivMs();
  const bucket = Math.floor(Date.now() / step) * step;
  const marketShock = normalish(Math.random);
  const tickScale = Math.sqrt(0.75 / 60);

  for (const L of simulated) {
    const candles = L.candles;
    let last = candles[candles.length - 1];
    if (bucket - last.t > step * MAX_BARS) {
      fillSimulation(simulated, interval);
      invalidate();
      return;
    }
    while (last.t < bucket) {
      const next = { t: last.t + step, o: last.c, h: last.c, l: last.c, c: last.c };
      candles.push(next);
      last = next;
    }
    const move = (marketShock * 0.70 * L.cfg.beta + normalish(Math.random) * 0.56) * L.cfg.sigma * tickScale;
    last.c = Math.max(last.o * 0.02, last.c * (1 + move));
    last.h = Math.max(last.h, last.c);
    last.l = Math.min(last.l, last.c);
    if (candles.length > MAX_BARS) candles.splice(0, candles.length - MAX_BARS);
    L.price = last.c;
    L.live = true;
    L.dayChg = dayChangeFromCandles(candles, step);
  }
  updateStatus();
  invalidate();
}

function resizeCanvas() {
  const bounds = tank.parentElement.getBoundingClientRect();
  const nextW = Math.max(1, Math.floor(bounds.width));
  const nextH = Math.max(1, Math.floor(bounds.height));
  const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
  if (nextW === W && nextH === H && nextDpr === dpr) return false;
  W = nextW;
  H = nextH;
  dpr = nextDpr;
  mobile = W < 720;
  tank.width = Math.round(W * dpr);
  tank.height = Math.round(H * dpr);
  tank.style.width = W + "px";
  tank.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}

function candleMap(L, step) {
  const out = new Map();
  for (const candle of L.candles) {
    const key = Math.floor(candle.t / step) * step;
    out.set(key, candle);
  }
  return out;
}

function niceNumber(value, round) {
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / Math.pow(10, exponent);
  let niceFraction;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  return niceFraction * Math.pow(10, exponent);
}

function buildFrame() {
  const margins = { left: mobile ? 9 : 18, right: mobile ? 49 : 64, top: 16, bottom: mobile ? 28 : 31 };
  const plot = {
    left: margins.left,
    top: margins.top,
    right: Math.max(margins.left + 20, W - margins.right),
    bottom: Math.max(margins.top + 20, H - margins.bottom),
  };
  plot.w = plot.right - plot.left;
  plot.h = plot.bottom - plot.top;
  const active = layers.filter(L => !L.dead && L.candles.length);
  if (!active.length || plot.w < 20 || plot.h < 20) return { plot, empty: true };

  const step = ivMs();
  const endTime = Math.max(...active.map(L => Math.floor(L.candles[L.candles.length - 1].t / step) * step));
  // fewer, fatter bars — a candle needs room to read as a candle (Bybit-like)
  const visibleCount = Math.max(MIN_BARS, Math.min(MAX_BARS, Math.floor(plot.w / (mobile ? 7.5 : 13.0))));
  let times = Array.from({ length: visibleCount }, (_, index) => endTime - (visibleCount - 1 - index) * step);
  const mapped = active.map(L => ({ L, map: candleMap(L, step) }));
  const baselineTimes = times.slice(0, -1);
  let baseIndex = baselineTimes.findIndex(time => mapped.every(entry => entry.map.has(time)));
  if (baseIndex < 0) {
    const coverage = baselineTimes.map(time => mapped.filter(entry => entry.map.has(time)).length);
    const bestCoverage = Math.max(...coverage);
    baseIndex = coverage.findIndex(count => count === bestCoverage);
  }
  if (baseIndex < 0) baseIndex = 0;
  times = times.slice(baseIndex);
  if (times.length < 2) return { plot, empty: true };

  const series = [];
  for (const entry of mapped) {
    const first = entry.map.get(times[0]);
    if (!first || !first.c) continue;
    const base = first.c;
    const points = times.map(time => {
      const raw = entry.map.get(time);
      if (!raw) return null;
      return {
        raw,
        o: (raw.o / base - 1) * 100,
        h: (raw.h / base - 1) * 100,
        l: (raw.l / base - 1) * 100,
        c: (raw.c / base - 1) * 100,
      };
    });
    const current = [...points].reverse().find(Boolean) || null;
    series.push({ L: entry.L, points, current, base });
  }
  if (!series.length) return { plot, empty: true };

  const focused = series.find(item => item.L.cfg.name === focusName) || series[0];
  if (focused && focused.L.cfg.name !== focusName) {
    focusName = focused.L.cfg.name;
    safeStoreSet("dw-focus", focusName);
  }
  // Non-linear (asinh) scale — the centre is stretched so the focused
  // asset's candles breathe even when it moves 0.1%, while runaway coins
  // compress smoothly toward the edges instead of flattening everyone.
  let focusReach = 0;
  if (focused) {
    for (const point of focused.points) {
      if (!point) continue;
      focusReach = Math.max(focusReach, Math.abs(point.h), Math.abs(point.l));
    }
  }
  const chorusAbs = [];
  for (const item of series) {
    if (item === focused) continue;
    for (const point of item.points) if (point) chorusAbs.push(Math.abs(point.c));
  }
  chorusAbs.sort((a, b) => a - b);
  const chorusReach = chorusAbs.length ? chorusAbs[Math.round(0.97 * (chorusAbs.length - 1))] : 0;
  // knee: below this the scale is ~linear, above it compresses
  const knee = Math.max(0.05, focusReach * 0.85 || 0.15);
  const T = value => Math.asinh(value / knee);
  const reach = Math.max(focusReach * 1.18, chorusReach * 1.02, knee * 1.2);
  const tMax = T(reach);
  const tMin = -tMax;

  // ticks: nice % levels placed through the same transform
  const tickCandidates = [0.05, 0.1, 0.25, 0.5, 1, 2, 3, 5, 8, 12, 20];
  const yTicks = [0];
  for (const level of tickCandidates) {
    if (level > reach * 0.99) break;
    yTicks.push(level, -level);
  }
  yTicks.sort((a, b) => a - b);
  const yMin = -reach;
  const yMax = reach;

  const xAt = index => plot.left + index / Math.max(1, times.length - 1) * plot.w;
  const yAt = value => {
    const t = Math.max(tMin, Math.min(tMax, T(value)));
    return plot.top + (tMax - t) / Math.max(0.000001, tMax - tMin) * plot.h;
  };
  const byName = new Map(series.map(item => [item.L.cfg.name, item]));
  return { plot, times, series, byName, focused, yMin, yMax, yTicks, xAt, yAt, empty: false };
}

function formatAxisTime(timestamp) {
  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  if (interval === "1s") return hh + ":" + mm + ":" + ss;
  if (interval === "1h") {
    const day = String(date.getDate()).padStart(2, "0");
    return day + " " + hh + ":" + mm;
  }
  return hh + ":" + mm;
}

function formatFullTime(timestamp) {
  const date = new Date(timestamp);
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${day} ${month} · ${hh}:${mm}${interval === "1s" ? ":" + ss : ""}`;
}

function correlation(a, b) {
  if (!a || !b) return null;
  const pairs = [];
  for (let i = 1; i < a.points.length; i++) {
    const a0 = a.points[i - 1];
    const a1 = a.points[i];
    const b0 = b.points[i - 1];
    const b1 = b.points[i];
    if (!a0 || !a1 || !b0 || !b1 || a0.raw.c <= 0 || b0.raw.c <= 0) continue;
    pairs.push([Math.log(a1.raw.c / a0.raw.c), Math.log(b1.raw.c / b0.raw.c)]);
  }
  const sample = pairs.slice(-90);
  if (sample.length < 8) return null;
  const meanA = sample.reduce((sum, pair) => sum + pair[0], 0) / sample.length;
  const meanB = sample.reduce((sum, pair) => sum + pair[1], 0) / sample.length;
  let numerator = 0;
  let squareA = 0;
  let squareB = 0;
  for (const pair of sample) {
    const da = pair[0] - meanA;
    const db = pair[1] - meanB;
    numerator += da * db;
    squareA += da * da;
    squareB += db * db;
  }
  if (!squareA || !squareB) return null;
  return Math.max(-1, Math.min(1, numerator / Math.sqrt(squareA * squareB)));
}

function drawGrid(nextFrame) {
  const plot = nextFrame.plot;
  ctx.fillStyle = "rgba(7, 7, 5, 0.86)";
  ctx.fillRect(plot.left, plot.top, plot.w, plot.h);
  ctx.lineWidth = 1;
  ctx.font = (mobile ? "8px" : "9px") + ' "JetBrains Mono", monospace';
  ctx.textBaseline = "middle";

  for (const value of nextFrame.yTicks) {
    const y = Math.round(nextFrame.yAt(value)) + 0.5;
    const zero = Math.abs(value) < 1e-10;
    ctx.save();
    ctx.strokeStyle = zero ? "rgba(255, 177, 66, 0.38)" : "rgba(232, 205, 160, 0.09)";
    if (zero) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(plot.left, y);
    ctx.lineTo(plot.right, y);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = zero ? "rgba(255, 177, 66, 0.88)" : "rgba(139, 131, 117, 0.78)";
    ctx.textAlign = "left";
    const digits = Math.abs(value) < 0.1 ? 2 : Math.abs(value) < 10 ? 1 : 0;
    ctx.fillText((value > 0 ? "+" : "") + value.toFixed(digits) + "%", plot.right + 8, y);
  }

  const tickCount = mobile ? 3 : 5;
  for (let i = 0; i < tickCount; i++) {
    const index = Math.round(i / (tickCount - 1) * (nextFrame.times.length - 1));
    const x = Math.round(nextFrame.xAt(index)) + 0.5;
    ctx.strokeStyle = "rgba(232, 205, 160, 0.08)";
    ctx.beginPath();
    ctx.moveTo(x, plot.top);
    ctx.lineTo(x, plot.bottom);
    ctx.stroke();
    ctx.fillStyle = "rgba(139, 131, 117, 0.72)";
    ctx.textAlign = i === 0 ? "left" : i === tickCount - 1 ? "right" : "center";
    ctx.textBaseline = "top";
    ctx.fillText(formatAxisTime(nextFrame.times[index]), x, plot.bottom + 9);
  }

  ctx.strokeStyle = "rgba(255, 177, 66, 0.18)";
  ctx.strokeRect(plot.left + 0.5, plot.top + 0.5, plot.w - 1, plot.h - 1);
  ctx.fillStyle = "rgba(255, 177, 66, 0.62)";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("INDEX %", plot.right, 3);
}

// Bybit-style candles for the focused asset: solid bodies, crisp 1px wick
// dead-centered, whole-pixel geometry so nothing smears.
function drawFocusedCandles(nextFrame) {
  const focused = nextFrame.focused;
  if (!focused) return;
  const slot = nextFrame.plot.w / Math.max(1, nextFrame.times.length - 1);
  const bodyWidth = Math.max(3, Math.round(slot * 0.66));
  const half = Math.floor(bodyWidth / 2);
  for (let index = 0; index < focused.points.length; index++) {
    const point = focused.points[index];
    if (!point) continue;
    const cx = Math.round(nextFrame.xAt(index));
    const yHigh = Math.round(nextFrame.yAt(point.h));
    const yLow = Math.round(nextFrame.yAt(point.l));
    const yOpen = Math.round(nextFrame.yAt(point.o));
    const yClose = Math.round(nextFrame.yAt(point.c));
    const up = point.raw.c >= point.raw.o;
    const color = up ? UP : DOWN;
    // wick — 1px, centered on the body
    ctx.fillStyle = rgba(color, 0.85);
    ctx.fillRect(cx, yHigh, 1, Math.max(1, yLow - yHigh));
    // body — solid, min 1px (doji)
    const top = Math.min(yOpen, yClose);
    const height = Math.max(1, Math.abs(yClose - yOpen));
    ctx.fillStyle = rgba(color, 0.95);
    ctx.fillRect(cx - half, top, bodyWidth, height);
  }
}

function strokeSeries(nextFrame, item, focused) {
  ctx.save();
  // chorus = ghost lines behind the focused candles: thin, dim, no glow
  ctx.strokeStyle = rgba(item.L.cfg.color, focused ? 0.9 : 0.22);
  ctx.lineWidth = focused ? 1.6 : 1;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  let drawing = false;
  for (let index = 0; index < item.points.length; index++) {
    const point = item.points[index];
    if (!point) {
      drawing = false;
      continue;
    }
    const x = nextFrame.xAt(index);
    const y = nextFrame.yAt(point.c);
    if (!drawing) {
      ctx.moveTo(x, y);
      drawing = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();

  if (item.current) {
    const lastIndex = item.points.lastIndexOf(item.current);
    const x = nextFrame.xAt(lastIndex);
    const y = nextFrame.yAt(item.current.c);
    ctx.fillStyle = rgba(item.L.cfg.color, focused ? 1 : 0.6);
    ctx.beginPath();
    ctx.arc(x, y, focused ? 2.6 : 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// chorus only — the focused asset speaks through its candles, not a line
function drawSeries(nextFrame) {
  for (const item of nextFrame.series) {
    if (item !== nextFrame.focused) strokeSeries(nextFrame, item, false);
  }
}

function crosshairIndex(nextFrame) {
  const ratio = (pointer.x - nextFrame.plot.left) / Math.max(1, nextFrame.plot.w);
  return Math.max(0, Math.min(nextFrame.times.length - 1, Math.round(ratio * (nextFrame.times.length - 1))));
}

function drawCrosshair(nextFrame) {
  const plot = nextFrame.plot;
  if (!pointer.active || pointer.x < plot.left || pointer.x > plot.right || pointer.y < plot.top || pointer.y > plot.bottom) {
    hoverCard.hidden = true;
    return;
  }
  const index = crosshairIndex(nextFrame);
  const x = nextFrame.xAt(index);
  ctx.save();
  ctx.strokeStyle = "rgba(222, 216, 204, 0.34)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(Math.round(x) + 0.5, plot.top);
  ctx.lineTo(Math.round(x) + 0.5, plot.bottom);
  ctx.stroke();
  ctx.restore();

  for (const item of nextFrame.series) {
    const point = item.points[index];
    if (!point) continue;
    ctx.fillStyle = item.L.cfg.color;
    ctx.beginPath();
    ctx.arc(x, nextFrame.yAt(point.c), item === nextFrame.focused ? 3.5 : 2.15, 0, Math.PI * 2);
    ctx.fill();
  }

  const focused = nextFrame.focused;
  const point = focused && focused.points[index];
  if (!focused || !point) {
    hoverCard.hidden = true;
    return;
  }
  const y = nextFrame.yAt(point.c);
  ctx.save();
  ctx.strokeStyle = rgba(focused.L.cfg.color, 0.28);
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(plot.left, Math.round(y) + 0.5);
  ctx.lineTo(plot.right, Math.round(y) + 0.5);
  ctx.stroke();
  ctx.restore();

  hoverCard.hidden = false;
  const cardWidth = hoverCard.offsetWidth || 184;
  const cardHeight = hoverCard.offsetHeight || 78;
  const preferredLeft = x > W - cardWidth - 20 ? x - cardWidth - 12 : x + 12;
  hoverCard.style.left = Math.max(8, Math.min(W - cardWidth - 8, preferredLeft)) + "px";
  hoverCard.style.top = Math.max(8, Math.min(H - cardHeight - 8, pointer.y - cardHeight / 2)) + "px";
  hoverCard.style.borderColor = rgba(focused.L.cfg.color, 0.62);
  hoverName.style.color = focused.L.cfg.color;
  hoverRet.style.color = point.c >= 0 ? UP : DOWN;
  setText(hoverName, focused.L.cfg.name);
  setText(hoverRet, fmtPct(point.c));
  setText(hoverPx, fmtPrice(point.raw.c, true) + "  ·  O " + fmtPrice(point.raw.o));
  setText(hoverTime, formatFullTime(nextFrame.times[index]));
}

function drawEmpty(nextFrame) {
  const plot = nextFrame.plot;
  ctx.fillStyle = "rgba(7, 7, 5, 0.86)";
  ctx.fillRect(plot.left, plot.top, plot.w, plot.h);
  ctx.strokeStyle = "rgba(255, 177, 66, 0.18)";
  ctx.strokeRect(plot.left + 0.5, plot.top + 0.5, plot.w - 1, plot.h - 1);
  ctx.fillStyle = "rgba(139, 131, 117, 0.78)";
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(feedLoading ? "LOADING MARKET DATA" : "NO ALIGNED MARKET DATA", plot.left + plot.w / 2, plot.top + plot.h / 2);
  hoverCard.hidden = true;
}

function updateLegend(nextFrame) {
  const focusSeries = nextFrame && !nextFrame.empty ? nextFrame.focused : null;
  for (const L of layers) {
    const ui = L.ui;
    const item = nextFrame && !nextFrame.empty ? nextFrame.byName.get(L.cfg.name) : null;
    const current = item && item.current;
    ui.button.classList.toggle("is-focus", L.cfg.name === focusName);
    ui.button.classList.toggle("is-offline", L.dead || L.source === "offline");
    ui.button.disabled = L.dead || L.source === "offline";
    ui.button.setAttribute("aria-pressed", L.cfg.name === focusName ? "true" : "false");
    setText(ui.rel, current ? fmtPct(current.c) : "—");
    ui.rel.className = "l-rel " + (current && current.c < 0 ? "is-dn" : "is-up");
    setText(ui.px, L.dead ? "OFFLINE" : fmtPrice(L.price, true));
    let detail = "WAIT";
    if (L.source === "offline") detail = "OFFLINE";
    else if (item === focusSeries) detail = L.source === "sim" ? "SIM · FOCUS" : "FOCUS";
    else if (item && focusSeries) {
      const rho = correlation(item, focusSeries);
      detail = (L.source === "sim" ? "SIM · " : "") + (rho == null ? "ρ —" : "ρ " + (rho >= 0 ? "+" : "") + rho.toFixed(2));
    } else if (L.source === "sim") detail = "SIM";
    setText(ui.corr, detail);
    ui.corr.classList.toggle("l-source", L.source === "sim");
    ui.button.title = L.cfg.name + " — select candles";
  }

  const btc = layers.find(L => L.cfg.name === "BTC");
  const btcSeries = nextFrame && !nextFrame.empty ? nextFrame.byName.get("BTC") : null;
  if (btc && btc.price) {
    setText(elBtcPx, fmtPrice(btc.price, true));
    const change = Number.isFinite(btc.dayChg) ? btc.dayChg : btcSeries && btcSeries.current ? btcSeries.current.c : null;
    setText(elBtcChg, change == null ? "" : fmtPct(change));
    elBtcChg.className = "btc-chg " + (change != null && change < 0 ? "is-dn" : "is-up");
  } else {
    setText(elBtcPx, "—");
    setText(elBtcChg, "");
  }
  setText(elFocus, focusName);

  if (nextFrame && !nextFrame.empty) {
    const start = formatFullTime(nextFrame.times[0]).replace(" · ", " ");
    const end = formatFullTime(nextFrame.times[nextFrame.times.length - 1]).replace(" · ", " ");
    setText(elWindow, nextFrame.times.length + " BARS · " + start + " — " + end);
  } else {
    setText(elWindow, feedLoading ? "WAITING FOR DATA" : "NO ALIGNED DATA");
  }
}

function render() {
  drawQueued = false;
  resizeCanvas();
  ctx.clearRect(0, 0, W, H);
  frame = buildFrame();
  if (frame.empty) {
    drawEmpty(frame);
  } else {
    drawGrid(frame);
    drawSeries(frame);          // ghost chorus behind
    drawFocusedCandles(frame);  // focus in front
    drawCrosshair(frame);
  }
  updateLegend(frame);
}

function invalidate() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(render);
}

function pointerPosition(event) {
  const bounds = tank.getBoundingClientRect();
  pointer.x = event.clientX - bounds.left;
  pointer.y = event.clientY - bounds.top;
}

tank.addEventListener("pointermove", event => {
  pointerPosition(event);
  pointer.active = true;
  invalidate();
});

tank.addEventListener("pointerleave", () => {
  pointer.active = false;
  invalidate();
});

tank.addEventListener("pointerdown", event => {
  pointerPosition(event);
  pointer.active = true;
  if (frame && !frame.empty) {
    const index = crosshairIndex(frame);
    let nearest = null;
    let distance = Infinity;
    for (const item of frame.series) {
      const point = item.points[index];
      if (!point) continue;
      const nextDistance = Math.abs(frame.yAt(point.c) - pointer.y);
      if (nextDistance < distance) {
        nearest = item;
        distance = nextDistance;
      }
    }
    if (nearest && distance < 18) setFocus(nearest.L.cfg.name);
  }
  invalidate();
});

document.querySelectorAll(".dw-int").forEach(button => {
  button.addEventListener("click", () => loadInterval(button.dataset.iv));
});

if (window.ResizeObserver) {
  const observer = new ResizeObserver(() => invalidate());
  observer.observe(tank.parentElement);
} else {
  window.addEventListener("resize", invalidate);
}

window.addEventListener("beforeunload", () => {
  abortFetches();
  closeSocket();
});

initLegend();
setInterval(simTick, 750);
loadInterval(interval);
invalidate();
})();
