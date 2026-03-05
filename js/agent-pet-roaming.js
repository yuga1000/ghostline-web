// ===== ROAMING AGENT PET MODULE (for index.html) =====
// v3 — PNG sprite-based animation (replaces CSS pixel grid)

(function() {
    console.log('[Roaming Pet] Initializing v3 (sprite)...');

    // ===== SPRITE FRAME DEFINITIONS =====
    const FRAMES = {
        stay: [
            'pet/newpetseq/stay/IMG_6072.PNG',
            'pet/newpetseq/stay/IMG_6073.PNG',
            'pet/newpetseq/stay/IMG_6074.PNG',
        ],
        go: [
            'pet/newpetseq/go/IMG_6075.PNG',
            'pet/newpetseq/go/IMG_6076.PNG',
            'pet/newpetseq/go/IMG_6077.PNG',
            'pet/newpetseq/go/IMG_6078.PNG',
            'pet/newpetseq/go/IMG_6079.PNG',
        ],
        sleep: [
            'pet/newpetseq/sleep/IMG_6080.PNG',
            'pet/newpetseq/sleep/IMG_6081.PNG',
        ],
        transformation: [
            'pet/newpetseq/transformation/IMG_6082.PNG',
            'pet/newpetseq/transformation/IMG_6083.PNG',
            'pet/newpetseq/transformation/IMG_6084.PNG',
            'pet/newpetseq/transformation/IMG_6085.PNG',
            'pet/newpetseq/transformation/IMG_6086.PNG',
        ],
    };

    // Frame timing (ms per frame)
    const TIMING = {
        stay: 300,            // 0.3s
        go: 100,              // 0.1s
        sleep: 400,           // 0.4s
        transformation: 400,  // 0.4s
    };

    const TRANSFORM_HOLD_TIME = 15000; // 15s hold on last frame

    // Pet display size (px) — will be scaled from source images
    const PET_SIZE = 40;

    // ===== SPRITE ENGINE =====
    let spriteImg = null;
    let spriteState = 'stay';       // current frame set
    let spriteFrameIdx = 0;
    let spriteTimer = null;
    let transformPhase = 'none';    // 'forward', 'hold', 'reverse', 'none'
    let transformCallback = null;   // called when full transform cycle completes

    // Preload all frames
    const preloadCache = {};
    function preloadFrames() {
        for (const key of Object.keys(FRAMES)) {
            for (const src of FRAMES[key]) {
                const img = new Image();
                img.src = src;
                preloadCache[src] = img;
            }
        }
    }

    function startSpriteLoop(state) {
        if (spriteState === state && spriteTimer) return; // already running this state
        stopSpriteLoop();
        spriteState = state;
        spriteFrameIdx = 0;
        transformPhase = 'none';

        const frames = FRAMES[state];
        const interval = TIMING[state];
        if (!frames || !spriteImg) return;

        // Show first frame immediately
        spriteImg.src = frames[0];

        spriteTimer = setInterval(() => {
            spriteFrameIdx = (spriteFrameIdx + 1) % frames.length;
            spriteImg.src = frames[spriteFrameIdx];
        }, interval);
    }

    function stopSpriteLoop() {
        if (spriteTimer) {
            clearInterval(spriteTimer);
            spriteTimer = null;
        }
    }

    // Transformation: forward -> hold last frame 15s -> reverse -> callback
    function playTransformation(onComplete) {
        stopSpriteLoop();
        spriteState = 'transformation';
        transformPhase = 'forward';
        transformCallback = onComplete || null;

        const frames = FRAMES.transformation;
        const interval = TIMING.transformation;
        spriteFrameIdx = 0;
        spriteImg.src = frames[0];

        spriteTimer = setInterval(() => {
            spriteFrameIdx++;
            if (spriteFrameIdx >= frames.length) {
                // Reached last frame — hold
                clearInterval(spriteTimer);
                spriteTimer = null;
                spriteFrameIdx = frames.length - 1;
                spriteImg.src = frames[spriteFrameIdx];
                transformPhase = 'hold';

                console.log('[Roaming Pet] Transform hold — 15s on last frame');

                setTimeout(() => {
                    // Reverse
                    transformPhase = 'reverse';
                    spriteFrameIdx = frames.length - 1;

                    spriteTimer = setInterval(() => {
                        spriteFrameIdx--;
                        if (spriteFrameIdx < 0) {
                            clearInterval(spriteTimer);
                            spriteTimer = null;
                            transformPhase = 'none';
                            console.log('[Roaming Pet] Transform complete');
                            if (transformCallback) transformCallback();
                        } else {
                            spriteImg.src = frames[spriteFrameIdx];
                        }
                    }, interval);
                }, TRANSFORM_HOLD_TIME);
            } else {
                spriteImg.src = frames[spriteFrameIdx];
            }
        }, interval);
    }

    // ===== PET STATE =====
    let currentAnimation = 'idle';
    let currentTarget = null;
    let isMoving = false;
    let moveInterval = null;
    let isSleeping = false;
    let currentAnchorEl = null;

    // Movement targets on index.html
    const targets = [
        { id: 'logo', name: 'logo', animations: ['idle', 'idle', 'growing'], walkEdges: false, preferGrowing: true },
        { id: 'galleryBtn', name: 'gallery', animations: ['idle', 'idle'], walkEdges: true, preferGrowing: false },
        { id: 'streamBtn', name: 'stream', animations: ['idle', 'idle'], walkEdges: true, preferGrowing: false },
        { id: 'orderBtn', name: 'order', animations: ['idle', 'idle'], walkEdges: true, preferGrowing: false },
        { id: 'socialToggle', name: 'social', animations: ['idle', 'idle'], walkEdges: true, preferGrowing: false },
        { id: 'titleContainer', name: 'title', animations: ['idle', 'growing'], walkEdges: false, preferGrowing: true }
    ];

    // Spider mode state
    let spiderModeActive = false;
    let lastSpiderModeTime = 0;
    const SPIDER_MODE_COOLDOWN = 10 * 60 * 1000;

    // ===== CREATE PET HTML =====
    function createPetHTML() {
        const container = document.createElement('div');
        container.id = 'roaming-pet-container';
        container.className = 'roaming-pet-container';
        container.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            z-index: 9998;
            pointer-events: none;
            transition: none;
        `;

        const img = document.createElement('img');
        img.id = 'roaming-pet';
        img.src = FRAMES.stay[0];
        img.alt = 'ghost pet';
        img.style.cssText = `
            width: ${PET_SIZE}px;
            height: ${PET_SIZE}px;
            image-rendering: pixelated;
            display: block;
            pointer-events: auto;
            cursor: pointer;
        `;

        container.appendChild(img);
        document.body.appendChild(container);

        spriteImg = img;
        console.log('[Roaming Pet] Sprite pet created');
        return container;
    }

    // ===== NIGHT TIME =====
    function isNightTime() {
        const hour = new Date().getHours();
        return hour >= 23 || hour < 7;
    }

    // ===== SET ANIMATION (maps old names to sprite states) =====
    function setAnimation(animation) {
        if (spiderModeActive) return;
        if (!spriteImg) return;

        // Map old animation names to sprite states
        if (animation === 'growing') {
            performGrowingAnimation();
            return;
        }

        if (animation === 'jumping') {
            performJumpAnimation();
            return;
        }

        if (animation === 'sleeping') {
            startSpriteLoop('sleep');
            currentAnimation = 'sleeping';
            console.log('[Roaming Pet] Animation: sleeping');
            return;
        }

        if (animation === 'walking') {
            startSpriteLoop('go');
            currentAnimation = 'walking';
            console.log('[Roaming Pet] Animation: walking');
            return;
        }

        // idle, waving, blinking, playing, dancing -> all use stay frames
        startSpriteLoop('stay');
        currentAnimation = animation;
        console.log('[Roaming Pet] Animation:', animation);
    }

    // ===== JUMP ANIMATION =====
    function performJumpAnimation() {
        if (!spriteImg) return;
        console.log('[Roaming Pet] Jumping!');

        // Quick go frames during jump
        startSpriteLoop('go');
        currentAnimation = 'jumping';

        // Vertical bounce via CSS
        const container = document.getElementById('roaming-pet-container');
        if (container) {
            const origTop = parseFloat(container.style.top) || 0;
            container.style.top = (origTop - 18) + 'px';
            setTimeout(() => {
                container.style.top = origTop + 'px';
            }, 250);
        }

        setTimeout(() => {
            setAnimation('idle');
        }, 500);
    }

    // ===== TRANSFORMATION (was "growing" / flower system) =====
    function performGrowingAnimation() {
        if (!spriteImg) return;
        console.log('[Roaming Pet] Starting transformation...');

        playTransformation(() => {
            // After full forward-hold-reverse cycle, return to idle
            setAnimation('idle');
            scheduleNextMove();
        });
    }

    // ===== SLEEP / WAKE =====
    function goToSleep() {
        if (isSleeping) return;
        console.log('[Roaming Pet] Going to sleep...');
        isSleeping = true;

        if (moveInterval) {
            clearInterval(moveInterval);
            moveInterval = null;
        }
        isMoving = false;

        setAnimation('sleeping');
    }

    function wakeUp() {
        if (!isSleeping) return;
        console.log('[Roaming Pet] Waking up...');
        isSleeping = false;

        setAnimation('idle');

        // Random wake-up behavior
        const behaviors = [
            () => moveToRandomTarget(),
            () => { performJumpAnimation(); setTimeout(() => moveToRandomTarget(), 1000); },
            () => { setAnimation('idle'); setTimeout(() => moveToRandomTarget(), 1500); },
        ];
        const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        setTimeout(behavior, 800);
    }

    function moveToRandomTarget() {
        const target = getRandomTarget();
        if (target) {
            currentTarget = target;
            if (Math.random() < 0.4) {
                jumpToTarget(target);
            } else {
                moveToTarget(target);
            }
        } else {
            scheduleNextMove();
        }
    }

    function checkSleepCycle() {
        const shouldSleep = isNightTime();
        if (shouldSleep && !isSleeping) goToSleep();
        else if (!shouldSleep && isSleeping) wakeUp();
    }

    // ===== TARGET SELECTION =====
    function getRandomAnimation(target) {
        if (!target.animations || target.animations.length === 0) return 'idle';
        return target.animations[Math.floor(Math.random() * target.animations.length)];
    }

    function getRandomTarget() {
        const available = targets.filter(t => document.getElementById(t.id));
        if (available.length === 0) return null;
        return available[Math.floor(Math.random() * available.length)];
    }

    // ===== MOVEMENT (keep all existing movement logic) =====

    function walkAllEdges(target) {
        const container = document.getElementById('roaming-pet-container');
        const targetElement = document.getElementById(target.id);
        if (!container || !targetElement || !target.walkEdges) return;

        isMoving = true;
        setAnimation('walking');

        const targetRect = targetElement.getBoundingClientRect();
        const margin = 10;

        const edgePath = [
            { startX: targetRect.left + margin, startY: targetRect.top - margin, endX: targetRect.right - margin, endY: targetRect.top - margin },
            { startX: targetRect.right + margin, startY: targetRect.top + margin, endX: targetRect.right + margin, endY: targetRect.bottom - margin },
            { startX: targetRect.right - margin, startY: targetRect.bottom + margin, endX: targetRect.left + margin, endY: targetRect.bottom + margin },
            { startX: targetRect.left - margin, startY: targetRect.bottom - margin, endX: targetRect.left - margin, endY: targetRect.top + margin }
        ];

        let edgeIdx = 0;

        function walkNextEdge() {
            if (edgeIdx >= edgePath.length) {
                isMoving = false;
                setAnimation('idle');
                const holdTime = 2000 + Math.random() * 3000;
                setTimeout(() => scheduleNextMove(), holdTime);
                return;
            }

            const edge = edgePath[edgeIdx];
            container.style.left = edge.startX + 'px';
            container.style.top = edge.startY + 'px';

            setTimeout(() => {
                const dx = edge.endX - edge.startX;
                const dy = edge.endY - edge.startY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const steps = Math.ceil(dist / 12);
                const sx = dx / steps;
                const sy = dy / steps;
                let step = 0;

                if (moveInterval) clearInterval(moveInterval);
                moveInterval = setInterval(() => {
                    if (step >= steps) {
                        clearInterval(moveInterval);
                        moveInterval = null;
                        edgeIdx++;
                        setTimeout(walkNextEdge, 100);
                        return;
                    }
                    container.style.left = (edge.startX + sx * (step + 1)) + 'px';
                    container.style.top = (edge.startY + sy * (step + 1)) + 'px';
                    step++;
                }, 125);
            }, 100);
        }

        walkNextEdge();
    }

    function walkSingleEdge(target) {
        const container = document.getElementById('roaming-pet-container');
        const targetElement = document.getElementById(target.id);
        if (!container || !targetElement || !target.walkEdges) return;

        isMoving = true;
        setAnimation('walking');

        const r = targetElement.getBoundingClientRect();
        const m = 10;
        const edges = [
            { startX: r.left + m, startY: r.top - m, endX: r.right - m, endY: r.top - m },
            { startX: r.right + m, startY: r.top + m, endX: r.right + m, endY: r.bottom - m },
            { startX: r.right - m, startY: r.bottom + m, endX: r.left + m, endY: r.bottom + m },
            { startX: r.left - m, startY: r.bottom - m, endX: r.left - m, endY: r.top + m }
        ];
        const edge = edges[Math.floor(Math.random() * edges.length)];

        container.style.left = edge.startX + 'px';
        container.style.top = edge.startY + 'px';

        setTimeout(() => {
            const dx = edge.endX - edge.startX;
            const dy = edge.endY - edge.startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.ceil(dist / 12);
            const sx = dx / steps;
            const sy = dy / steps;
            let step = 0;

            if (moveInterval) clearInterval(moveInterval);
            moveInterval = setInterval(() => {
                if (step >= steps) {
                    clearInterval(moveInterval);
                    moveInterval = null;
                    isMoving = false;
                    setAnimation('idle');
                    setTimeout(() => scheduleNextMove(), 2000 + Math.random() * 3000);
                    return;
                }
                container.style.left = (edge.startX + sx * (step + 1)) + 'px';
                container.style.top = (edge.startY + sy * (step + 1)) + 'px';
                step++;
            }, 125);
        }, 100);
    }

    function getLandingPoint(el) {
        const rect = el.getBoundingClientRect();
        const petW = PET_SIZE;
        const petH = PET_SIZE;
        const offsetX = (Math.random() - 0.5) * Math.min(rect.width * 0.5, 60);
        const x = Math.max(4, Math.min(
            window.innerWidth - petW - 4,
            rect.left + rect.width / 2 + offsetX - petW / 2
        ));
        const y = Math.max(4, rect.top - petH);
        return { x, y };
    }

    function jumpToTarget(target) {
        if (spiderModeActive) return;
        const container = document.getElementById('roaming-pet-container');
        const targetElement = document.getElementById(target.id);
        if (!container || !targetElement) return;

        isMoving = true;

        const currentX = parseFloat(container.style.left) || 0;
        const currentY = parseFloat(container.style.top) || 0;
        const landing = getLandingPoint(targetElement);

        const dx = landing.x - currentX;
        const dy = landing.y - currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const jumpDist = 60 + Math.random() * 20;
        const numJumps = Math.max(1, Math.ceil(dist / jumpDist));
        const jx = dx / numJumps;
        const jy = dy / numJumps;
        let jump = 0;

        function doJump() {
            if (jump >= numJumps) {
                isMoving = false;
                decideTargetAction(target);
                return;
            }

            setAnimation('jumping');
            container.style.left = (currentX + jx * (jump + 1)) + 'px';
            container.style.top = (currentY + jy * (jump + 1)) + 'px';
            jump++;
            setTimeout(doJump, 600);
        }

        doJump();
    }

    function moveToTarget(target) {
        if (spiderModeActive) return;
        const container = document.getElementById('roaming-pet-container');
        const targetElement = document.getElementById(target.id);
        if (!container || !targetElement) return;

        isMoving = true;
        setAnimation('walking');

        const startX = parseFloat(container.style.left) || 0;
        const startY = parseFloat(container.style.top) || 0;
        const landing = getLandingPoint(targetElement);

        if (moveInterval) { clearInterval(moveInterval); moveInterval = null; }

        function animSeg(x1, y1, x2, y2, cb) {
            const dx = x2 - x1, dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 2) { cb(); return; }
            const steps = Math.ceil(dist / 10);
            const sx = dx / steps, sy = dy / steps;
            let s = 0;
            moveInterval = setInterval(() => {
                s++;
                container.style.left = (x1 + sx * s) + 'px';
                container.style.top = (y1 + sy * s) + 'px';
                if (s >= steps) { clearInterval(moveInterval); moveInterval = null; cb(); }
            }, 100);
        }

        animSeg(startX, startY, landing.x, startY, () => {
            if (!isMoving) return;
            animSeg(landing.x, startY, landing.x, landing.y, () => {
                isMoving = false;
                decideTargetAction(target);
            });
        });
    }

    function decideTargetAction(target) {
        currentAnchorEl = document.getElementById(target.id) || null;

        if (target.preferGrowing && Math.random() < 0.5) {
            setAnimation('growing');
            return;
        }

        if (target.walkEdges) {
            const rand = Math.random();
            if (rand < 0.4) { setTimeout(() => walkAllEdges(target), 500); return; }
            if (rand < 0.7) { setTimeout(() => walkSingleEdge(target), 500); return; }
        }

        setAnimation('idle');
        const holdTime = 2000 + Math.random() * 3000;
        setTimeout(() => {
            setAnimation('idle');
            scheduleNextMove();
        }, holdTime);
    }

    // ===== SCHEDULE MOVEMENT =====
    function scheduleNextMove() {
        if (isMoving || isSleeping || spiderModeActive) return;

        const delay = 8000 + Math.random() * 32000;
        console.log('[Roaming Pet] Next move in', Math.floor(delay / 1000), 's');

        setTimeout(() => {
            if (isSleeping) return;

            if (Math.random() < 0.35) {
                // In-place action
                const anims = ['idle', 'growing', 'jumping'];
                const anim = anims[Math.floor(Math.random() * anims.length)];
                setAnimation(anim);
                if (anim !== 'growing') {
                    setTimeout(() => { setAnimation('idle'); scheduleNextMove(); }, 2000 + Math.random() * 2000);
                }
                return;
            }

            const target = getRandomTarget();
            if (target) {
                currentTarget = target;
                if (Math.random() < 0.4) jumpToTarget(target);
                else moveToTarget(target);
            } else {
                scheduleNextMove();
            }
        }, delay);
    }

    // ===== PAGE INTERACTIONS =====
    function setupPageInteractions() {
        const ids = ['logo', 'galleryBtn', 'streamBtn', 'orderBtn', 'socialToggle', 'titleContainer'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            el.addEventListener('mouseenter', () => {
                if (isSleeping || spiderModeActive || isMoving) return;
                if (Math.random() < 0.5) {
                    setAnimation('idle'); // subtle reaction — stay frames shift
                    setTimeout(() => { if (!isMoving) setAnimation('idle'); }, 1200);
                }
            });

            el.addEventListener('click', () => {
                if (isSleeping || spiderModeActive) return;
                if (moveInterval) { clearInterval(moveInterval); moveInterval = null; isMoving = false; }
                performJumpAnimation();
                setTimeout(() => {
                    const target = targets.find(t => t.id === id);
                    if (target) setTimeout(() => moveToTarget(target), 500);
                    else scheduleNextMove();
                }, 1500);
            });
        });
    }

    // ===== SLEEP CYCLE =====
    function startSleepCycleChecker() {
        checkSleepCycle();
        setInterval(checkSleepCycle, 5 * 60 * 1000);
    }

    // ===== SPIDER MODE =====
    function checkSpiderMode() {
        if (isSleeping || spiderModeActive) return;
        const now = Date.now();
        if (now - lastSpiderModeTime > SPIDER_MODE_COOLDOWN && Math.random() < 0.2) {
            enterSpiderMode();
        }
    }

    function enterSpiderMode() {
        if (!window.SpiderWebSystem) return;

        spiderModeActive = true;
        lastSpiderModeTime = Date.now();

        if (moveInterval) { clearInterval(moveInterval); moveInterval = null; }
        isMoving = false;

        // Use go frames during spider mode (active looking)
        startSpriteLoop('go');

        window.SpiderWebSystem.start(spriteImg);

        setTimeout(() => {
            spiderModeActive = false;
            setAnimation('idle');
            console.log('[Roaming Pet] Spider mode ended');
        }, 30 * 60 * 1000);
    }

    function startSpiderModeChecker() {
        setInterval(checkSpiderMode, 2 * 60 * 1000);
    }

    // ===== INIT =====
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        console.log('[Roaming Pet] Page ready, creating sprite pet...');

        preloadFrames();
        const container = createPetHTML();

        // Start on random element
        const startTargets = targets.filter(t => document.getElementById(t.id));
        const startTarget = startTargets[Math.floor(Math.random() * startTargets.length)];
        if (startTarget) {
            const el = document.getElementById(startTarget.id);
            const landing = getLandingPoint(el);
            container.style.left = landing.x + 'px';
            container.style.top = landing.y + 'px';
            currentAnchorEl = el;
            console.log('[Roaming Pet] Starting on', startTarget.name);
        } else {
            container.style.left = (window.innerWidth / 2 - PET_SIZE / 2) + 'px';
            container.style.top = (window.innerHeight - 80) + 'px';
        }

        startSleepCycleChecker();
        startSpiderModeChecker();
        setupPageInteractions();

        // Scroll tracking
        function onScroll() {
            if (!currentAnchorEl || isMoving || spiderModeActive) return;
            const c = document.getElementById('roaming-pet-container');
            if (!c) return;
            const pos = getLandingPoint(currentAnchorEl);
            c.style.left = pos.x + 'px';
            c.style.top = pos.y + 'px';
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.addEventListener('scroll', onScroll, { passive: true });

        // Night check
        if (isNightTime()) {
            setAnimation('sleeping');
            isSleeping = true;
            console.log('[Roaming Pet] Night time - sleeping');
        } else {
            setAnimation('idle');

            // Random instant action on load
            setTimeout(() => {
                if (!isSleeping) {
                    const acts = ['idle', 'growing', 'jumping'];
                    const act = acts[Math.floor(Math.random() * acts.length)];
                    setAnimation(act);
                    if (act !== 'growing') {
                        setTimeout(() => setAnimation('idle'), 3000 + Math.random() * 2000);
                    }
                }
            }, 500);

            // Schedule first move
            const initialDelay = 8000 + Math.random() * 7000;
            setTimeout(() => {
                if (!isSleeping) {
                    const target = getRandomTarget();
                    if (target) {
                        currentTarget = target;
                        if (Math.random() < 0.5) jumpToTarget(target);
                        else moveToTarget(target);
                    }
                }
            }, initialDelay);
        }

        console.log('[Roaming Pet] v3 initialized!');
    }

    init();
})();
