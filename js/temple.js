const players = Array.from(document.querySelectorAll(".window-player"));
const visiblePlayers = new Set();
const motionToggle = document.getElementById("motionToggle");
const viewer = document.getElementById("viewer");
const viewerPlayer = document.getElementById("viewerPlayer");
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
    ["gif", "mp4"].forEach(format => {
      const source = card.querySelector(`a[download$=".${format}"]`);
      const target = document.getElementById(format === "gif" ? "viewerGif" : "viewerMp4");
      target.href = source.href;
      target.download = source.download;
    });
    viewer.showModal();
    updatePlayback();
    if (!paused) viewerPlayer.play().catch(() => {});
  });
});
viewer.addEventListener("click", event => {
  if (event.target === viewer) viewer.close();
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
    return `<a href="${url}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}><span>${channel.name}</span><span>${channel.go}</span></a>`;
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
