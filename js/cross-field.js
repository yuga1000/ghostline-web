/* GHOSTLINE — a scattered field of crosses that draw themselves and rub out.
 *
 * Nothing fades. A cross is invisible until its turn, then it gets drawn the
 * way you would draw it by hand: one pixel in the middle, then a cell added to
 * each arm, then another, then another. Then it comes off the same way, tip
 * first. Eight frames out and back, hard cuts, no tweening.
 *
 * Every cell is its own pixel div and every ring has its own keyframes, so the
 * arms switch on in sequence off one shared cycle. steps(1) throughout: a cell
 * is either on at full white or not there at all.
 *
 * Cycles run 14 to 32 seconds per cross with a random phase. The draw occupies
 * 3.6 percent of a cycle, which is roughly 0.8 seconds however long the cycle
 * is, so at any moment three or four crosses are part-drawn somewhere and the
 * field twinkles instead of blinking once and waiting.
 *
 * No timers. It is CSS from the moment it is built, and prefers-reduced-motion
 * leaves a still field.
 */
(function () {
  const RINGS = 3; // cells per arm
  let styled = false;

  function injectStyle() {
    if (styled) return;
    styled = true;

    // one keyframe set per ring: the further out, the later it arrives and the
    // sooner it leaves, which is what makes the cross grow and shrink
    const steps = [
      [96.00, 99.60],
      [96.45, 99.15],
      [96.90, 98.70],
      [97.35, 98.25]
    ];
    const frames = steps
      .map(([on, off], i) =>
        `@keyframes crossRing${i} {` +
        `0%, ${(on - 0.01).toFixed(2)}% { opacity: 0; }` +
        `${on}% { opacity: 1; }` +
        `${off}%, 100% { opacity: 0; }` +
        `}`
      )
      .join("\n      ");

    const style = document.createElement("style");
    style.textContent = `
      .cross-field { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
      .cross-field span { position: absolute; display: block; }
      .cross-field i {
        position: absolute;
        display: block;
        background: #fff;
        opacity: 0;
        animation-iteration-count: infinite;
        animation-timing-function: steps(1);
      }
      ${steps.map((_, i) => `.cross-field i.r${i} { animation-name: crossRing${i}; }`).join("\n      ")}
      ${frames}
      @media (prefers-reduced-motion: reduce) {
        .cross-field i { animation: none; }
        .cross-field i.r0, .cross-field i.r1 { opacity: .5; }
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
    const config = Object.assign({ count: 90, minPeriod: 14, maxPeriod: 32 }, options);

    host.classList.add("cross-field");

    let html = "";
    for (let n = 0; n < config.count; n++) {
      const px = Math.random() < 0.25 ? 3 : 2;       // pixel size
      const arms = Math.random() < 0.55 ? 2 : RINGS; // most stay small, a few reach full span
      const period = (config.minPeriod + Math.random() * (config.maxPeriod - config.minPeriod)).toFixed(2);
      const phase = (Math.random() * period).toFixed(2);
      const timing = `animation-duration:${period}s;animation-delay:-${phase}s`;

      let cells = `<i class="r0" style="left:0;top:0;width:${px}px;height:${px}px;${timing}"></i>`;
      for (let k = 1; k <= arms; k++) {
        for (const d of [[k, 0], [-k, 0], [0, k], [0, -k]]) {
          cells +=
            `<i class="r${k}" style="left:${d[0] * px}px;top:${d[1] * px}px;` +
            `width:${px}px;height:${px}px;${timing}"></i>`;
        }
      }

      html +=
        `<span style="left:${(Math.random() * 100).toFixed(2)}%;` +
        `top:${(clustered() * 100).toFixed(2)}%">${cells}</span>`;
    }
    host.innerHTML = html;
  };
})();
