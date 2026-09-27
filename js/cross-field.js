/* GHOSTLINE — a scattered field of crosses that blink rarely.
 *
 * Not a row and not a strobe. The field is always faintly there, the way a
 * sky is, and now and then one cross flares for a third of a second.
 *
 * What makes it read as calm is the rate of flares, not their length. Short
 * flashes on short cycles still sparkle: sixty crosses on a fifteen second
 * cycle fire four times a second no matter how brief each one is. So the
 * cycles are long, thirty to seventy seconds, which puts the whole field at
 * about one flare per second with every cross on its own phase.
 *
 * Brightness is two knobs, `rest` and `flare`, passed through as CSS variables
 * so a page can dim or lift its own field without touching this file.
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
        opacity: var(--cross-rest, .24);
        transform: translate(-50%, -50%);
        animation-name: crossTwinkle;
        animation-iteration-count: infinite;
        animation-timing-function: steps(1);
      }
      /* one flare per cycle, everything else is the resting field */
      @keyframes crossTwinkle {
        0%, 98.2%   { opacity: var(--cross-rest, .24); }
        98.6%       { opacity: var(--cross-flare, 1); }
        99.2%, 100% { opacity: var(--cross-rest, .24); }
      }
      @media (prefers-reduced-motion: reduce) {
        .cross-field b { animation: none; opacity: var(--cross-rest, .24); }
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
    const config = Object.assign(
      { count: 46, minPeriod: 30, maxPeriod: 70, rest: 0.24, flare: 1 },
      options
    );

    host.classList.add("cross-field");
    host.style.setProperty("--cross-rest", config.rest);
    host.style.setProperty("--cross-flare", config.flare);

    let html = "";
    for (let i = 0; i < config.count; i++) {
      const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      const size = (8 + Math.random() * 6).toFixed(1);
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
