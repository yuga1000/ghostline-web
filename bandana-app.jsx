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
  "palette": "amber",
  "scanlines": true,
  "showGrid": true,
  "unfoldMs": 620
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

// ─── Catalog card ────────────────────────────────────────
function BndCard({ b, onOpen }) {
  const [cw, setCw] = useState(0);
  const img = b.spread_url || bndPlaceholder(b.id);
  const sold = b.status === "SOLD_OUT";
  return (
    <article className={"bnd-card" + (sold ? " is-sold" : "")} data-screen-label={"Card " + b.id}>
      <button className="bnd-preview" onClick={() => onOpen(b, cw)} aria-label={"open " + b.name}>
        <span className="bnd-folded">
          <span className="bnd-img" style={{ backgroundImage: `url("${img}")` }}></span>
          <span className="bnd-tint" style={{ background: b.colorways[cw].hex }}></span>
          <span className="bnd-foldline bnd-fl-v"></span>
          <span className="bnd-foldline bnd-fl-h"></span>
        </span>
        <span className="bnd-open-hint">[ UNFOLD ]</span>
        {sold && <span className="bnd-sold-stamp">SOLD_OUT</span>}
      </button>
      <div className="bnd-meta">
        <div className="bnd-meta-row">
          <span className="bnd-code">{b.id}</span>
          <span className="bnd-status"><BndStatusDot status={b.status} /> {b.status}</span>
        </div>
        <h2 className="bnd-name">{b.name}</h2>
        <div className="bnd-meta-row">
          <span className="bnd-price">{b.price} <i>{b.currency}</i></span>
          <span className="bnd-swatches">
            {b.colorways.map((c, i) => (
              <button key={c.id}
                className={"bnd-swatch" + (i === cw ? " is-on" : "")}
                style={{ background: c.hex }}
                title={c.id}
                onClick={() => setCw(i)}></button>
            ))}
          </span>
        </div>
      </div>
    </article>
  );
}

// ─── Unfold spread (2-stage cloth unfold) ────────────────
function UnfoldSpread({ b, cwIdx, unfoldMs }) {
  const [stage, setStage] = useState(0);
  const img = b.spread_url || bndPlaceholder(b.id);
  const tint = b.colorways[cwIdx].hex;
  useEffect(() => {
    setStage(0);
    const t1 = setTimeout(() => setStage(1), 220);
    const t2 = setTimeout(() => setStage(2), 220 + unfoldMs);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [b.id, cwIdx]);
  const q = (x, y) => ({
    backgroundImage: `url("${img}")`,
    backgroundSize: "200% 200%",
    backgroundPosition: `${x}% ${y}%`,
  });
  const dur = { transitionDuration: unfoldMs + "ms" };
  return (
    <div className="spread-stage">
      <div className="spread" data-stage={stage} style={{ "--tint": tint }}>
        <div className="sq q-tl" style={q(0, 0)}>
          <span className="q-tint"></span>
        </div>
        <div className="flap f-tr" style={dur}>
          <span className="flap-face" style={q(100, 0)}><span className="q-tint"></span></span>
          <span className="flap-back"></span>
        </div>
        <div className="flap f-bottom" style={dur}>
          <span className="flap-face" style={{
            backgroundImage: `url("${img}")`,
            backgroundSize: "100% 200%",
            backgroundPosition: "0 100%",
          }}><span className="q-tint"></span></span>
          <span className="flap-back"></span>
        </div>
      </div>
      <div className="spread-caption">
        <span>{b.id} // full spread · 550×550 mm</span>
        <span className={"spread-state " + (stage === 2 ? "is-open" : "")}>
          {stage === 0 ? "FOLDED" : stage === 1 ? "UNFOLDING…" : "OPEN"}
        </span>
      </div>
    </div>
  );
}

// ─── Order / payment flow ────────────────────────────────
function OrderFlow({ b, cwIdx }) {
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
    </div>
  );
}

// ─── Detail overlay ──────────────────────────────────────
function DetailOverlay({ b, cwIdx: initCw, unfoldMs, onClose }) {
  const [cw, setCw] = useState(initCw);
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="detail-overlay" data-screen-label={"Detail " + b.id}>
      <div className="detail-backdrop" onClick={onClose}></div>
      <div className="detail-panel">
        <button className="detail-close" onClick={onClose}>[ ESC ] CLOSE ✕</button>
        <div className="detail-cols">
          <UnfoldSpread b={b} cwIdx={cw} unfoldMs={unfoldMs} />
          <div className="detail-info">
            <div className="di-code">{b.id}</div>
            <h2 className="di-name">{b.name}</h2>
            <div className="di-row">
              <span className="di-price">{b.price} <i>{b.currency}</i></span>
              <span className="di-status"><BndStatusDot status={b.status} /> {b.status}</span>
            </div>
            <div className="di-row di-stock">
              <StockBar stock={b.stock} total={b.total} />
              <span className="di-stock-n">{b.stock}/{b.total}</span>
            </div>
            <div className="di-cw">
              <span className="di-label">COLORWAY</span>
              <div className="di-swatches">
                {b.colorways.map((c, i) => (
                  <button key={c.id}
                    className={"di-swatch" + (i === cw ? " is-on" : "")}
                    onClick={() => setCw(i)}>
                    <span className="di-sw-chip" style={{ background: c.hex }}></span>
                    {c.id}
                  </button>
                ))}
              </div>
            </div>
            <ul className="di-specs">
              <li><span>SIZE</span><span>550 × 550 mm</span></li>
              <li><span>FABRIC</span><span>TBD — draft</span></li>
              <li><span>RUN</span><span>limited · {b.total} units</span></li>
            </ul>
            <OrderFlow b={b} cwIdx={cw} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page header ─────────────────────────────────────────
function BndHeader({ count, source }) {
  return (
    <div className="bnd-header" data-screen-label="A Header">
      <div className="bh-title-row">
        <span className="bh-folder-id">DROP_01</span>
        <h1 className="bh-title">BANDANAS</h1>
      </div>
      <div className="bh-sub">
        <span>{count} DESIGNS // LIMITED RUN // crypto only</span>
        <span className="bh-db">DB: <b>{source || "…"}</b></span>
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
        <BndHeader count={catalog.items.length} source={catalog.source} />
        <div className="bnd-grid">
          {catalog.items.map(b => (
            <BndCard key={b.id} b={b} onOpen={(bb, cw) => setOpen({ b: bb, cw })} />
          ))}
        </div>
        <footer className="bnd-footer">
          <span>payment: USDT TRC-20 / BTC · wallets in detail view</span>
          <a href="MYSTRA Lab.html" className="bnd-back">◀ BACK_TO_LAB</a>
        </footer>
      </main>

      {open && (
        <DetailOverlay b={open.b} cwIdx={open.cw} unfoldMs={t.unfoldMs}
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
