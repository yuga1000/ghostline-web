// MYSTRA Bandanas — data layer: local mock + Supabase adapter
//
// ── SUPABASE SETUP (when ready) ──────────────────────────
// 1. Create tables:
//
//    create table bandanas (
//      id text primary key,          -- "BND-01"
//      name text not null,
//      price numeric not null,
//      currency text default 'USDT',
//      status text default 'IN_STOCK',   -- IN_STOCK | LOW | SOLD_OUT
//      stock int, total int,
//      colorways jsonb,              -- [{"id":"amber","hex":"#ffb142"}, ...]
//      spread_url text,              -- full unfolded scan (square)
//      sort int
//    );
//
//    create table orders (
//      id uuid primary key default gen_random_uuid(),
//      created_at timestamptz default now(),
//      product_id text, colorway text,
//      contact text, address text,
//      network text, tx_hash text,
//      status text default 'PENDING'
//    );
//
// 2. Paste project URL + anon key below. Page switches from
//    LOCAL_MOCK to SUPABASE automatically.

const SUPABASE_CONFIG = {
  url: "https://alqavrioetqfylwkqmak.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscWF2cmlvZXRxZnlsd2txbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTgyNDksImV4cCI6MjA2NTM5NDI0OX0.V7cQfoAat4LFC0zvye6B8W3ELNSA2kZE0D-If_fGfdc",
};

// ── crypto wallets ───────────────────────────────────────
// BTC intentionally absent until a real address exists —
// network buttons render from these keys
const WALLETS = {
  "USDT-TRC20": "TTUboZ6F42TKZYWDiuKzMuchVsd2R3rAsU",
};

// ── striped SVG placeholder (until real scans arrive) ────
function bndPlaceholder(code) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
  <defs>
    <pattern id="st" width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="#050402"/>
      <rect width="7" height="14" fill="#0d0903"/>
    </pattern>
  </defs>
  <rect width="800" height="800" fill="url(#st)"/>
  <rect x="14" y="14" width="772" height="772" fill="none" stroke="#a8731d" stroke-width="2" stroke-dasharray="10 8" opacity="0.6"/>
  <rect x="350" y="350" width="100" height="100" fill="none" stroke="#a8731d" stroke-width="2" opacity="0.7"/>
  <line x1="400" y1="320" x2="400" y2="480" stroke="#a8731d" stroke-width="1" opacity="0.5"/>
  <line x1="320" y1="400" x2="480" y2="400" stroke="#a8731d" stroke-width="1" opacity="0.5"/>
  <text x="400" y="540" text-anchor="middle" font-family="monospace" font-size="26" fill="#a8731d">${code} · SPREAD SCAN</text>
  <text x="400" y="576" text-anchor="middle" font-family="monospace" font-size="20" fill="#7c7466">drop 1:1 photo here later</text>
</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// ── local mock catalog (draft content — edit freely) ─────
const LOCAL_BANDANAS = [
  { id: "BND-01", name: "GHOST GRID", price: 24, currency: "USDT",
    status: "IN_STOCK", stock: 21, total: 30, sort: 1,
    colorways: [
      { id: "amber", hex: "#ffb142" },
      { id: "green", hex: "#6cd97e" },
      { id: "dos",   hex: "#5d8fff" }],
    spread_url: null },
  { id: "BND-02", name: "SCANLINE", price: 22, currency: "USDT",
    status: "IN_STOCK", stock: 26, total: 30, sort: 2,
    colorways: [{ id: "amber", hex: "#ffb142" }],
    spread_url: null },
  { id: "BND-03", name: "HEX CRAWLER", price: 24, currency: "USDT",
    status: "IN_STOCK", stock: 17, total: 30, sort: 3,
    colorways: [
      { id: "green", hex: "#6cd97e" },
      { id: "mono",  hex: "#e8e2d6" }],
    spread_url: null },
  { id: "BND-04", name: "PHOSPHOR BURN", price: 26, currency: "USDT",
    status: "LOW", stock: 4, total: 30, sort: 4,
    colorways: [
      { id: "amber", hex: "#ffb142" },
      { id: "alert", hex: "#ff5e5e" }],
    spread_url: null },
  { id: "BND-05", name: "WIREFRAME 01", price: 28, currency: "USDT",
    status: "IN_STOCK", stock: 12, total: 20, sort: 5,
    colorways: [{ id: "dos", hex: "#5d8fff" }],
    spread_url: null },
  { id: "BND-06", name: "DEAD PIXEL", price: 22, currency: "USDT",
    status: "SOLD_OUT", stock: 0, total: 30, sort: 6,
    colorways: [
      { id: "mono",  hex: "#e8e2d6" },
      { id: "alert", hex: "#ff5e5e" }],
    spread_url: null },
];

