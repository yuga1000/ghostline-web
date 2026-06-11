// MYSTRA Bandanas — catalog + unfold detail + crypto order

const { useState, useEffect, useRef, useMemo } = React;

const BND_PALETTES = {
  amber:  { accent: "#ffb142", dim: "#a8731d", glow: "rgba(255,180,80,.22)",  bg: "#000000" },
  green:  { accent: "#8aff9e", dim: "#1f7a33", glow: "rgba(120,255,140,.18)", bg: "#000000" },
  alert:  { accent: "#ff5e5e", dim: "#a31f1f", glow: "rgba(255,90,90,.22)",   bg: "#000000" },
  mono:   { accent: "#e8e2d6", dim: "#7a7468", glow: "rgba(232,226,214,.14)", bg: "#000000" },
  dos:    { accent: "#5d8fff", dim: "#1f3aa8", glow: "rgba(93,143,255,.22)",  bg: "#000000" },
};

const BND_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "mono",
  "scanlines": false,
  "showGrid": true,
  "unfoldMs": 620,
  "detailMono": true
}/*EDITMODE-END*/;

// ─── BTC ticker (same as Lab page) ───────────────────────
function useBndBtc() {
  const [data, setData] = useState({ price: null, change: null, status: "init" });
  useEffect(() => {
    let alive = true;
    const fetchPrice = async () => {
      try {
        const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true");
        if (!r.ok) throw new Error("http");
        const j = await r.json();
        if (!alive) return;
        setData({ price: j.bitcoin && j.bitcoin.usd, change: j.bitcoin && j.bitcoin.usd_24h_change, status: "ok" });
      } catch (e) { if (alive) setData(d => ({ ...d, status: "err" })); }
    };
    fetchPrice();
    const id = setInterval(fetchPrice, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return data;
}

function BndStatusDot({ status }) {
  const cls = { IN_STOCK: "dot-ok", LOW: "dot-warn", SOLD_OUT: "dot-bad" }[status] || "dot-mute";
  return <span className={"dot " + cls}></span>;
}

function StockBar({ stock, total, segments = 14 }) {
  const filled = total ? Math.round((stock / total) * segments) : 0;
  return (
    <span className="stockbar">
      {Array.from({ length: segments }).map((_, i) => (
        <span key={i} className={"stk-seg " + (i < filled ? "on" : "off")}></span>
      ))}
    </span>
  );
}

// ─── Topbar ──────────────────────────────────────────────
function BndTopBar() {
  const btc = useBndBtc();
  const fmt = n => n == null ? "——" : "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const chg = btc.change == null ? null : btc.change.toFixed(2);
  const items = [
    ["HOME", "https://ghostline.live/"],
    ["STREAM", "https://ghostline.live/stream.html"],
    ["GALLERY", "https://ghostline.live/gallery.html"],
    ["POLAROIDS", "https://ghostline.live/polaroids.html"],
    ["ORDER", "https://ghostline.live/order.html"],
    ["MARKET", "https://ghostline.live/market.html"],
    ["MYSTRA", "MYSTRA Lab.html"],
    ["BANDANAS", "#", true],
  ];
  return (
    <header className="topbar">
      <div className="tb-row tb-row-1">
        <div className="tb-brand">▣ GHOSTLINE_LAB</div>
        <div className="tb-btc">
          <span className="btc-lbl">BTC</span>
          <span className="btc-px">{fmt(btc.price)}</span>
          {chg != null && (
            <span className={"btc-chg " + (btc.change >= 0 ? "is-up" : "is-dn")}>
              {btc.change >= 0 ? "+" : ""}{chg}%
            </span>
          )}
          <span className={"btc-dot dot " + (btc.status === "ok" ? "dot-ok" : btc.status === "err" ? "dot-bad" : "dot-warn")}></span>
        </div>
      </div>
      <nav className="tb-row tb-row-2">
        {items.map(([l, h, cur]) => (
          <a key={l} href={h} className={"tb-link " + (cur ? "is-current" : "")}>
            {cur ? "▶ " : ""}{l}
          </a>
        ))}
      </nav>
    </header>
  );
}

// ─── Random pixel sparks over card photo ─────────────────
function PixelSparks() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    let t;
    const loop = () => {
      if (!alive) return;
      setTick(n => n + 1);
      t = setTimeout(loop, 320 + Math.random() * 480);
    };
    t = setTimeout(loop, Math.random() * 600);
    return () => { alive = false; clearTimeout(t); };
  }, []);
  const px = useMemo(() => {
    const n = 1 + Math.floor(Math.random() * 3);   // 1-3 pixels per burst
    return Array.from({ length: n }, () => ({
      left: 2 + Math.random() * 94,
      top: 2 + Math.random() * 94,
      size: [2, 3, 4][Math.floor(Math.random() * 3)],
      bright: Math.random() < 0.3,
    }));
  }, [tick]);
  return (
    <span className="bnd-sparks" aria-hidden="true">
      {px.map((p, i) => (
        <span key={tick + ":" + i}
          className={"bnd-spark" + (p.bright ? " is-bright" : "")}
          style={{ left: p.left + "%", top: p.top + "%", width: p.size + "px", height: p.size + "px" }}></span>
      ))}
    </span>
  );
}

