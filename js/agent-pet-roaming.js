// ===== ROAMING AGENT PET MODULE (for index.html) =====
// v5 — Jumping spider: 4-edge walking, discrete rotation, spider jumps

(function() {
    console.log('[Roaming Pet] Initializing v5...');

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

    const TRANSFORM_HOLD_TIME = 15000;
    const PET_SIZE = 40;

    // ===== SPRITE ENGINE =====
    let spriteImg = null;
    let spriteState = 'stay';
    let spriteFrameIdx = 0;
    let spriteTimer = null;
    let isTransforming = false;

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

    function setFrame(src) {
        if (!spriteImg) return;
        spriteImg.src = src;
    }

    function startSpriteLoop(state) {
        if (isTransforming) return;
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

    // Transformation: forward -> hold 15s -> reverse -> callback
    function playTransformation(onComplete) {
        stopSpriteLoop();
        isTransforming = true;
        spriteState = 'transformation';

        const frames = FRAMES.transformation;
        const interval = TIMING.transformation;
        let idx = 0;

        setFrame(frames[0]);

        function nextForward() {
            idx++;
            if (idx >= frames.length) {
                idx = frames.length - 1;
                setFrame(frames[idx]);
                setTimeout(() => {
                    let rIdx = frames.length - 1;
                    function nextReverse() {
                        rIdx--;
                        if (rIdx < 0) {
                            isTransforming = false;
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
    let currentEdge = 'top';       // which edge pet is sitting on: top/right/bottom/left
    let currentRotation = 0;       // degrees: 0, 90, 180, 270

    // All interactive elements — pet can walk on ALL edges
    const targets = [
        { id: 'logo', name: 'logo', preferGrowing: true },
        { id: 'galleryBtn', name: 'gallery', preferGrowing: false },
        { id: 'streamBtn', name: 'stream', preferGrowing: false },
        { id: 'orderBtn', name: 'order', preferGrowing: false },
        { id: 'socialToggle', name: 'social', preferGrowing: false },
        { id: 'titleContainer', name: 'title', preferGrowing: true },
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
            width: ${PET_SIZE}px;
            height: ${PET_SIZE}px;
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
        return container;
    }

    // ===== DISCRETE ROTATION =====
    // Based on which edge the pet is on:
    // top = 0deg (normal), right = 90deg, bottom = 180deg (upside down), left = 270deg
    function setRotation(edge) {
        currentEdge = edge;
        const angles = { top: 0, right: 90, bottom: 180, left: 270 };
        currentRotation = angles[edge] || 0;

        if (!spriteImg) return;
        // Discrete snap — no transition
        spriteImg.style.transform = `rotate(${currentRotation}deg)`;
    }

    // ===== EDGE POSITION HELPERS =====
    // Get position for pet on a specific edge of an element
    function getEdgePosition(el, edge, progress) {
        // progress: 0..1 along the edge
        const rect = el.getBoundingClientRect();
        const m = 4; // margin from corners
        const overlap = 4; // slight overlap with element edge
        let x, y;

        switch (edge) {
            case 'top':
                x = rect.left + m + (rect.width - m * 2 - PET_SIZE) * progress;
                y = rect.top - PET_SIZE + overlap;
                break;
            case 'bottom':
                x = rect.left + m + (rect.width - m * 2 - PET_SIZE) * progress;
                y = rect.bottom - overlap;
                break;
            case 'right':
                x = rect.right - overlap;
                y = rect.top + m + (rect.height - m * 2 - PET_SIZE) * progress;
                break;
            case 'left':
                x = rect.left - PET_SIZE + overlap;
                y = rect.top + m + (rect.height - m * 2 - PET_SIZE) * progress;
                break;
        }

        // Clamp to viewport
        x = Math.max(0, Math.min(window.innerWidth - PET_SIZE, x));
        y = Math.max(0, Math.min(window.innerHeight - PET_SIZE, y));

        return { x, y };
    }

    // Get a random edge landing point on an element
    function getRandomEdgeLanding(el) {
        const edges = ['top', 'right', 'bottom', 'left'];
        const edge = edges[Math.floor(Math.random() * edges.length)];
        const progress = 0.2 + Math.random() * 0.6; // land somewhere in the middle 60%
        const pos = getEdgePosition(el, edge, progress);
        return { ...pos, edge, progress };
    }

    // Get stable position for scroll tracking (center of current edge)
    function getStableEdgePosition(el, edge) {
        const pos = getEdgePosition(el, edge, 0.5);
        return pos;
    }

    // ===== NIGHT TIME =====
    function isNightTime() {
        const hour = new Date().getHours();
        return hour >= 23 || hour < 7;
    }

    // ===== SET ANIMATION =====
    function setAnimation(animation) {
        if (spiderModeActive) return;
        if (isTransforming && animation !== 'idle') return;
        if (!spriteImg) return;

        if (animation === 'growing') {
            if (isTransforming) return;
            performGrowingAnimation();
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

    // ===== TRANSFORMATION =====
    function performGrowingAnimation() {
        if (!spriteImg || isTransforming) return;

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

        setTimeout(() => {
            if (!isSleeping) spiderJumpToRandomTarget();
        }, 3000 + Math.random() * 2000);
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

    // ===== WALK ALONG EDGE =====
    // Walk from current position along the current edge of the element
    function walkEdge(target, edge, onDone) {
        const container = document.getElementById('roaming-pet-container');
        const el = document.getElementById(target.id);
        if (!container || !el) { if (onDone) onDone(); return; }

        isMoving = true;
        setAnimation('walking');
        setRotation(edge);

        const rect = el.getBoundingClientRect();
        const m = 6;
        const overlap = 4;

        let startPos, endPos;

        // Walk from one end to the other (or partial)
        const startProgress = Math.random() < 0.5 ? 0.05 : 0.95;
        const endProgress = startProgress < 0.5 ? 0.95 : 0.05;

        startPos = getEdgePosition(el, edge, startProgress);
        endPos = getEdgePosition(el, edge, endProgress);

        container.style.left = startPos.x + 'px';
        container.style.top = startPos.y + 'px';

        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 4) { isMoving = false; if (onDone) onDone(); return; }

        const steps = Math.ceil(dist / 6);
        const sx = dx / steps;
        const sy = dy / steps;
        let step = 0;

        if (moveInterval) clearInterval(moveInterval);
        moveInterval = setInterval(() => {
            step++;
            if (step >= steps) {
                clearInterval(moveInterval);
                moveInterval = null;
                isMoving = false;
                container.style.left = endPos.x + 'px';
                container.style.top = endPos.y + 'px';
                currentAnchorEl = el;
                if (onDone) onDone();
                return;
            }
            container.style.left = (startPos.x + sx * step) + 'px';
            container.style.top = (startPos.y + sy * step) + 'px';
        }, 130);
    }

    // Walk around edges: walk one edge, maybe continue to next
    function walkAroundElement(target) {
        const edges = ['top', 'right', 'bottom', 'left'];
        const startEdge = edges[Math.floor(Math.random() * edges.length)];

        // Walk 1-3 edges
        const numEdges = 1 + Math.floor(Math.random() * 3);
        let edgeIdx = edges.indexOf(startEdge);
        let walked = 0;

        function walkNext() {
            if (walked >= numEdges) {
                // Done walking, idle
                setAnimation('idle');
                const holdTime = 3000 + Math.random() * 5000;
                setTimeout(() => scheduleNextMove(), holdTime);
                return;
            }

            const edge = edges[edgeIdx % edges.length];
            walked++;
            edgeIdx++;

            walkEdge(target, edge, () => {
                // Brief pause at corner before next edge
                setTimeout(walkNext, 200 + Math.random() * 300);
            });
        }

        walkNext();
    }

    // ===== SPIDER JUMP (main movement) =====
    // Jumping spider: crouch (1 sleep frame) -> arc flight (stay frames) -> land
    function spiderJumpTo(targetEl, landEdge, landProgress, onLand) {
        if (spiderModeActive || isTransforming) return;
        const container = document.getElementById('roaming-pet-container');
        if (!container || !targetEl) return;

        isMoving = true;

        const startX = parseFloat(container.style.left) || 0;
        const startY = parseFloat(container.style.top) || 0;
        const landing = getEdgePosition(targetEl, landEdge, landProgress);

        // Phase 1: Crouch (show 1 sleep frame for 200ms)
        stopSpriteLoop();
        setFrame(FRAMES.sleep[0]);

        setTimeout(() => {
            // Phase 2: Jump arc — stay frames in flight
            startSpriteLoop('stay');

            // Reset rotation during flight (upright in air)
            if (spriteImg) spriteImg.style.transform = 'rotate(0deg)';

            const dx = landing.x - startX;
            const dy = landing.y - startY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Discrete arc: N steps in a parabola
            const jumpSteps = Math.max(5, Math.ceil(dist / 30));
            const arcHeight = Math.min(80, dist * 0.3); // arc height proportional to distance
            let step = 0;

            if (moveInterval) clearInterval(moveInterval);
            moveInterval = setInterval(() => {
                step++;
                if (step > jumpSteps) {
                    clearInterval(moveInterval);
                    moveInterval = null;

                    // Phase 3: Land — snap to edge position and rotate
                    container.style.left = landing.x + 'px';
                    container.style.top = landing.y + 'px';
                    setRotation(landEdge);
                    isMoving = false;
                    currentAnchorEl = targetEl;
                    currentEdge = landEdge;

                    setAnimation('idle');
                    if (onLand) onLand();
                    return;
                }

                // Parabolic arc: t goes 0..1
                const t = step / jumpSteps;
                const x = startX + dx * t;
                // Parabola: -4 * arcHeight * t * (t - 1) peaks at t=0.5
                const arcY = -4 * arcHeight * t * (t - 1);
                const y = startY + dy * t - arcY;

                container.style.left = Math.round(x) + 'px';
                container.style.top = Math.round(y) + 'px';
            }, 60); // discrete steps, fast enough to look snappy

        }, 200); // crouch duration
    }

    function spiderJumpToTarget(target) {
        const el = document.getElementById(target.id);
        if (!el) return;

        const edges = ['top', 'right', 'bottom', 'left'];
        const edge = edges[Math.floor(Math.random() * edges.length)];
        const progress = 0.2 + Math.random() * 0.6;

        spiderJumpTo(el, edge, progress, () => {
            decideTargetAction(target);
        });
    }

    function spiderJumpToRandomTarget() {
        const target = getRandomTarget();
        if (target) {
            currentTarget = target;
            spiderJumpToTarget(target);
        } else {
            scheduleNextMove();
        }
    }

    // ===== DECIDE ACTION AT TARGET =====
    function decideTargetAction(target) {
        currentAnchorEl = document.getElementById(target.id) || null;

        // 25% chance to transform at preferred spots
        if (target.preferGrowing && Math.random() < 0.25) {
            setAnimation('growing');
            return;
        }

        // 50% chance to walk around the element edges
        if (Math.random() < 0.5) {
            setTimeout(() => walkAroundElement(target), 600);
            return;
        }

        // Otherwise idle, then move on
        setAnimation('idle');
        const holdTime = 3000 + Math.random() * 5000;
        setTimeout(() => scheduleNextMove(), holdTime);
    }

    // ===== SCHEDULE MOVEMENT =====
    function scheduleNextMove() {
        if (isMoving || isSleeping || spiderModeActive || isTransforming) return;

        // 8-30 seconds between moves (more active than v4)
        const delay = 8000 + Math.random() * 22000;
        console.log('[Roaming Pet] Next move in', Math.floor(delay / 1000), 's');

        setTimeout(() => {
            if (isSleeping || isTransforming) return;

            // 15% chance for in-place action
            if (Math.random() < 0.15) {
                const anims = ['idle', 'growing'];
                const anim = anims[Math.floor(Math.random() * anims.length)];
                setAnimation(anim);
                if (anim !== 'growing') {
                    setTimeout(() => { setAnimation('idle'); scheduleNextMove(); }, 2000 + Math.random() * 3000);
                }
                return;
            }

            // Jump to a new target (spider jump is the primary movement!)
            spiderJumpToRandomTarget();
        }, delay);
    }

    // ===== PAGE INTERACTIONS =====
    function setupPageInteractions() {
        const ids = targets.map(t => t.id);
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            el.addEventListener('click', () => {
                if (isSleeping || spiderModeActive || isTransforming) return;
                if (moveInterval) { clearInterval(moveInterval); moveInterval = null; isMoving = false; }

                // Spider reacts: jump to clicked element
                const target = targets.find(t => t.id === id);
                if (target) {
                    setTimeout(() => spiderJumpToTarget(target), 300);
                }
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

        setRotation('top'); // reset rotation for spider mode
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
            if (!currentAnchorEl || isMoving || spiderModeActive) return;
            const c = document.getElementById('roaming-pet-container');
            if (!c) return;

            // Use stable edge position (center of current edge)
            const pos = getStableEdgePosition(currentAnchorEl, currentEdge);

            // Clamp to viewport (fixes bottom-of-page sliding)
            const clampedX = Math.max(0, Math.min(window.innerWidth - PET_SIZE, pos.x));
            const clampedY = Math.max(0, Math.min(window.innerHeight - PET_SIZE, pos.y));

            c.style.left = clampedX + 'px';
            c.style.top = clampedY + 'px';
        }

        window.addEventListener('scroll', onScroll, { passive: true });

        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.addEventListener('scroll', onScroll, { passive: true });

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

        // Start on a random edge of a random element
        const startTargets = targets.filter(t => document.getElementById(t.id));
        const startTarget = startTargets[Math.floor(Math.random() * startTargets.length)];
        if (startTarget) {
            const el = document.getElementById(startTarget.id);
            const landing = getRandomEdgeLanding(el);
            container.style.left = landing.x + 'px';
            container.style.top = landing.y + 'px';
            currentAnchorEl = el;
            currentEdge = landing.edge;
            setRotation(landing.edge);
        } else {
            container.style.left = (window.innerWidth / 2 - PET_SIZE / 2) + 'px';
            container.style.top = (window.innerHeight - 80) + 'px';
        }

        startSleepCycleChecker();
        startSpiderModeChecker();
        setupPageInteractions();
        setupScrollTracking();

        if (isNightTime()) {
            setAnimation('sleeping');
            isSleeping = true;
        } else {
            setAnimation('idle');

            // First move: jump after 6-14s
            const initialDelay = 6000 + Math.random() * 8000;
            setTimeout(() => {
                if (!isSleeping && !isTransforming) {
                    spiderJumpToRandomTarget();
                }
            }, initialDelay);
        }

        console.log('[Roaming Pet] v5 initialized');
    }

    init();
})();
