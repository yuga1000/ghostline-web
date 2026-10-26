const works = [
  { id: "49", file: "49_05", description: "A red-faced crowned figure surrounded by colored lights and mechanical forms." },
  { id: "50", file: "50_05", description: "A pale mechanical figure in red, green and gold ceremonial clothing." },
  { id: "51", file: "51_05", description: "A dark crowned figure inside a red ring, green ornament and floating computer windows." },
  { id: "52", file: "52_05", description: "A seated mechanical figure with a red halo and red robes in a dark chamber." }
];
const windows = document.getElementById("windows");
for (let index = 0; index < works.length; index += 4) {
  const group = document.createElement("div");
  group.className = "constellation";
  group.innerHTML = works.slice(index, index + 4).map(work => `
    <figure class="window" data-name="WINDOW ${work.id}">
      <button class="window-view" type="button" aria-label="Open Window ${work.id}" aria-describedby="description${work.id}">
        <video class="window-player" src="assets/temple/${work.file}.mp4" poster="assets/temple/${work.file}.png" width="896" height="1344" muted loop playsinline preload="none" aria-hidden="true"></video>
        <span class="view-hint">[ ENTER ${work.id} ]</span>
      </button>
      <figcaption class="sr-only" id="description${work.id}">${work.description}</figcaption>
    </figure>
  `).join("");
  windows.appendChild(group);
}

const players = Array.from(document.querySelectorAll(".window-player"));
const visiblePlayers = new Set();
const motionToggle = document.getElementById("motionToggle");
const viewer = document.getElementById("viewer");
const viewerPlayer = document.getElementById("viewerPlayer");
const viewerPause = document.getElementById("viewerPause");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let paused = reducedMotion.matches;

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

document.querySelectorAll(".window-view").forEach(button => {
  button.addEventListener("click", () => {
    const card = button.closest(".window");
    const player = card.querySelector("video");
    document.getElementById("viewerTitle").textContent = card.dataset.name;
    viewerPlayer.poster = player.poster;
    viewerPlayer.src = player.getAttribute("src");
    const work = works.find(work => card.dataset.name === `WINDOW ${work.id}`);
    ["gif", "mp4"].forEach(format => {
      const target = document.getElementById(format === "gif" ? "viewerGif" : "viewerMp4");
      target.href = `assets/temple/${work.file}.${format}`;
      target.download = `ghostline-window-${work.id}.${format}`;
    });
    viewer.showModal();
    updatePlayback();
    if (!paused) viewerPlayer.play().catch(() => {});
  });
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
