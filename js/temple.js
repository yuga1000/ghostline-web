const works = [
  { id: "49", file: "49_05", gif: true, description: "A red-faced crowned figure surrounded by colored lights and mechanical forms." },
  { id: "50", file: "50_05", gif: true, description: "A pale mechanical figure in red, green and gold ceremonial clothing." },
  { id: "51", file: "51_05", gif: true, description: "A dark crowned figure inside a red ring, green ornament and floating computer windows." },
  { id: "52", file: "52_05", gif: true, description: "A seated mechanical figure with a red halo and red robes in a dark chamber." },
  { id: "53", file: "53", width: 720, height: 1068, download: "53-original", description: "A crowned face drawn in magenta pixels against black." },
  { id: "54", file: "54", width: 720, height: 720, download: "54-original", description: "A blue many-armed figure with a green flower." },
  { id: "55", file: "55", width: 720, height: 1068, download: "55-original", description: "A green tower with blue water flowing from its doorway." },
  { id: "56", file: "56", width: 720, height: 720, download: "56-original", description: "A red seated figure inside a pixel game editor." },
  { id: "57", file: "57", width: 1068, height: 1068, download: "57-original", description: "A green shrine beneath a terminal window." },
  { id: "58", file: "58", width: 720, height: 1068, download: "58-original", description: "A red many-armed figure below computer diagnostics." },
  { id: "59", file: "59", width: 720, height: 720, download: "59-original", description: "A red face surrounded by repeating Paint windows." },
  { id: "60", file: "60", width: 1068, height: 1068, download: "60-original", description: "A red crowned figure with a geometric diagram and stacked icons." },
  { id: "61", file: "61", width: 720, height: 1068, download: "61-original", description: "A green cross with a Paint toolbar and old computer dialogs." }
];
const windows = document.getElementById("windows");
windows.innerHTML = works.map(work => `
    <figure class="window" data-name="WINDOW ${work.id}" style="--work-aspect: ${work.width || 896} / ${work.height || 1344}">
      <button class="window-view" type="button" aria-label="Open Window ${work.id}" aria-describedby="description${work.id}">
        <video class="window-player" src="assets/temple/${work.file}.mp4" poster="assets/temple/${work.file}.png" width="${work.width || 896}" height="${work.height || 1344}" muted loop playsinline preload="none" aria-hidden="true"></video>
        <span class="view-hint">[ ENTER ${work.id} ]</span>
      </button>
      <figcaption class="sr-only" id="description${work.id}">${work.description}</figcaption>
    </figure>
`).join("");

const figures = Array.from(windows.children);
let layoutWidth = 0;

function layoutWorks() {
  const width = windows.clientWidth;
  if (!width || width === layoutWidth) return;
  layoutWidth = width;
  const compact = window.matchMedia("(max-width: 800px)").matches;
  const columns = compact ? 2 : 4;
  const sizes = [1, .96, 1.04, .98, 1.02, .94, 1];
  const shifts = [0, .012, -.01, .006, -.008];
  const levels = (compact ? [.04, 0] : [.08, 0, .14, .04]).map(level => level * width);
  let bottom = 0;

  figures.forEach((figure, index) => {
    const lane = index < columns ? index : levels.indexOf(Math.min(...levels));
    const work = works[index];
    const size = Math.round(width * (compact ? .6 : .34) * sizes[index % sizes.length]);
    const height = size * (work.height || 1344) / (work.width || 896);
    const left = Math.round(Math.max(0, Math.min(width - size, width * (lane * (compact ? .4 : .22) + shifts[index % shifts.length]))));
    const top = Math.round(levels[lane]);
    figure.style.width = `${size}px`;
    figure.style.left = `${left}px`;
    figure.style.top = `${top}px`;
    levels[lane] = top + height * (.56 + index % 3 * .025);
    bottom = Math.max(bottom, top + height);
  });
  windows.style.height = `${Math.ceil(bottom)}px`;
}
new ResizeObserver(layoutWorks).observe(windows);
layoutWorks();

const players = Array.from(document.querySelectorAll(".window-player"));
const visiblePlayers = new Set();
const motionToggle = document.getElementById("motionToggle");
const viewer = document.getElementById("viewer");
const viewerPlayer = document.getElementById("viewerPlayer");
const viewerPause = document.getElementById("viewerPause");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let paused = reducedMotion.matches;
let currentIndex = 0;

