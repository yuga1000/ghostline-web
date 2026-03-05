// ===== ROAMING AGENT PET MODULE (for index.html) =====
// v4 — PNG sprite, smooth transforms, calm behavior, block anchoring

(function() {
    console.log('[Roaming Pet] Initializing v4...');

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
        stay: 300,
        go: 100,
        sleep: 400,
        transformation: 400,
    };

    const TRANSFORM_HOLD_TIME = 15000; // 15s hold on last frame
    const PET_SIZE = 40;

    // ===== SPRITE ENGINE =====
    let spriteImg = null;
    let spriteState = 'stay';
    let spriteFrameIdx = 0;
    let spriteTimer = null;
    let isTransforming = false;

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

    // Smooth frame swap with brief crossfade
    function setFrame(src) {
        if (!spriteImg) return;
        spriteImg.src = src;
    }

    function startSpriteLoop(state) {
        if (isTransforming) return; // never interrupt transformation
        if (spriteState === state && spriteTimer) return;
        stopSpriteLoop();
        spriteState = state;
        spriteFrameIdx = 0;

        const frames = FRAMES[state];
        const interval = TIMING[state];
        if (!frames || !spriteImg) return;

        setFrame(frames[0]);

        if (frames.length > 1) {
            spriteTimer = setInterval(() => {
                spriteFrameIdx = (spriteFrameIdx + 1) % frames.length;
                setFrame(frames[spriteFrameIdx]);
            }, interval);
        }
    }

    function stopSpriteLoop() {
        if (spriteTimer) {
            clearInterval(spriteTimer);
            spriteTimer = null;
        }
    }

    // Smooth transformation: forward -> hold 15s -> reverse -> callback
    function playTransformation(onComplete) {
        stopSpriteLoop();
        isTransforming = true;
        spriteState = 'transformation';

        const frames = FRAMES.transformation;
        const interval = TIMING.transformation;
        let idx = 0;

        // Show first frame
        setFrame(frames[0]);

        // Forward sequence using setTimeout chain (more predictable than setInterval)
        function nextForward() {
            idx++;
            if (idx >= frames.length) {
                // Last frame reached — hold
                idx = frames.length - 1;
                setFrame(frames[idx]);
                console.log('[Roaming Pet] Transform: holding last frame 15s...');

                setTimeout(() => {
                    // Reverse sequence
                    let rIdx = frames.length - 1;
                    function nextReverse() {
                        rIdx--;
                        if (rIdx < 0) {
                            // Done
                            isTransforming = false;
                            console.log('[Roaming Pet] Transform complete');
                            if (onComplete) onComplete();
                            return;
                        }
                        setFrame(frames[rIdx]);
                        setTimeout(nextReverse, interval);
                    }
                    nextReverse();
                }, TRANSFORM_HOLD_TIME);
                return;
            }
            setFrame(frames[idx]);
            setTimeout(nextForward, interval);
        }

        setTimeout(nextForward, interval);
    }

    // ===== PET STATE =====
    let currentAnimation = 'idle';
    let currentTarget = null;
    let isMoving = false;
    let moveInterval = null;
    let isSleeping = false;
    let currentAnchorEl = null;

    // Movement targets — includes nav buttons and content blocks
    const targets = [
        { id: 'logo', name: 'logo', walkEdges: false, preferGrowing: true },
        { id: 'galleryBtn', name: 'gallery', walkEdges: true, preferGrowing: false },
        { id: 'streamBtn', name: 'stream', walkEdges: true, preferGrowing: false },
        { id: 'orderBtn', name: 'order', walkEdges: true, preferGrowing: false },
        { id: 'socialToggle', name: 'social', walkEdges: true, preferGrowing: false },
        { id: 'titleContainer', name: 'title', walkEdges: false, preferGrowing: true },
    ];

    // Spider mode
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
            transition: opacity 0.15s ease;
        `;

        container.appendChild(img);
        document.body.appendChild(container);

        spriteImg = img;
        return container;
    }

    // ===== NIGHT TIME =====
    function isNightTime() {
        const hour = new Date().getHours();
        return hour >= 23 || hour < 7;
    }

    // ===== SET ANIMATION =====
    function setAnimation(animation) {
        if (spiderModeActive) return;
        if (isTransforming && animation !== 'idle') return; // don't interrupt transform
        if (!spriteImg) return;

        if (animation === 'growing') {
            if (isTransforming) return;
            performGrowingAnimation();
            return;
        }

        if (animation === 'jumping') {
            if (isTransforming) return;
            performJumpAnimation();
            return;
        }

        if (animation === 'sleeping') {
            startSpriteLoop('sleep');
            currentAnimation = 'sleeping';
            return;
        }

        if (animation === 'walking') {
            startSpriteLoop('go');
            currentAnimation = 'walking';
            return;
        }

        // idle and everything else -> stay frames
        startSpriteLoop('stay');
        currentAnimation = animation;
    }

    // ===== JUMP =====
    function performJumpAnimation() {
        if (!spriteImg || isTransforming) return;

        startSpriteLoop('go');
        currentAnimation = 'jumping';

        const container = document.getElementById('roaming-pet-container');
        if (container) {
            const origTop = parseFloat(container.style.top) || 0;
            container.style.top = (origTop - 14) + 'px';
            setTimeout(() => {
                container.style.top = origTop + 'px';
            }, 250);
        }

        setTimeout(() => {
            if (!isTransforming) setAnimation('idle');
        }, 500);
    }

    // ===== TRANSFORMATION =====
    function performGrowingAnimation() {
        if (!spriteImg || isTransforming) return;

        // Lock pet in place during entire transformation
        isMoving = false;
        if (moveInterval) { clearInterval(moveInterval); moveInterval = null; }

        playTransformation(() => {
            setAnimation('idle');
            scheduleNextMove();
        });
    }

    // ===== SLEEP / WAKE =====
    function goToSleep() {
        if (isSleeping) return;
        isSleeping = true;

        if (moveInterval) { clearInterval(moveInterval); moveInterval = null; }
        isMoving = false;

        setAnimation('sleeping');
    }

    function wakeUp() {
        if (!isSleeping) return;
        isSleeping = false;

        setAnimation('idle');

        // Calm wake-up: just idle for a bit then start moving
        setTimeout(() => {
            if (!isSleeping) moveToRandomTarget();
        }, 3000 + Math.random() * 2000);
    }

    function moveToRandomTarget() {
        const target = getRandomTarget();
        if (target) {
            currentTarget = target;
            // Mostly walk, rarely jump (25%)
            if (Math.random() < 0.25) jumpToTarget(target);
            else moveToTarget(target);
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
    function getRandomTarget() {
        const available = targets.filter(t => document.getElementById(t.id));
        if (available.length === 0) return null;
        return available[Math.floor(Math.random() * available.length)];
    }

    // ===== LANDING POINT =====
    // Pet sits ON TOP of element (centered horizontally, touching top edge)
    function getLandingPoint(el) {
        const rect = el.getBoundingClientRect();
        const offsetX = (Math.random() - 0.5) * Math.min(rect.width * 0.4, 40);
        const x = Math.max(4, Math.min(
            window.innerWidth - PET_SIZE - 4,
            rect.left + rect.width / 2 + offsetX - PET_SIZE / 2
        ));
        const y = Math.max(4, rect.top - PET_SIZE + 4); // sit just on top edge, slight overlap
        return { x, y };
    }

    // Stable landing (no random offset — for scroll tracking)
    function getStableLandingPoint(el) {
        const rect = el.getBoundingClientRect();
        const x = Math.max(4, Math.min(
            window.innerWidth - PET_SIZE - 4,
            rect.left + rect.width / 2 - PET_SIZE / 2
        ));
        const y = Math.max(4, rect.top - PET_SIZE + 4);
        return { x, y };
    }

    // ===== MOVEMENT =====

    function walkAllEdges(target) {
        const container = document.getElementById('roaming-pet-container');
        const targetElement = document.getElementById(target.id);
        if (!container || !targetElement || !target.walkEdges) return;

        isMoving = true;
        setAnimation('walking');

        const r = targetElement.getBoundingClientRect();
        const m = 6;

        // Walk only top edge (cleaner, less hyper)
        const startX = r.left + m;
        const startY = r.top - PET_SIZE + 4;
        const endX = r.right - m - PET_SIZE;
        const endY = startY;

        container.style.left = startX + 'px';
        container.style.top = startY + 'px';

        setTimeout(() => {
            const dx = endX - startX;
            const dist = Math.abs(dx);
            const steps = Math.ceil(dist / 8);
            const sx = dx / steps;
            let step = 0;

            if (moveInterval) clearInterval(moveInterval);
            moveInterval = setInterval(() => {
                if (step >= steps) {
                    clearInterval(moveInterval);
                    moveInterval = null;
                    isMoving = false;
                    currentAnchorEl = targetElement;
                    setAnimation('idle');
                    // Calm pause: 4-8 seconds
                    setTimeout(() => scheduleNextMove(), 4000 + Math.random() * 4000);
                    return;
                }
                container.style.left = (startX + sx * (step + 1)) + 'px';
                step++;
            }, 150); // slightly slower walk
        }, 200);
    }

    function walkSingleEdge(target) {
        // Same as walkAllEdges for now — just walks top edge
        walkAllEdges(target);
    }

    function jumpToTarget(target) {
        if (spiderModeActive || isTransforming) return;
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
        const jumpDist = 70 + Math.random() * 30;
        const numJumps = Math.max(1, Math.ceil(dist / jumpDist));
        const jx = dx / numJumps;
        const jy = dy / numJumps;
        let jump = 0;

        // Use go frames during jump travel
        startSpriteLoop('go');

        function doJump() {
            if (jump >= numJumps) {
                isMoving = false;
                currentAnchorEl = targetElement;
                decideTargetAction(target);
                return;
            }

            // Small vertical bounce
            const newX = currentX + jx * (jump + 1);
            const newY = currentY + jy * (jump + 1);
            container.style.left = newX + 'px';
            container.style.top = (newY - 10) + 'px'; // up
            setTimeout(() => {
                container.style.top = newY + 'px'; // down
            }, 200);

            jump++;
            setTimeout(doJump, 500);
        }

        doJump();
    }

    function moveToTarget(target) {
        if (spiderModeActive || isTransforming) return;
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
            const steps = Math.ceil(dist / 8);
            const sx = dx / steps, sy = dy / steps;
            let s = 0;
            moveInterval = setInterval(() => {
                s++;
                container.style.left = (x1 + sx * s) + 'px';
                container.style.top = (y1 + sy * s) + 'px';
                if (s >= steps) { clearInterval(moveInterval); moveInterval = null; cb(); }
            }, 120); // slightly slower
        }

        // 2-phase: horizontal then vertical
        animSeg(startX, startY, landing.x, startY, () => {
            if (!isMoving) return;
            animSeg(landing.x, startY, landing.x, landing.y, () => {
                isMoving = false;
                currentAnchorEl = targetElement;
                decideTargetAction(target);
            });
        });
    }

    function decideTargetAction(target) {
        currentAnchorEl = document.getElementById(target.id) || null;

        // 30% chance to transform at preferred spots
        if (target.preferGrowing && Math.random() < 0.3) {
            setAnimation('growing');
            return;
        }

        // Walk along top edge of buttons
        if (target.walkEdges && Math.random() < 0.5) {
            setTimeout(() => walkAllEdges(target), 800);
            return;
        }

        // Otherwise just idle and chill
        setAnimation('idle');
        // Calm hold: 5-10 seconds before next move
        const holdTime = 5000 + Math.random() * 5000;
        setTimeout(() => {
            scheduleNextMove();
        }, holdTime);
    }

    // ===== SCHEDULE MOVEMENT (calmer) =====
    function scheduleNextMove() {
        if (isMoving || isSleeping || spiderModeActive || isTransforming) return;

        // 15-60 seconds between moves (was 8-40)
        const delay = 15000 + Math.random() * 45000;
        console.log('[Roaming Pet] Next move in', Math.floor(delay / 1000), 's');

        setTimeout(() => {
            if (isSleeping || isTransforming) return;

            // 20% chance for in-place action (was 35%)
            if (Math.random() < 0.2) {
                const anims = ['idle', 'growing'];
                const anim = anims[Math.floor(Math.random() * anims.length)];
                setAnimation(anim);
                if (anim !== 'growing') {
                    setTimeout(() => { setAnimation('idle'); scheduleNextMove(); }, 3000 + Math.random() * 3000);
                }
                return;
            }

            // Move to a target
            const target = getRandomTarget();
            if (target) {
                currentTarget = target;
                // Mostly walk (75%), sometimes jump (25%)
                if (Math.random() < 0.25) jumpToTarget(target);
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

            // Click: pet reacts calmly
            el.addEventListener('click', () => {
                if (isSleeping || spiderModeActive || isTransforming) return;
                if (moveInterval) { clearInterval(moveInterval); moveInterval = null; isMoving = false; }
                // Small jump reaction
                performJumpAnimation();
                // Then calmly walk to clicked element
                setTimeout(() => {
                    const target = targets.find(t => t.id === id);
                    if (target) setTimeout(() => moveToTarget(target), 1000);
                    else scheduleNextMove();
                }, 2000);
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
        if (isSleeping || spiderModeActive || isTransforming) return;
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

        startSpriteLoop('go');
        window.SpiderWebSystem.start(spriteImg);

        setTimeout(() => {
            spiderModeActive = false;
            setAnimation('idle');
        }, 30 * 60 * 1000);
    }

    function startSpiderModeChecker() {
        setInterval(checkSpiderMode, 2 * 60 * 1000);
    }

    // ===== SCROLL ANCHORING =====
    function setupScrollTracking() {
        function onScroll() {
            // Reposition pet on its anchor during scroll (unless moving)
            if (!currentAnchorEl || isMoving || spiderModeActive) return;
            const c = document.getElementById('roaming-pet-container');
            if (!c) return;
            const pos = getStableLandingPoint(currentAnchorEl);
            c.style.left = pos.x + 'px';
            c.style.top = pos.y + 'px';
        }

        window.addEventListener('scroll', onScroll, { passive: true });

        // Also handle slide-container scrolling
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.addEventListener('scroll', onScroll, { passive: true });

        // Also track resize
        window.addEventListener('resize', onScroll, { passive: true });
    }

    // ===== INIT =====
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        preloadFrames();
        const container = createPetHTML();

        // Start on top of a random element
        const startTargets = targets.filter(t => document.getElementById(t.id));
        const startTarget = startTargets[Math.floor(Math.random() * startTargets.length)];
        if (startTarget) {
            const el = document.getElementById(startTarget.id);
            const landing = getLandingPoint(el);
            container.style.left = landing.x + 'px';
            container.style.top = landing.y + 'px';
            currentAnchorEl = el;
        } else {
            container.style.left = (window.innerWidth / 2 - PET_SIZE / 2) + 'px';
            container.style.top = (window.innerHeight - 80) + 'px';
        }

        startSleepCycleChecker();
        startSpiderModeChecker();
        setupPageInteractions();
        setupScrollTracking();

        // Night check
        if (isNightTime()) {
            setAnimation('sleeping');
            isSleeping = true;
        } else {
            setAnimation('idle');

            // Calm start: just idle for a while, then move
            const initialDelay = 12000 + Math.random() * 10000;
            setTimeout(() => {
                if (!isSleeping && !isTransforming) {
                    moveToRandomTarget();
                }
            }, initialDelay);
        }

        console.log('[Roaming Pet] v4 initialized');
    }

    init();
})();
