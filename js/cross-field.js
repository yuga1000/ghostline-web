/* GHOSTLINE — a scattered field of crosses that blink rarely.
 *
 * Not a row and not a strobe. Each cross sits at a random point inside its
 * container, stays dark most of the time, and blinks twice in a long cycle of
 * its own. With every cross on a different period and phase they never fall
 * into step, so what you see is the odd one lighting up, the way a star does.
 *
 * Injects its own stylesheet once. No timers: it is CSS from the moment it is
 * built, and prefers-reduced-motion switches it to a still field.
 */
(function () {
  const GLYPHS = ["+", "+", "+", "+", "×", "✦"];
  let styled = false;

  function injectStyle() {
    if (styled) return;
    styled = true;
    const style = document.createElement("style");
    style.textContent = `
      .cross-field { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
      .cross-field b {
        position: absolute;
        font-weight: 400;
        font-style: normal;
        line-height: 1;
        color: #fff;
        opacity: 0;
        transform: translate(-50%, -50%);
        animation-name: crossTwinkle;
        animation-iteration-count: infinite;
        animation-timing-function: steps(1);
      }
      /* dark for most of the cycle, then two short beats */
      @keyframes crossTwinkle {
        0%, 91%   { opacity: 0; }
        92%       { opacity: .85; }
        93.5%     { opacity: .12; }
        95%       { opacity: .55; }
        96.5%,100%{ opacity: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .cross-field b { animation: none; opacity: .14; }
      }
    `;
    document.head.appendChild(style);
  }

  // average of two uniforms: clusters toward the middle of the band, so the
  // field reads like the Milky Way rather than graph paper
  const clustered = () => (Math.random() + Math.random()) / 2;

  window.renderCrossField = function (host, options) {
    if (!host) return;
    injectStyle();
    const config = Object.assign({ count: 46, minPeriod: 7, maxPeriod: 17 }, options);

    host.classList.add("cross-field");
    let html = "";
    for (let i = 0; i < config.count; i++) {
      const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      const size = (7 + Math.random() * 6).toFixed(1);
      const period = (config.minPeriod + Math.random() * (config.maxPeriod - config.minPeriod)).toFixed(2);
      html +=
        `<b style="left:${(Math.random() * 100).toFixed(2)}%;` +
        `top:${(clustered() * 100).toFixed(2)}%;` +
        `font-size:${size}px;` +
        `animation-duration:${period}s;` +
        `animation-delay:-${(Math.random() * period).toFixed(2)}s">${glyph}</b>`;
    }
    host.innerHTML = html;
  };
})();
