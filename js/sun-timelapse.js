/**
 * GHOSTLINE Sun Timelapse
 * Loads frame URLs from data/sun-frames.json, preloads images, plays animation.
 *
 * Flow:
 * 1. Show latest static image immediately
 * 2. Fetch sun-frames.json (14KB, list of ~200 URLs)
 * 3. Preload frames in background
 * 4. After 30+ loaded — start timelapse animation
 * 5. Sliding window: always ≤ MAX_FRAMES in memory
 */

(function(){
  'use strict';

  const MAX_FRAMES = 200;
  const MIN_TO_PLAY = 20;
  const FRAME_MS = 100;          // 100ms = 10fps
  const BATCH_SIZE = 8;          // preload 8 at a time
  const FRAMES_JSON = 'data/sun-frames.json';

  const sunImg = document.getElementById('sun-img');
  if(!sunImg) return;

  let frames = [];       // {url, img, loaded}
  let playing = false;
  let idx = 0;
  let loadedCount = 0;

  // Preload one frame
  function loadFrame(f){
    const img = new Image();
    img.onload = () => {
      f.loaded = true;
      f.img = img;
      loadedCount++;
      if(!playing && loadedCount >= MIN_TO_PLAY) startAnim();
    };
    img.onerror = () => { f.failed = true; };
    img.src = f.url;
  }

  // Preload in batches to not hammer network
  function preloadBatch(startIdx){
    const end = Math.min(startIdx + BATCH_SIZE, frames.length);
    for(let i = startIdx; i < end; i++){
      loadFrame(frames[i]);
    }
    if(end < frames.length){
      setTimeout(() => preloadBatch(end), 200);
    }
  }

  // Animation loop
  function startAnim(){
    if(playing) return;
    playing = true;
    console.log('Sun timelapse: playing', loadedCount, 'frames');

    setInterval(() => {
      // Skip to next loaded frame
      let tries = 0;
      while(tries < frames.length){
        idx = (idx + 1) % frames.length;
        const f = frames[idx];
        if(f.loaded && f.img){
          sunImg.src = f.img.src;
          break;
        }
        tries++;
      }
    }, FRAME_MS);
  }

  // Init
  async function init(){
    try {
      const resp = await fetch(FRAMES_JSON);
      if(!resp.ok) throw new Error('No frames JSON');
      const urls = await resp.json();

      console.log('Sun timelapse:', urls.length, 'frames in JSON');

      // Take last MAX_FRAMES
      const use = urls.slice(-MAX_FRAMES);
      frames = use.map(url => ({url, img: null, loaded: false, failed: false}));

      // Start preloading
      preloadBatch(0);

    } catch(e){
      console.log('Sun timelapse: fallback to static —', e.message);
    }
  }

  init();
})();
