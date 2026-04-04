/**
 * GHOSTLINE Sun Timelapse
 * Loads ~200 frames from NASA SDO (AIA 304), plays as smooth animation.
 *
 * Logic:
 * 1. Show latest static image immediately (instant)
 * 2. Background: build list of last ~200 frames (last ~33h)
 * 3. Preload frames into Image objects
 * 4. When enough loaded (>30) — start timelapse animation
 * 5. Every 10min check for new frame, add to end, drop oldest (sliding window)
 * 6. Total weight stays ≤ MAX_FRAMES × ~60KB = ~12MB
 *
 * Uses 512px AIA 304 (red/orange — chromosphere, prominences)
 */

(function(){
  'use strict';

  // === CONFIG ===
  const CHANNEL = '0304';
  const SIZE = 512;
  const MAX_FRAMES = 200;           // sliding window cap
  const MIN_FRAMES_TO_PLAY = 30;    // start animating after this many loaded
  const FRAME_INTERVAL = 80;        // ms between frames (80ms = ~12.5fps)
  const POLL_INTERVAL = 10 * 60 * 1000; // check for new frame every 10min
  const HOURS_BACK = 34;            // how far back to look for frames
  const CADENCE_MINUTES = 10;       // SDO cadence ~10min

  const BASE_URL = 'https://sdo.gsfc.nasa.gov/assets/img/browse';

  const sunImg = document.getElementById('sun-img');
  if(!sunImg) return;

  // === STATE ===
  let frames = [];       // {url, img, loaded} — sliding window
  let playing = false;
  let currentFrame = 0;
  let animTimer = null;

  // === BUILD FRAME URL LIST ===
  // Generate expected URLs for last HOURS_BACK hours, every CADENCE_MINUTES
  function buildFrameList(){
    const urls = [];
    const now = new Date();

    for(let i = 0; i < MAX_FRAMES; i++){
      const t = new Date(now.getTime() - (MAX_FRAMES - 1 - i) * CADENCE_MINUTES * 60 * 1000);
      const y = t.getUTCFullYear();
      const m = String(t.getUTCMonth() + 1).padStart(2, '0');
      const d = String(t.getUTCDate()).padStart(2, '0');
      const hh = String(t.getUTCHours()).padStart(2, '0');
      const mm = String(t.getUTCMinutes()).padStart(2, '0');

      // SDO timestamps aren't exact — round to nearest expected slot
      // We'll try the URL and skip if 404
      const dateStr = `${y}${m}${d}`;
      const timeStr = `${hh}${mm}00`;
      const url = `${BASE_URL}/${y}/${m}/${d}/${dateStr}_${timeStr}_${SIZE}_${CHANNEL}.jpg`;

      urls.push(url);
    }
    return urls;
  }

  // === SMART FRAME DISCOVERY ===
  // SDO timestamps aren't round numbers — discover actual frames via index page
  async function discoverFrames(){
    const now = new Date();
    const allFrames = [];

    // Check today and yesterday
    for(let dayOffset = 1; dayOffset >= 0; dayOffset--){
      const day = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const y = day.getUTCFullYear();
      const m = String(day.getUTCMonth() + 1).padStart(2, '0');
      const d = String(day.getUTCDate()).padStart(2, '0');
      const indexUrl = `${BASE_URL}/${y}/${m}/${d}/`;

      try {
        const resp = await fetch(indexUrl);
        if(!resp.ok) continue;
        const html = await resp.text();

        // Parse filenames matching our channel + size
        const pattern = new RegExp(`(\\d{8}_\\d{6}_${SIZE}_${CHANNEL}\\.jpg)`, 'g');
        let match;
        while((match = pattern.exec(html)) !== null){
          allFrames.push({
            url: `${indexUrl}${match[1]}`,
            filename: match[1],
            timestamp: match[1].substring(0, 15) // YYYYMMDD_HHMMSS
          });
        }
      } catch(e){
        console.log('Sun timelapse: failed to fetch index for', y, m, d);
      }
    }

    // Sort by timestamp, take last MAX_FRAMES
    allFrames.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return allFrames.slice(-MAX_FRAMES);
  }

  // === PRELOAD FRAMES ===
  let loadedCount = 0;
  let startedPlaying = false;

  function preloadFrame(frameData){
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      frameData.loaded = true;
      loadedCount++;

      // Start playing as soon as we have enough
      if(!startedPlaying && loadedCount >= MIN_FRAMES_TO_PLAY){
        startedPlaying = true;
        startAnimation();
      }
    };

    img.onerror = () => {
      frameData.failed = true;
    };

    img.src = frameData.url;
    frameData.img = img;
  }

  // === ANIMATION ===
  function startAnimation(){
    if(playing) return;
    playing = true;

    animTimer = setInterval(() => {
      // Find next loaded frame
      let attempts = 0;
      while(attempts < frames.length){
        currentFrame = (currentFrame + 1) % frames.length;
        const f = frames[currentFrame];
        if(f.loaded && f.img && f.img.complete){
          sunImg.src = f.img.src;
          break;
        }
        attempts++;
      }
    }, FRAME_INTERVAL);
  }

  // === SLIDING WINDOW — add new, drop old ===
  async function pollNewFrame(){
    try {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, '0');
      const d = String(now.getUTCDate()).padStart(2, '0');
      const indexUrl = `${BASE_URL}/${y}/${m}/${d}/`;

      const resp = await fetch(indexUrl);
      if(!resp.ok) return;
      const html = await resp.text();

      const pattern = new RegExp(`(\\d{8}_\\d{6}_${SIZE}_${CHANNEL}\\.jpg)`, 'g');
      const found = [];
      let match;
      while((match = pattern.exec(html)) !== null){
        found.push(match[1]);
      }

      if(found.length === 0) return;

      // Get the newest frame
      found.sort();
      const newest = found[found.length - 1];
      const newestUrl = `${indexUrl}${newest}`;

      // Check if we already have it
      const exists = frames.some(f => f.url === newestUrl);
      if(exists) return;

      // Add new frame
      const newFrame = {url: newestUrl, filename: newest, loaded: false};
      frames.push(newFrame);
      preloadFrame(newFrame);

      // Drop oldest to keep within MAX_FRAMES
      if(frames.length > MAX_FRAMES){
        const removed = frames.shift();
        // Adjust currentFrame index
        if(currentFrame > 0) currentFrame--;
        // Help GC
        if(removed.img) removed.img.src = '';
      }

      console.log('Sun timelapse: added', newest, '| total:', frames.length);
    } catch(e){
      console.log('Sun timelapse: poll error');
    }
  }

  // === INIT ===
  async function init(){
    // Step 1: static image already showing (from random channel script)
    // Override to 0304 for consistency with timelapse
    sunImg.src = `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_${SIZE}_${CHANNEL}.jpg`;

    // Step 2: discover actual frames in background
    console.log('Sun timelapse: discovering frames...');
    const discovered = await discoverFrames();
    console.log('Sun timelapse: found', discovered.length, 'frames');

    if(discovered.length === 0){
      console.log('Sun timelapse: no frames found, staying on static');
      return;
    }

    // Step 3: start preloading
    frames = discovered;
    frames.forEach(f => preloadFrame(f));

    // Step 4: poll for new frames every 10min
    setInterval(pollNewFrame, POLL_INTERVAL);
  }

  init();
})();
