/**
 * GHOSTLINE Solar Activity System
 * Real-time space weather from NOAA → visual reactions on site
 *
 * Data: Kp-index, solar wind, X-ray flares, Bz component
 * Effects: cross brightness, aurora bands, particle streams, flare flash
 */

(function(){
  'use strict';

  // === CONFIGURATION ===
  const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const CACHE_KEY = 'ghostline-solar-data';
  const CACHE_TTL = 5 * 60 * 1000;

  // NOAA endpoints (no auth needed)
  const API = {
    kp:    'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
    wind:  'https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json',
    xray:  'https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json',
    bz:    'https://services.swpc.noaa.gov/products/solar-wind/mag-7-day.json'
  };

  // === STATE ===
  window.solarState = {
    kp: 1,
    windSpeed: 350,
    flareClass: 'B',
    bz: 0,
    lastUpdate: 0
  };

  // === DATA FETCHING ===
  function loadCached(){
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if(!raw) return false;
      const data = JSON.parse(raw);
      if(Date.now() - data.lastUpdate > CACHE_TTL) return false;
      Object.assign(window.solarState, data);
      return true;
    } catch(e){ return false; }
  }

  function saveCache(){
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(window.solarState));
    } catch(e){}
  }

  async function fetchKp(){
    try {
      const r = await fetch(API.kp);
      const data = await r.json();
      // Last row, Kp is index 1
      if(data && data.length > 1){
        const last = data[data.length - 1];
        const kp = parseFloat(last[1]);
        if(!isNaN(kp)) window.solarState.kp = kp;
      }
    } catch(e){ console.log('Solar: Kp fetch failed'); }
  }

  async function fetchWind(){
    try {
      const r = await fetch(API.wind);
      const data = await r.json();
      if(data && data.length > 2){
        // Last valid entry, speed is index 2
        for(let i = data.length - 1; i > 0; i--){
          const speed = parseFloat(data[i][2]);
          if(!isNaN(speed) && speed > 0){
            window.solarState.windSpeed = speed;
            break;
          }
        }
      }
    } catch(e){ console.log('Solar: wind fetch failed'); }
  }

  async function fetchFlares(){
    try {
      const r = await fetch(API.xray);
      const data = await r.json();
      if(data && data.length > 0){
        // Most recent flare class
        const last = data[0];
        if(last.max_class) window.solarState.flareClass = last.max_class;
      }
    } catch(e){ console.log('Solar: flare fetch failed'); }
  }

  async function fetchBz(){
    try {
      const r = await fetch(API.bz);
      const data = await r.json();
      if(data && data.length > 2){
        // Last valid Bz, index 3
        for(let i = data.length - 1; i > 0; i--){
          const bz = parseFloat(data[i][3]);
          if(!isNaN(bz)){
            window.solarState.bz = bz;
            break;
          }
        }
      }
    } catch(e){ console.log('Solar: Bz fetch failed'); }
  }

  async function fetchAll(){
    await Promise.allSettled([fetchKp(), fetchWind(), fetchFlares(), fetchBz()]);
    window.solarState.lastUpdate = Date.now();
    saveCache();
    applyEffects();
    updateReadout();
  }

  // === VISUAL EFFECTS ===

  // 1. Aurora canvas (behind content, above grid)
  let auroraCanvas, auroraCtx;

  function createAurora(){
    auroraCanvas = document.createElement('canvas');
    auroraCanvas.id = 'aurora-canvas';
    auroraCanvas.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;opacity:0;transition:opacity 2s;';
    document.body.insertBefore(auroraCanvas, document.body.firstChild);
    auroraCtx = auroraCanvas.getContext('2d');

    function resizeAurora(){
      auroraCanvas.width = window.innerWidth;
      auroraCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeAurora);
    resizeAurora();

    function drawAurora(t){
      const kp = window.solarState.kp;
      if(kp < 4){
        auroraCanvas.style.opacity = '0';
        requestAnimationFrame(drawAurora);
        return;
      }

      const w = auroraCanvas.width, h = auroraCanvas.height;
      auroraCtx.clearRect(0, 0, w, h);

      // Aurora intensity based on Kp
      const intensity = Math.min((kp - 3) / 6, 1); // 0 at Kp4, 1 at Kp9
      auroraCanvas.style.opacity = String(0.3 + intensity * 0.5);

      // Aurora height — bigger storm = more sky coverage
      const auroraHeight = h * (0.15 + intensity * 0.35);

      // Draw aurora bands
      const bands = kp >= 7 ? 4 : kp >= 5 ? 3 : 2;
      for(let b = 0; b < bands; b++){
        const yOffset = b * (auroraHeight / bands);
        const gradient = auroraCtx.createLinearGradient(0, 0, 0, auroraHeight);

        // Color depends on Kp level
        if(kp >= 7){
          // Intense: green + violet + red
          gradient.addColorStop(0, `rgba(255,0,80,${0.05 * intensity})`);
          gradient.addColorStop(0.3, `rgba(120,0,255,${0.12 * intensity})`);
          gradient.addColorStop(0.6, `rgba(0,255,100,${0.15 * intensity})`);
          gradient.addColorStop(1, 'transparent');
        } else if(kp >= 5){
          // Moderate: green + violet
          gradient.addColorStop(0, `rgba(80,0,200,${0.08 * intensity})`);
          gradient.addColorStop(0.5, `rgba(0,255,80,${0.1 * intensity})`);
          gradient.addColorStop(1, 'transparent');
        } else {
          // Mild: just green
          gradient.addColorStop(0, `rgba(0,200,80,${0.06 * intensity})`);
          gradient.addColorStop(1, 'transparent');
        }

        // Wavy aurora using sine
        auroraCtx.beginPath();
        auroraCtx.moveTo(0, 0);
        for(let x = 0; x <= w; x += 4){
          const wave1 = Math.sin(x * 0.003 + t * 0.0003 + b) * 20 * intensity;
          const wave2 = Math.sin(x * 0.007 + t * 0.0005 + b * 2) * 10 * intensity;
          const y = yOffset + wave1 + wave2;
          auroraCtx.lineTo(x, y);
        }
        auroraCtx.lineTo(w, auroraHeight + 50);
        auroraCtx.lineTo(0, auroraHeight + 50);
        auroraCtx.closePath();
        auroraCtx.fillStyle = gradient;
        auroraCtx.fill();
      }

      requestAnimationFrame(drawAurora);
    }
    requestAnimationFrame(drawAurora);
  }

  // 2. Solar wind particles
  let particleCanvas, particleCtx, particles = [];

  function createParticles(){
    particleCanvas = document.createElement('canvas');
    particleCanvas.id = 'particle-canvas';
    particleCanvas.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;';
    document.body.insertBefore(particleCanvas, document.body.firstChild);
    particleCtx = particleCanvas.getContext('2d');

    function resizeParticles(){
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeParticles);
    resizeParticles();

    function drawParticles(t){
      const wind = window.solarState.windSpeed;
      const w = particleCanvas.width, h = particleCanvas.height;
      particleCtx.clearRect(0, 0, w, h);

      if(wind < 400){
        requestAnimationFrame(drawParticles);
        return;
      }

      // Particle count based on wind speed
      const targetCount = Math.floor((wind - 400) / 20);
      const maxParticles = Math.min(targetCount, 80);

      // Spawn from sun direction (bottom-right)
      while(particles.length < maxParticles){
        particles.push({
          x: w * 0.85 + Math.random() * 100,
          y: h * 0.85 + Math.random() * 100,
          vx: -(2 + Math.random() * 3) * (wind / 500),
          vy: -(1 + Math.random() * 2) * (wind / 500),
          life: 1,
          decay: 0.003 + Math.random() * 0.005,
          size: 1 + Math.random() * 2
        });
      }

      // Update + draw
      for(let i = particles.length - 1; i >= 0; i--){
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if(p.life <= 0 || p.x < -50 || p.y < -50){
          particles.splice(i, 1);
          continue;
        }

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // Color: yellow-white for fast wind, blue-white for moderate
        const hue = wind > 600 ? '60,100%' : '200,80%';
        particleCtx.fillStyle = `hsla(${hue},90%,${p.life * 0.5})`;
        particleCtx.fill();

        // Trail
        particleCtx.beginPath();
        particleCtx.moveTo(p.x, p.y);
        particleCtx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        particleCtx.strokeStyle = `hsla(${hue},90%,${p.life * 0.2})`;
        particleCtx.lineWidth = p.size * 0.5;
        particleCtx.stroke();
      }

      requestAnimationFrame(drawParticles);
    }
    requestAnimationFrame(drawParticles);
  }

  // 3. X-class flare flash
  let flashDiv;

  function createFlashOverlay(){
    flashDiv = document.createElement('div');
    flashDiv.id = 'flare-flash';
    flashDiv.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;background:white;opacity:0;transition:opacity 0.15s;';
    document.body.appendChild(flashDiv);
  }

  function triggerFlare(){
    if(!flashDiv) return;
    flashDiv.style.transition = 'opacity 0.1s';
    flashDiv.style.opacity = '0.7';
    setTimeout(() => {
      flashDiv.style.transition = 'opacity 1.5s';
      flashDiv.style.opacity = '0';
    }, 150);
  }

  // 4. Data readout terminal
  let readout;

  function createReadout(){
    readout = document.createElement('div');
    readout.id = 'solar-readout';
    readout.style.cssText = `
      position:fixed;
      bottom:12px;
      left:12px;
      z-index:100;
      font-family:'Share Tech Mono',monospace;
      font-size:10px;
      color:rgba(0,255,100,0.5);
      line-height:1.5;
      pointer-events:none;
      opacity:0.7;
      text-shadow:0 0 4px rgba(0,255,0,0.3);
    `;
    document.body.appendChild(readout);
  }

  function updateReadout(){
    if(!readout) return;
    const s = window.solarState;
    const kpColor = s.kp >= 7 ? '#ff3366' : s.kp >= 5 ? '#ffaa00' : s.kp >= 4 ? '#88ff00' : '#00ff66';
    const bzStatus = s.bz < -10 ? 'STORM' : s.bz < -5 ? 'ACTIVE' : 'QUIET';
    const windStatus = s.windSpeed > 600 ? 'HIGH' : s.windSpeed > 450 ? 'ELEVATED' : 'NORMAL';

    readout.innerHTML = `
      <span style="color:${kpColor}">Kp ${s.kp.toFixed(1)}</span> │
      WIND ${Math.round(s.windSpeed)} km/s <span style="color:${s.windSpeed>500?'#ffaa00':'#00ff66'}">[${windStatus}]</span> │
      Bz ${s.bz.toFixed(1)} <span style="color:${s.bz<-5?'#ff3366':'#00ff66'}">[${bzStatus}]</span> │
      FLARE: ${s.flareClass}
    `;
  }

  // 5. Modify cross shimmer based on Kp
  function applyEffects(){
    const kp = window.solarState.kp;
    const wind = window.solarState.windSpeed;

    // Export kp multiplier for shimmer-dots canvas to pick up
    window.solarKpMultiplier = kp < 4 ? 1 : 1 + (kp - 3) * 0.3;
    window.solarKpBrightness = kp < 4 ? 0 : (kp - 3) * 0.04;

    // Sun brightness boost during storms
    const sunImg = document.getElementById('sun-img');
    if(sunImg){
      const bright = 0.5 + Math.min(kp / 18, 0.3);
      const sat = 0.7 + Math.min(kp / 15, 0.4);
      sunImg.style.filter = `brightness(${bright}) saturate(${sat})`;
    }

    // X-class flare flash
    if(window.solarState.flareClass && window.solarState.flareClass.startsWith('X')){
      // Only flash once per session
      if(!window._flareFlashed){
        window._flareFlashed = true;
        setTimeout(triggerFlare, 2000);
      }
    }
  }

  // === INIT ===
  function init(){
    createAurora();
    createParticles();
    createFlashOverlay();
    createReadout();

    // Try cache first
    if(loadCached()){
      applyEffects();
      updateReadout();
    }

    // Fetch fresh data
    fetchAll();

    // Poll every 5 minutes
    setInterval(fetchAll, POLL_INTERVAL);
  }

  // Wait for DOM
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