function updatePlayback() {
  players.forEach(player => {
    if (!paused && !document.hidden && !viewer.open && visiblePlayers.has(player)) {
      player.play().catch(() => {});
    } else {
      player.pause();
    }
  });
  motionToggle.textContent = paused ? "[ PLAY ALL ]" : "[ PAUSE ALL ]";
  motionToggle.setAttribute("aria-pressed", String(paused));
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) visiblePlayers.add(entry.target);
    else visiblePlayers.delete(entry.target);
  });
  updatePlayback();
});
players.forEach(player => observer.observe(player));
motionToggle.addEventListener("click", () => {
  paused = !paused;
  updatePlayback();
});
reducedMotion.addEventListener("change", event => {
  paused = event.matches;
  if (paused) viewerPlayer.pause();
  updatePlayback();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) viewerPlayer.pause();
  updatePlayback();
});

function showWork(index, shouldPlay) {
  currentIndex = (index + works.length) % works.length;
  const work = works[currentIndex];
  const player = players[currentIndex];
  document.getElementById("viewerTitle").textContent = `WINDOW ${work.id}`;
  document.getElementById("viewerPosition").textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(works.length).padStart(2, "0")}`;
  viewerPlayer.poster = player.poster;
  viewerPlayer.src = player.getAttribute("src");
  viewer.style.setProperty("--viewer-aspect", (work.width || 896) / (work.height || 1344));
  viewerPlayer.width = work.width || 896;
  viewerPlayer.height = work.height || 1344;
  ["gif", "mp4"].forEach(format => {
    const target = document.getElementById(format === "gif" ? "viewerGif" : "viewerMp4");
    target.hidden = format === "gif" && !work.gif;
    if (target.hidden) {
      target.removeAttribute("href");
      target.removeAttribute("download");
      return;
    }
    target.href = `assets/temple/${format === "mp4" ? work.download || work.file : work.file}.${format}`;
    target.download = `ghostline-window-${work.id}.${format}`;
  });
  if (shouldPlay && !document.hidden) viewerPlayer.play().catch(() => {});
}

function stepWork(step) {
  showWork(currentIndex + step, !viewerPlayer.paused);
}

document.querySelectorAll(".window-view").forEach((button, index) => {
  button.addEventListener("click", () => {
    viewer.showModal();
    showWork(index, !paused);
    updatePlayback();
  });
});
document.getElementById("viewerPrev").addEventListener("click", () => stepWork(-1));
document.getElementById("viewerNext").addEventListener("click", () => stepWork(1));
viewer.addEventListener("keydown", event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  stepWork(event.key === "ArrowLeft" ? -1 : 1);
});
viewerPause.addEventListener("click", () => {
  if (viewerPlayer.paused) viewerPlayer.play().catch(() => {});
  else viewerPlayer.pause();
});
["play", "pause", "emptied"].forEach(event => viewerPlayer.addEventListener(event, () => {
  viewerPause.textContent = viewerPlayer.paused ? "Play" : "Pause";
  viewerPause.setAttribute("aria-label", viewerPlayer.paused ? "Play animation" : "Pause animation");
}));
viewer.addEventListener("click", event => {
  const bounds = viewer.getBoundingClientRect();
  if (event.target === viewer && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) viewer.close();
});
viewer.addEventListener("close", () => {
  viewerPlayer.pause();
  viewerPlayer.removeAttribute("src");
  viewerPlayer.load();
  updatePlayback();
});

const config = window.GHOSTLINE_SUPPORT || {};
const channels = (config.channels || []).filter(channel => channel.url);
if (channels.length) {
  document.getElementById("supportLinks").innerHTML = channels.map(channel => {
    const url = channel.url === "support.html#wallet" ? "#wallet" : channel.url;
    const external = /^https?:/.test(url);
    return `<a href="${url}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}><span>${channel.name}</span><span class="channel-type">${channel.type}</span><span class="channel-open">[ OPEN ]</span></a>`;
  }).join("");
}
if (config.wallet) {
  document.getElementById("wallet").hidden = false;
  document.getElementById("walletLabel").textContent = `${config.wallet.asset} / ${config.wallet.network}`;
  document.getElementById("walletAddress").textContent = config.wallet.address;
  document.getElementById("walletQr").src = config.wallet.qr;
  document.getElementById("copyWallet").addEventListener("click", async () => {
    const status = document.getElementById("copyStatus");
    try {
      await navigator.clipboard.writeText(config.wallet.address);
      status.textContent = "Address copied.";
    } catch (error) {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById("walletAddress"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "Copy the selected address.";
    }
  });
}
updatePlayback();