// ─── Boot log reveal: terminal lines, then the card ──────
function BootReveal({ index, b, children }) {
  const locked = b.status === "LOCKED";
  const lines = useMemo(() => [
    "> mount /drop_01/" + b.id.toLowerCase(),
    "> load spread.png ....... ok",
    "> decrypt colorways ..... ok",
    "> verify stock .......... " + (locked ? "denied" : "ok"),
    locked ? "> access ............ LOCKED" : "> render",
  ], [b.id, locked]);
  const [n, setN] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const start = 140 + index * 130;
    const ts = lines.map((_, i) => setTimeout(() => setN(i + 1), start + i * 75));
    ts.push(setTimeout(() => setDone(true), start + lines.length * 75 + 150));
    return () => ts.forEach(clearTimeout);
  }, []);
  if (done) return <div className="boot-in">{children}</div>;
  return (
    <article className="bnd-card is-boot" aria-hidden="true">
      <div className="bnd-preview">
        <div className="bootlog">
          {lines.slice(0, n).map((l, i) => (
            <div key={i} className={"bl-line" + (i === n - 1 ? " is-last" : "")}>{l}</div>
          ))}
          <span className="bl-cursor">▮</span>
        </div>
      </div>
      <div className="bnd-meta">
        <div className="bl-line">{n >= lines.length ? "> init card…" : "> …"}</div>
      </div>
    </article>
  );
}

