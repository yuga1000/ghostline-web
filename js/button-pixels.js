/* GHOSTLINE - pixels that live around the front-page buttons.
 *
 * Mark a button with data-pixels="wander" or data-pixels="run". Two characters,
 * drawn the way hand-made arcade sprites are: whole 3px cells, a fixed CGA
 * palette, a stepped clock, nothing tweened.
 *
 *   wander (PAINTINGS) - yellow motes drifting around the button a cell at a
 *   time. Lazy: they stop, change their minds, go dark through brown and come
 *   back, and now and then flare into a little cross.
 *
 *   run (PANELS) - cyan snakes running laps on a track around the button,
 *   corner to corner, with a tail that steps down the palette like an LED
 *   chase. Mechanical and steady. Hover and they run twice as fast.
 *
 * One fixed canvas over the page, pointer-events off. Nothing runs while the
 * tab is hidden, and prefers-reduced-motion leaves the buttons plain.
 */
(function () {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const CELL = 3;          // css px per pixel
  const TICK = 40;         // ms, the runners' clock
  const WANDER_EVERY = 3;  // wanderers move on every third tick
  const RING = 5;          // how far out the wanderers may drift, in cells
  const TRACK = 3;         // runners' track, cells outside the button edge
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  const YELLOW = "#ffff55", BROWN = "#aa5500";
  const SNAKE = ["#ffffff", "#55ffff", "#55ffff", "#00aaaa", "#00aaaa", "#005555"];

  const rnd = n => Math.floor(Math.random() * n);

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:40;image-rendering:pixelated";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  resize();
  addEventListener("resize", resize);

  // ---- wanderers -------------------------------------------------------

  // keep off the button and its border, stay inside the ring around it
  const free = (x, y, g) =>
    !(x >= -1 && x <= g.w && y >= -1 && y <= g.h) &&
    x >= -RING && x < g.w + RING && y >= -RING && y < g.h + RING;

  function place(m, g) {
    do {
      m.x = rnd(g.w + RING * 2) - RING;
      m.y = rnd(g.h + RING * 2) - RING;
    } while (!free(m.x, m.y, g));
  }

  function stepMote(m, g) {
    if (m.queue.length) { m.show = m.queue.shift(); return; }
    m.show = "on";
    const roll = Math.random();
    if (roll < 0.012) { m.queue = ["dim", ...Array(4 + rnd(8)).fill("off"), "dim"]; return; }
    if (roll < 0.020) { m.queue = ["f1", "f2", "f2", "f1"]; return; }
    if (roll < 0.250) return; // loiter
    if (Math.random() < 0.3) m.dir = rnd(4);
    const nx = m.x + DIRS[m.dir][0], ny = m.y + DIRS[m.dir][1];
    if (free(nx, ny, g)) { m.x = nx; m.y = ny; } else m.dir = rnd(4);
  }

  function drawMote(m, cell) {
    if (m.show === "off") return;
    if (m.show === "dim") return cell(m.x, m.y, BROWN);
    cell(m.x, m.y, YELLOW);
    if (m.show === "f1" || m.show === "f2") {
      DIRS.forEach(([dx, dy]) => {
        cell(m.x + dx, m.y + dy, m.show === "f2" ? YELLOW : BROWN);
        if (m.show === "f2") cell(m.x + dx * 2, m.y + dy * 2, BROWN);
      });
    }
  }

  // ---- runners ---------------------------------------------------------

  // the cells of a rectangle TRACK cells outside the button, clockwise
  function track(g) {
    const a = -TRACK, r = g.w + TRACK - 1, b = g.h + TRACK - 1, cells = [];
    for (let x = a; x <= r; x++) cells.push([x, a]);
    for (let y = a + 1; y <= b; y++) cells.push([r, y]);
    for (let x = r - 1; x >= a; x--) cells.push([x, b]);
    for (let y = b - 1; y > a; y--) cells.push([a, y]);
    return cells;
  }

  // ---- the loop --------------------------------------------------------

  const actors = [...document.querySelectorAll("[data-pixels]")].map(el => ({
    el,
    kind: el.dataset.pixels,
    motes: Array.from({ length: 7 }, () => ({ x: 0, y: 0, dir: rnd(4), show: "on", queue: [] })),
    heads: [0, 0.5],   // two snakes, half a lap apart
    key: ""
  }));
  if (!actors.length) return;

  let tick = 0, timer = null;

  function frame() {
    tick++;
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    actors.forEach(actor => {
      const rect = actor.el.getBoundingClientRect();
      if (!rect.width || rect.bottom < -40 || rect.top > innerHeight + 40) return;
      const g = { w: Math.ceil(rect.width / CELL), h: Math.ceil(rect.height / CELL) };
      const ox = Math.round(rect.left), oy = Math.round(rect.top);
      const cell = (x, y, color) => { ctx.fillStyle = color; ctx.fillRect(ox + x * CELL, oy + y * CELL, CELL, CELL); };

      // the button changed size (fonts, resize): start the actors over
      const key = g.w + "x" + g.h;
      if (key !== actor.key) {
        actor.key = key;
        actor.path = track(g);
        actor.motes.forEach(m => place(m, g));
        actor.heads = actor.heads.map(h => (h < 1 ? Math.floor(h * actor.path.length) : h % actor.path.length));
      }

      if (actor.kind === "wander") {
        actor.motes.forEach(m => {
          if (tick % WANDER_EVERY === 0) stepMote(m, g);
          drawMote(m, cell);
        });
      } else {
        const path = actor.path, speed = actor.el.matches(":hover") ? 2 : 1;
        actor.heads = actor.heads.map(h => (h + speed) % path.length);
        actor.heads.forEach(h => {
          for (let i = SNAKE.length - 1; i >= 0; i--) {
            const [x, y] = path[(h - i + path.length) % path.length];
            cell(x, y, SNAKE[i]);
          }
        });
      }
    });
  }

  function start() { if (!timer) timer = setInterval(frame, TICK); }
  function stop() { clearInterval(timer); timer = null; }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  if (!document.hidden) start();
})();
