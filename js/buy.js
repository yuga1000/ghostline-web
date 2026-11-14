/* GHOSTLINE - the one BUY window, shared by the paintings page and the front page.
 *
 * Paintings and custom panels are not paid through the site: shipping has to be
 * worked out first. So the window says what happens in three steps and opens a
 * message to Yuga with the work already named. Email and Instagram come from
 * js/support-links.js, which has to load before this file.
 *
 *   GHOSTLINE_BUY.open({ kind: "painting", title, size, price, image })
 *   GHOSTLINE_BUY.open({ kind: "custom" })
 */
(function () {
  const config = window.GHOSTLINE_SUPPORT || {};
  const EMAIL = config.email || "ghostlinesystem@gmail.com";
  const INSTAGRAM = config.instagram || "";

  const named = item => `"${item.title}"${item.size ? ` (${item.size})` : ""}`;

  const KINDS = {
    painting: {
      bar: "[ BUY_PAINTING ]",
      steps: [
        "Message me. The painting is already named in the message.",
        "I reply with payment details and the shipping cost to you.",
        "You pay, I pack it and ship it."
      ],
      subject: item => `Buying: ${item.title}`,
      body: item => `Hi Yuga,\n\nI'd like to buy ${named(item)} from ghostline.live.\n\nShip to (country, city):\n`,
      dm: item => `Hi Yuga, I'd like to buy ${named(item)} from ghostline.live`
    },
    custom: {
      bar: "[ ORDER_CUSTOM ]",
      title: "CUSTOM LED PAINTING",
      note: "An LED panel in a frame, playing pixel animation. The size, the frame and the animation are made for you.",
      priceText: "FROM USD 1199",
      steps: [
        "Tell me the size, the frame and the animation you want.",
        "I reply with the price, the timing and the shipping cost.",
        "I build it and ship it."
      ],
      more: { href: "panels.html", label: "SEE FINISHED PANELS" },
      subject: () => "Custom LED painting",
      body: () => "Hi Yuga,\n\nI'd like to order a custom LED painting from ghostline.live.\n\nSize:\nFrame:\nAnimation (yours or mine):\nShip to (country, city):\n",
      dm: () => "Hi Yuga, I'd like to order a custom LED painting from ghostline.live"
    }
  };

  const css = `
    .gl-buy { position: fixed; inset: 0; z-index: 10050; display: none; align-items: center; justify-content: center; padding: 12px; }
    .gl-buy.is-open { display: flex; }
    .gl-buy, .gl-buy * { box-sizing: border-box; text-shadow: none; }
    .gl-buy-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.88); }
    .gl-buy-window { position: relative; width: min(440px, 100%); max-height: calc(100vh - 24px); overflow: auto; border: 2px solid #5555ff; background: #0000aa; color: #aaaaaa; box-shadow: 8px 8px 0 #000; font: 13px/1.5 'Share Tech Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace; letter-spacing: .04em; text-align: left; }
    .gl-buy-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 7px 10px; background: #00aaaa; color: #000; letter-spacing: .12em; }
    .gl-buy-x { padding: 3px 8px; border: 0; background: #000; color: #aaaaaa; font: inherit; cursor: pointer; }
    .gl-buy-x:hover { background: #aaaaaa; color: #000; }
    .gl-buy-body { padding: 16px; }
    .gl-buy-item { display: flex; gap: 14px; align-items: flex-start; }
    .gl-buy-thumb { flex: none; width: 92px; height: 92px; object-fit: cover; border: 1px solid #5555ff; background: #000; }
    .gl-buy-thumb[hidden] { display: none; }
    .gl-buy-title { margin: 0; color: #ffffff; font: inherit; font-size: 17px; line-height: 1.25; letter-spacing: .12em; text-transform: uppercase; overflow-wrap: anywhere; }
    .gl-buy-meta { margin-top: 4px; color: #55ffff; letter-spacing: .1em; }
    .gl-buy-note { margin: 6px 0 0; color: #aaaaaa; }
    .gl-buy-price { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 14px; padding: 8px 10px; background: #00aaaa; color: #000; letter-spacing: .1em; }
    .gl-buy-price strong { font-size: 18px; letter-spacing: .08em; }
    .gl-buy-label { margin: 16px 0 6px; color: #5555ff; font-size: 11px; letter-spacing: .16em; }
    .gl-buy-steps { margin: 0; padding: 0; list-style: none; counter-reset: step; }
    .gl-buy-steps li { position: relative; padding: 3px 0 3px 30px; counter-increment: step; }
    .gl-buy-steps li::before { content: counter(step); position: absolute; left: 0; top: 3px; width: 20px; text-align: center; background: #000; color: #55ffff; }
    .gl-buy-actions { display: grid; gap: 10px; margin-top: 18px; }
    .gl-buy-btn { display: block; padding: 12px 10px; border: 0; background: #aaaaaa; color: #000; font: inherit; font-weight: 700; letter-spacing: .12em; text-align: center; text-decoration: none; cursor: pointer; box-shadow: 3px 3px 0 #000; }
    .gl-buy-btn:hover { background: #55ffff; color: #000; }
    .gl-buy-btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #000; }
    .gl-buy-btn.is-main { background: #ffffff; }
    .gl-buy-btn:focus-visible, .gl-buy-x:focus-visible, .gl-buy-copy:focus-visible { outline: 2px solid #ffff55; outline-offset: 2px; }
    .gl-buy-btn.is-main:hover { background: #55ffff; }
    .gl-buy-mail { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; padding: 7px 9px; border: 1px solid #5555ff; color: #ffffff; overflow-wrap: anywhere; }
    .gl-buy-copy { flex: none; padding: 3px 8px; border: 0; background: #000; color: #aaaaaa; font: inherit; cursor: pointer; }
    .gl-buy-copy:hover { background: #aaaaaa; color: #000; }
    .gl-buy-said { min-height: 1.5em; margin: 8px 0 0; color: #55ffff; }
    .gl-buy-more { display: inline-block; margin-top: 4px; color: #55ffff; letter-spacing: .1em; text-decoration: none; border-bottom: 1px solid #5555ff; }
    .gl-buy-more:hover { background: #55ffff; color: #000; }
    .gl-buy-more[hidden] { display: none; }
    @media (max-width: 420px) {
      .gl-buy-body { padding: 12px; }
      .gl-buy-thumb { width: 72px; height: 72px; }
      .gl-buy-title { font-size: 15px; }
    }
  `;

  let root, opener;
  const $ = sel => root.querySelector(sel);

  function build() {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    root = document.createElement("div");
    root.className = "gl-buy";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "glBuyTitle");
    root.innerHTML = `
      <div class="gl-buy-backdrop" data-buy-close></div>
      <div class="gl-buy-window">
        <div class="gl-buy-bar"><span class="gl-buy-bar-name"></span><button class="gl-buy-x" type="button" data-buy-close aria-label="Close">[ X ]</button></div>
        <div class="gl-buy-body">
          <div class="gl-buy-item">
            <img class="gl-buy-thumb" alt="" hidden>
            <div>
              <h2 class="gl-buy-title" id="glBuyTitle"></h2>
              <div class="gl-buy-meta"></div>
              <p class="gl-buy-note"></p>
            </div>
          </div>
          <div class="gl-buy-price"><span>PRICE</span><strong></strong></div>
          <div class="gl-buy-label">HOW IT WORKS</div>
          <ol class="gl-buy-steps"></ol>
          <div class="gl-buy-actions">
            ${INSTAGRAM ? `<a class="gl-buy-btn is-main" data-buy-dm href="${INSTAGRAM}" target="_blank" rel="noopener noreferrer">[ MESSAGE ON INSTAGRAM ]</a>` : ""}
            <a class="gl-buy-btn${INSTAGRAM ? "" : " is-main"}" data-buy-mail href="mailto:${EMAIL}">[ SEND AN EMAIL ]</a>
          </div>
          <div class="gl-buy-mail"><span>${EMAIL}</span><button class="gl-buy-copy" type="button" data-buy-copy>[ COPY ]</button></div>
          <p class="gl-buy-said" aria-live="polite"></p>
          <a class="gl-buy-more" hidden></a>
        </div>
      </div>`;
    document.body.appendChild(root);

    root.querySelectorAll("[data-buy-close]").forEach(el => el.addEventListener("click", close));
    $("[data-buy-copy]").addEventListener("click", () => copy(EMAIL, "Email copied."));
    const dm = $("[data-buy-dm]");
    // Instagram can't take a ready message through a link, so it goes on the
    // clipboard and the buyer pastes it into the chat
    if (dm) dm.addEventListener("click", () => copy(dm.dataset.message, "Message copied. Paste it in the chat."));
    document.addEventListener("keydown", event => { if (event.key === "Escape" && root.classList.contains("is-open")) close(); });
  }

  async function copy(text, said) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const field = document.createElement("textarea");
      field.value = text;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    $(".gl-buy-said").textContent = said;
  }

  function open(item) {
    if (!root) build();
    const kind = KINDS[item.kind] || KINDS.painting;
    item = Object.assign({}, item, { title: item.title || kind.title });
    opener = document.activeElement;

    $(".gl-buy-bar-name").textContent = kind.bar;
    $(".gl-buy-title").textContent = item.title;
    $(".gl-buy-meta").textContent = item.size || "";
    $(".gl-buy-note").textContent = kind.note || "";
    $(".gl-buy-price strong").textContent = item.priceText || kind.priceText || (item.price ? `USD ${item.price}` : "ON REQUEST");

    const thumb = $(".gl-buy-thumb");
    thumb.hidden = !item.image;
    if (item.image) thumb.src = item.image;

    $(".gl-buy-steps").innerHTML = "";
    kind.steps.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step;
      $(".gl-buy-steps").appendChild(li);
    });

    $("[data-buy-mail]").href = `mailto:${EMAIL}?subject=${encodeURIComponent(kind.subject(item))}&body=${encodeURIComponent(kind.body(item))}`;
    const dm = $("[data-buy-dm]");
    if (dm) dm.dataset.message = kind.dm(item);

    const more = $(".gl-buy-more");
    more.hidden = !kind.more;
    if (kind.more) {
      more.href = kind.more.href;
      more.textContent = `${kind.more.label} ▸`;
    }

    $(".gl-buy-said").textContent = "";
    root.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
    $(".gl-buy-btn").focus();
  }

  function close() {
    if (!root) return;
    root.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    if (opener && opener.focus) opener.focus();
  }

  window.GHOSTLINE_BUY = { open, close };
})();