// ─── Catalog card ────────────────────────────────────────
function BndCard({ b, onOpen }) {
  const [cw, setCw] = useState(0);
  const [warn, setWarn] = useState(0);
  const img = bndImg(b.spread_url, "web") || bndPlaceholder(b.id);
  const sold = b.status === "SOLD_OUT";
  const locked = b.status === "LOCKED";
  // mini previews of unlocked gallery variants (not color swatches)
  const gal = Array.isArray(b.gallery) ? b.gallery : [];
  const lockedIdx = Array.isArray(b.locked_gallery) ? b.locked_gallery : [];
  const unlockedThumbs = gal.filter((_, i) => lockedIdx.indexOf(i) === -1).map(u => bndImg(u, "web"));
  const variantThumbs = unlockedThumbs.slice(0, 3);
  const variantMore = Math.max(0, unlockedThumbs.length - 3);
  useEffect(() => {
    if (!warn) return;
    const t = setTimeout(() => setWarn(0), 1300);
    return () => clearTimeout(t);
  }, [warn]);
  return (
    <article className={"bnd-card" + (sold ? " is-sold" : "") + (locked ? " is-locked" : "")} data-screen-label={"Card " + b.id}>
      <button className="bnd-preview" onClick={() => locked ? setWarn(w => w + 1) : onOpen(b, cw)} aria-label={locked ? b.name + " locked" : "open " + b.name}>
        <span className="bnd-folded">
          <img className="bnd-img" src={img} loading="lazy" decoding="async" alt="" />
          <span className="bnd-tint" style={{ background: b.colorways[cw].hex }}></span>
          <span className="bnd-foldline bnd-fl-v"></span>
          <span className="bnd-foldline bnd-fl-h"></span>
          <PixelSparks />
        </span>
        <span className="bnd-open-hint">[ UNFOLD ]</span>
        {sold && <span className="bnd-sold-stamp">SOLD_OUT</span>}
        {locked && warn === 0 && <span className="bnd-locked-stamp">▒ LOCKED</span>}
        {warn > 0 && (
          <span className="gal-warn" key={warn}>
            <span className="gal-warn-box">▒ LOCKED // NOT ENOUGH GHOST_PTS</span>
          </span>
        )}
      </button>
      <div className="bnd-meta">
        <div className="bnd-meta-row">
          <span className="bnd-code">{b.id}</span>
          <span className="bnd-status"><BndStatusDot status={b.status} /> {b.status}</span>
        </div>
        <h2 className="bnd-name">{b.name}</h2>
        <div className="bnd-meta-row">
          <span className="bnd-price">{locked ? "··" : b.price} <i>{b.currency}</i></span>
          {!locked && variantThumbs.length > 0 && (
            <span className="bnd-swatches">
              {variantThumbs.map((u, i) => (
                <span key={i} className="bnd-swatch">
                  <img src={u} loading="lazy" decoding="async" alt="" />
                </span>
              ))}
              {variantMore > 0 && <span className="bnd-swatch-more">+{variantMore}</span>}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Unfold spread (2-stage cloth unfold) ────────────────
// natural aspect-ratio of the scan, so non-square photos don't distort
const aspectCache = {};
function useImgAspect(url) {
  const [, bump] = useState(0);
  useEffect(() => {
    if (!url || aspectCache[url]) return;
    const im = new Image();
    im.onload = () => {
      if (im.naturalWidth && im.naturalHeight) {
        aspectCache[url] = im.naturalWidth + " / " + im.naturalHeight;
        bump(n => n + 1);
      }
    };
    im.src = url;
  }, [url]);
  return url ? aspectCache[url] : null;
}

function UnfoldSpread({ b, cwIdx, unfoldMs, imgOverride, bgColor, photoLabel, onImgClick }) {
  const [stage, setStage] = useState(0);
  const img = imgOverride || b.spread_url || bndPlaceholder(b.id);
  const tint = b.colorways[cwIdx].hex;
  const aspect = useImgAspect(img) || "1 / 1";
  useEffect(() => {
    setStage(0);
    const t1 = setTimeout(() => setStage(1), 220);
    const t2 = setTimeout(() => setStage(2), 220 + unfoldMs);
    const t3 = setTimeout(() => setStage(3), 220 + unfoldMs * 2 + 60);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [b.id, cwIdx, img]);
  const zoomable = stage >= 2 && onImgClick;
  const q = (x, y) => ({
    backgroundColor: bgColor || undefined,
    backgroundImage: `url("${img}")`,
    backgroundSize: "200% 200%",
    backgroundPosition: `${x}% ${y}%`,
  });
  const dur = { transitionDuration: unfoldMs + "ms" };
  return (
    <div className="spread-stage">
      <div className="spread" data-stage={stage}
        style={{ "--tint": tint, aspectRatio: aspect, cursor: zoomable ? "zoom-in" : undefined }}
        onClick={zoomable ? () => onImgClick() : undefined}>
        <div className="sq q-tl" style={q(0, 0)}>
          <span className="q-tint"></span>
        </div>
        <div className="flap f-tr" style={dur}>
          <span className="flap-face" style={q(100, 0)}><span className="q-tint"></span></span>
          <span className="flap-back"></span>
        </div>
        <div className="flap f-bottom" style={dur}>
          <span className="flap-face" style={{
            backgroundColor: bgColor || undefined,
            backgroundImage: `url("${img}")`,
            backgroundSize: "100% 200%",
            backgroundPosition: "0 100%",
          }}><span className="q-tint"></span></span>
          <span className="flap-back"></span>
        </div>
        {/* flat full image swapped in once the unfold finishes — avoids 3D edge cases */}
        <div className="spread-flat" style={{
          backgroundColor: bgColor || undefined,
          backgroundImage: `url("${img}")`,
        }}>
          <span className="q-tint"></span>
        </div>
      </div>
      <div className="spread-caption">
        <span className="sc-id">{b.id} · {photoLabel || "spread"}</span>
        <span className={"spread-state " + (stage >= 2 ? "is-open" : "")}>
          {stage === 0 ? "FOLDED" : stage === 1 ? "…" : "OPEN"}
        </span>
      </div>
    </div>
  );
}

// ─── Dark-image detection (light backing for black PNGs) ─
const darkCache = {};
function useDarkImgs(urls) {
  const [, bump] = useState(0);
  useEffect(() => {
    let alive = true;
    urls.forEach(u => {
      if (!u || darkCache[u] !== undefined) return;
      darkCache[u] = false;
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = c.height = 16;
          const x = c.getContext("2d");
          x.drawImage(im, 0, 0, 16, 16);
          const d = x.getImageData(0, 0, 16, 16).data;
          let s = 0, n = 0, trans = 0;
          for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] < 128) { trans++; continue; }
            s += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
            n++;
          }
          // backing only for transparent PNGs whose visible pixels are dark
          darkCache[u] = (trans / 256) > 0.25 && n > 0 && (s / n) < 0.45;
        } catch (e) { /* canvas blocked — keep false */ }
        if (alive && darkCache[u]) bump(n => n + 1);
      };
      im.src = u;
    });
    return () => { alive = false; };
  }, [urls.join("|")]);
  return u => !!darkCache[u];
}