function sbConfigured() {
  return !!(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
}

function sbHeaders() {
  return {
    "apikey": SUPABASE_CONFIG.anonKey,
    "Authorization": "Bearer " + SUPABASE_CONFIG.anonKey,
    "Content-Type": "application/json",
  };
}

// load catalog: Supabase if configured, otherwise local mock
async function loadBandanas() {
  if (!sbConfigured()) {
    return { source: "LOCAL_MOCK", items: LOCAL_BANDANAS };
  }
  try {
    const r = await fetch(
      SUPABASE_CONFIG.url + "/rest/v1/bandanas?select=*&order=sort.asc",
      { headers: sbHeaders() }
    );
    if (!r.ok) throw new Error("http " + r.status);
    const items = await r.json();
    if (!Array.isArray(items) || items.length === 0) {
      return { source: "SUPABASE_EMPTY→LOCAL", items: LOCAL_BANDANAS };
    }
    return { source: "SUPABASE", items };
  } catch (e) {
    return { source: "SB_ERR→LOCAL", items: LOCAL_BANDANAS };
  }
}

// submit order: Supabase insert, or localStorage queue offline
async function submitOrder(order) {
  if (sbConfigured()) {
    try {
      // no "return=representation" — anon can INSERT but not SELECT orders
      // (privacy: buyer contacts aren't readable back), so don't ask for the row
      const r = await fetch(SUPABASE_CONFIG.url + "/rest/v1/orders", {
        method: "POST",
        headers: { ...sbHeaders(), "Prefer": "return=minimal" },
        body: JSON.stringify(order),
      });
      if (!r.ok) throw new Error("http " + r.status);
      const id = "GL-" + Date.now().toString(36).toUpperCase();
      return { ok: true, id, mode: "SUPABASE" };
    } catch (e) {
      // fall through to local queue
    }
  }
  const key = "bnd_orders_queue";
  const q = JSON.parse(localStorage.getItem(key) || "[]");
  const id = "LOCAL-" + Date.now().toString(36).toUpperCase();
  q.push({ ...order, id, queued_at: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(q));
  return { ok: true, id, mode: "LOCAL_QUEUE" };
}

// Wishlist signup for locked designs — insert-only like orders.
async function submitWishlist(productId, email) {
  const e = (email || "").trim();
  if (!/.+@.+\..+/.test(e)) return { ok: false, msg: "INVALID EMAIL" };
  if (sbConfigured()) {
    try {
      const r = await fetch(SUPABASE_CONFIG.url + "/rest/v1/wishlist", {
        method: "POST",
        headers: { ...sbHeaders(), "Prefer": "return=minimal" },
        body: JSON.stringify({ product_id: productId, email: e }),
      });
      if (!r.ok) throw new Error("http " + r.status);
      return { ok: true, msg: "ADDED TO WISHLIST" };
    } catch (err) { /* fall through to local */ }
  }
  const key = "bnd_wishlist_queue";
  const q = JSON.parse(localStorage.getItem(key) || "[]");
  q.push({ product_id: productId, email: e, queued_at: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(q));
  return { ok: true, msg: "ADDED TO WISHLIST" };
}

// Redeem a one-time GHOST_PTS code (issued manually after a verified
// purchase). Server side: ghost_codes table + bnd_redeem_code() RPC that
// atomically marks the code used and returns its pts (-1 = invalid/used).
async function redeemCode(code, contact) {
  if (!sbConfigured()) return { ok: false, msg: "CODE SYSTEM OFFLINE" };
  try {
    const r = await fetch(SUPABASE_CONFIG.url + "/rest/v1/rpc/bnd_redeem_code", {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify({ p_code: code, p_contact: contact || null }),
    });
    if (!r.ok) throw new Error("http " + r.status);
    const pts = await r.json();
    if (typeof pts !== "number" || pts <= 0) return { ok: false, msg: "INVALID OR USED CODE" };
    return { ok: true, pts, msg: "+" + pts + " GHOST_PTS" };
  } catch (e) {
    return { ok: false, msg: "CODE SYSTEM OFFLINE" };
  }
}

// Rewrite a stored /bandanas/X.PNG URL to a compressed webp variant.
// "web" (~250KB, 1400px) for everything, "full" (~550KB, 2400px) for zoom.
// Leaves non-matching URLs (placeholders, data URIs) untouched.
function bndImg(url, variant) {
  if (!url || typeof url !== "string") return url;
  const m = url.match(/\/bandanas\/([^/?]+)\.png(\?.*)?$/i);
  if (!m) return url;
  const folder = variant === "full" ? "bandanas-full" : "bandanas-web";
  return url.replace(/\/bandanas\/[^/?]+\.png(\?.*)?$/i, "/" + folder + "/" + m[1] + ".webp");
}

Object.assign(window, {
  SUPABASE_CONFIG, WALLETS,
  bndPlaceholder, bndImg, LOCAL_BANDANAS,
  sbConfigured, loadBandanas, submitOrder, submitWishlist, redeemCode,
});