// ─── Spread viewer: unfold + photo gallery filmstrip ─────
// mid-grey: enough contrast for black linework without a bright flash
const BND_BACKING = "#6e6a62";
// view: -1 = spread, 0..n = gallery photo. Locked views still open
// inside the unfold — they just get a LOCKED overlay on the image.
// locked_gallery may contain -1 to lock the spread itself.
function SpreadViewer({ b, cwIdx, unfoldMs, view, setView }) {
  const gal = Array.isArray(b.gallery) ? b.gallery : [];
  const lockedIdx = Array.isArray(b.locked_gallery) ? b.locked_gallery : [];
  const isLockedAt = i => lockedIdx.indexOf(i) !== -1;
  const isDark = useDarkImgs([b.spread_url].concat(gal));
  useEffect(() => {
    if (!gal.length) return;
    const onKey = e => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const dir = e.key === "ArrowRight" ? 1 : -1;
      setView(v => Math.max(-1, Math.min(gal.length - 1, v + dir)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gal.length]);
  const pad = n => String(n).padStart(2, "0");
  const rawImg = view < 0 ? b.spread_url : gal[view];
  const img = bndImg(rawImg, "web");
  const curLocked = isLockedAt(view);
  const total = gal.length + 1;          // spread counts as position 01
  const pos = view + 2;                  // gallery index 0 -> position 02
  const [zoom, setZoom] = useState(false);
  useEffect(() => { setZoom(false); }, [b.id, view]);
  return (
    <div className="spread-viewer">
      <div className="spread-wrap">
        <UnfoldSpread
          key={b.id + ":" + view}
          b={b} cwIdx={cwIdx} unfoldMs={unfoldMs}
          imgOverride={img}
          bgColor={isDark(rawImg) ? BND_BACKING : "#000"}
          photoLabel={view < 0 ? "V01 / " + pad(total) + " · spread" : "V" + pad(pos) + " / " + pad(total)}
          onImgClick={curLocked ? null : () => setZoom(true)} />
        {curLocked && (
          <div className="spread-lockover">
            <span className="bnd-locked-stamp">▒ LOCKED</span>
          </div>
        )}
      </div>
      {gal.length > 0 && (
        <div className="gal-strip">
          <button
            className={"gal-thumb gal-thumb-spread" + (view < 0 ? " is-on" : "") + (isLockedAt(-1) ? " is-locked" : "")}
            onClick={() => setView(-1)}>SPREAD</button>
          {gal.map((u, i) => {
            const lk = isLockedAt(i);
            return (
              <button key={u}
                className={"gal-thumb" + (view === i ? " is-on" : "") + (lk ? " is-locked" : "")}
                style={{ backgroundColor: isDark(u) ? BND_BACKING : undefined }}
                onClick={() => setView(i)}
                aria-label={"photo " + (i + 1) + (lk ? " locked" : "")}>
                <img className="gal-thumb-img" src={bndImg(u, "web")} loading="lazy" decoding="async" alt="" />
                {lk && <span className="gal-thumb-lock">▒</span>}
              </button>
            );
          })}
        </div>
      )}
      {zoom && !curLocked && (
        <div className="zoom-overlay" onClick={() => setZoom(false)}>
          <img className="zoom-img" src={bndImg(rawImg, "full")} alt={b.id + " zoom"} />
          <span className="zoom-hint">[ CLICK ] CLOSE</span>
        </div>
      )}
    </div>
  );
}

// ─── Panel FX: film grain + pixel erosion on the top edge ─
function PanelFX() {
  const cells = useMemo(() => {
    const out = [];
    const cols = 120;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < 3; r++) {
        const p = r === 0 ? 0.42 : r === 1 ? 0.16 : 0.05;
        if (Math.random() < p) {
          out.push({ c, r, on: Math.random() < 0.12 });
        }
      }
    }
    return out;
  }, []);
  return (
    <React.Fragment>
      <div className="d-grain"></div>
      <div className="d-erode" aria-hidden="true">
        {cells.map((p, i) => (
          <span key={i} className={"de-px " + (p.on ? "de-on" : "de-off")} style={{
            left: (p.c / 120 * 100) + "%",
            top: (p.r * 5) + "px",
            width: "calc(100% / 120 + 0.5px)",
            height: "5px",
          }}></span>
        ))}
      </div>
    </React.Fragment>
  );
}

// ─── Fireflies: floating pixels over the order button ────
function OrderFireflies({ n = 5 }) {
  const flies = useMemo(() => Array.from({ length: n }, () => ({
    left: 6 + Math.random() * 88,
    delay: -(Math.random() * 6),
    dur: 3.5 + Math.random() * 4,
    size: Math.random() < 0.3 ? 3 : 2,
  })), []);
  return (
    <span className="btn-flies" aria-hidden="true">
      {flies.map((f, i) => (
        <span key={i} className="btn-fly" style={{
          left: f.left + "%",
          width: f.size + "px", height: f.size + "px",
          animationDuration: f.dur + "s",
          animationDelay: f.delay + "s",
        }}></span>
      ))}
    </span>
  );
}

// ─── Order / payment flow ────────────────────────────────
function OrderFlow({ b, cwIdx, size }) {
  const [step, setStep] = useState("idle");   // idle | pay
  const [network, setNetwork] = useState("USDT-TRC20");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [tx, setTx] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const sold = b.status === "SOLD_OUT";

  useEffect(() => { setStep("idle"); setResult(null); }, [b.id]);

  const copyWallet = () => {
    navigator.clipboard && navigator.clipboard.writeText(WALLETS[network]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const submit = async () => {
    if (!contact.trim()) { setResult({ ok: false, msg: "CONTACT REQUIRED" }); return; }
    setResult({ ok: true, msg: "SENDING…" });
    const r = await submitOrder({
      product_id: b.id,
      colorway: b.colorways[cwIdx].id,
      size: size || null,
      contact: contact.trim(),
      address: address.trim(),
      network, tx_hash: tx.trim(),
      status: "PENDING",
    });
    setResult({ ok: r.ok, msg: r.ok ? `ORDER LOGGED // ${r.id} [${r.mode}]` : "ERROR — RETRY" });
  };

  if (sold) return <div className="order-sold">▢ SOLD_OUT — restock TBD</div>;

  return (
    <div className="order-flow">
      {step === "idle" && (
        <button className="btn-order" onClick={() => setStep("pay")}>
          <OrderFireflies />
          ▶ ORDER — {b.price} {b.currency}
        </button>
      )}
      {step === "pay" && (
        <div className="pay-block">
          <div className="pay-row pay-nets">
            {Object.keys(WALLETS).map(n => (
              <button key={n}
                className={"pay-net" + (n === network ? " is-on" : "")}
                onClick={() => setNetwork(n)}>{n}</button>
            ))}
          </div>
          <div className="pay-row pay-wallet">
            <span className="wallet-addr">{WALLETS[network]}</span>
            <button className="btn-copy" onClick={copyWallet}>{copied ? "COPIED ✓" : "COPY"}</button>
          </div>
          <div className="pay-hint">send {b.price} {network === "BTC" ? "USD eq. in BTC" : b.currency} → then log order:</div>
          <input className="pay-input" placeholder="contact (telegram / email) *"
            value={contact} onChange={e => setContact(e.target.value)} />
          <input className="pay-input" placeholder="shipping address"
            value={address} onChange={e => setAddress(e.target.value)} />
          <input className="pay-input" placeholder="tx hash (optional)"
            value={tx} onChange={e => setTx(e.target.value)} />
          <button className="btn-order" onClick={submit}>SUBMIT_ORDER</button>
          {result && <div className={"pay-result " + (result.ok ? "is-ok" : "is-err")}>{result.msg}</div>}
        </div>
      )}
      <div className="ship-note">▸ shipping not included — calculated separately after order</div>
    </div>
  );
}

// ─── Detail overlay ──────────────────────────────────────
function DetailOverlay({ b, cwIdx: initCw, unfoldMs, mono, onClose }) {
  const [cw, setCw] = useState(initCw);
  // sizes: from DB when added (b.sizes), placeholder chips until then
  const sizes = Array.isArray(b.sizes) && b.sizes.length ? b.sizes : ["S", "M", "L"];
  const sizesTbd = !(Array.isArray(b.sizes) && b.sizes.length);
  const [size, setSize] = useState(sizes[Math.min(1, sizes.length - 1)]);
  // viewer state lives here so the product name can follow the variant
  const gal = Array.isArray(b.gallery) ? b.gallery : [];
  const lockedIdx = Array.isArray(b.locked_gallery) ? b.locked_gallery : [];
  const isLockedAt = i => lockedIdx.indexOf(i) !== -1;
  const firstView = !isLockedAt(-1)
    ? -1
    : (gal.map((_, i) => i).find(i => !isLockedAt(i)) !== undefined
        ? gal.map((_, i) => i).find(i => !isLockedAt(i)) : -1);
  const [view, setView] = useState(firstView);
  useEffect(() => { setView(firstView); }, [b.id]);
  // "WIREFRAME 01" -> trailing number follows the viewed position (spread = 01)
  const pos = view < 0 ? 1 : view + 2;
  const dynName = /\d+\s*$/.test(b.name)
    ? b.name.replace(/\d+\s*$/, String(pos).padStart(2, "0"))
    : b.name;
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="detail-overlay" data-screen-label={"Detail " + b.id}>
      <div className="detail-backdrop" onClick={onClose}></div>
      <div className={"detail-panel" + (mono ? " is-mono" : "")}>
        <PanelFX />
        <button className="detail-close" onClick={onClose}>[ ESC ] CLOSE ✕</button>
        <div className="detail-cols">
          <SpreadViewer b={b} cwIdx={cw} unfoldMs={unfoldMs} view={view} setView={setView} />
          <div className="detail-info">
            <div className="di-head">
              <div className="di-code-row">
                <span>{b.id}</span>
                <span className="di-status"><BndStatusDot status={b.status} /> {b.status}</span>
              </div>
              <h2 className="di-name">{dynName}</h2>
            </div>
            <div className="di-price">{b.price} <i>{b.currency}</i></div>
            <div className="di-opt">
              <span className="di-label">SIZE</span>
              <div className="di-chips">
                {sizes.map(s => (
                  <button key={s}
                    className={"di-chip" + (s === size ? " is-on" : "")}
                    onClick={() => setSize(s)}>{s}</button>
                ))}
                {sizesTbd && <span className="di-note">mm — tbd</span>}
              </div>
            </div>
            {b.colorways.length > 1 && (
              <div className="di-opt">
                <span className="di-label">COLOR</span>
                <div className="di-chips">
                  {b.colorways.map((c, i) => (
                    <button key={c.id}
                      className={"di-chip" + (i === cw ? " is-on" : "")}
                      onClick={() => setCw(i)}>
                      <span className="di-sw-chip" style={{ background: c.hex }}></span>
                      {c.id}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <OrderFlow b={b} cwIdx={cw} size={size} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page header ─────────────────────────────────────────
function BndHeader() {
  return (
    <div className="bnd-header" data-screen-label="A Header">
      <div className="bh-title-row">
        <span className="bh-folder-id">DROP_01</span>
        <h1 className="bh-title">BANDANAS</h1>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────
function BndApp() {
  const [t, setTweak] = useTweaks(BND_TWEAK_DEFAULTS);
  const pal = BND_PALETTES[t.palette] || BND_PALETTES.amber;
  const [catalog, setCatalog] = useState({ source: null, items: [] });
  const [open, setOpen] = useState(null);   // {b, cw}

  useEffect(() => {
    loadBandanas().then(setCatalog);
  }, []);

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--accent",     pal.accent);
    r.setProperty("--accent-dim", pal.dim);
    r.setProperty("--glow",       pal.glow);
    r.setProperty("--bg",         pal.bg);
  }, [pal]);

  useEffect(() => {
    const handler = e => {
      document.documentElement.style.setProperty("--mx", e.clientX + "px");
      document.documentElement.style.setProperty("--my", e.clientY + "px");
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className={
      "shell"
      + (t.scanlines ? " has-scanlines" : "")
      + (t.showGrid  ? " has-grid"      : "")
    }>
      <BndTopBar />
      <main className="bnd-page">
        <BndHeader />
        <div className="bnd-grid">
          {catalog.items.map((b, i) => (
            <BootReveal key={b.id} index={i} b={b}>
              <BndCard b={b} onOpen={(bb, cw) => setOpen({ b: bb, cw })} />
            </BootReveal>
          ))}
        </div>
        <footer className="bnd-footer">
          <span>payment: USDT TRC-20 · wallet in detail view</span>
          <a href="MYSTRA Lab.html" className="bnd-back">◀ BACK_TO_LAB</a>
        </footer>
      </main>

      {open && (
        <DetailOverlay b={open.b} cwIdx={open.cw} unfoldMs={t.unfoldMs}
          mono={t.detailMono}
          onClose={() => setOpen(null)} />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection title="palette">
          <TweakSelect
            label="phosphor"
            value={t.palette}
            options={[
              { label: "amber",      value: "amber" },
              { label: "green",      value: "green" },
              { label: "alert/red",  value: "alert" },
              { label: "mono/white", value: "mono"  },
              { label: "dos blue",   value: "dos"   },
            ]}
            onChange={v => setTweak("palette", v)}
          />
        </TweakSection>
        <TweakSection title="unfold">
          <TweakSlider label="speed ms" min={200} max={2000} step={20}
            value={t.unfoldMs} onChange={v => setTweak("unfoldMs", v)} />
          <TweakToggle label="detail b/w" value={t.detailMono} onChange={v => setTweak("detailMono", v)} />
        </TweakSection>
        <TweakSection title="effects">
          <TweakToggle label="bg grid"   value={t.showGrid}  onChange={v => setTweak("showGrid", v)} />
          <TweakToggle label="scanlines" value={t.scanlines} onChange={v => setTweak("scanlines", v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<BndApp />);
