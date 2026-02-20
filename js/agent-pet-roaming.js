// ===== ROAMING AGENT PET MODULE (for index.html) =====

(function() {
    console.log('[Roaming Pet] Initializing...');

    // Pet state
    let currentAnimation = 'idle';
    let currentTarget = null;
    let isMoving = false;
    let moveInterval = null;
    let isSleeping = false;

    // Current element the pet is anchored to (for scroll tracking)
    let currentAnchorEl = null;

    // Movement targets on index.html
    const targets = [
        { id: 'logo', name: 'logo', animations: ['playing', 'idle', 'waving', 'growing'], walkEdges: false, preferGrowing: true },
        { id: 'galleryBtn', name: 'gallery', animations: ['waving', 'idle', 'playing', 'waving'], walkEdges: true, preferGrowing: false },
        { id: 'streamBtn', name: 'stream', animations: ['waving', 'idle', 'playing', 'waving'], walkEdges: true, preferGrowing: false },
        { id: 'orderBtn', name: 'order', animations: ['waving', 'idle', 'playing', 'waving'], walkEdges: true, preferGrowing: false },
        { id: 'socialToggle', name: 'social', animations: ['waving', 'idle', 'waving'], walkEdges: true, preferGrowing: false },
        { id: 'titleContainer', name: 'title', animations: ['idle', 'waving', 'growing', 'waving'], walkEdges: false, preferGrowing: true }
    ];

    // Spider mode state
    let spiderModeActive = false;
    let lastSpiderModeTime = 0;
    const SPIDER_MODE_COOLDOWN = 10 * 60 * 1000; // 10 minutes between spider sessions

    // Create pet HTML structure (8x4 body, 3px pixels)
    function createPetHTML() {
        const container = document.createElement('div');
        container.id = 'roaming-pet-container';
        container.className = 'roaming-pet-container';

        container.innerHTML = `
            <div class="roaming-pet active idle" id="roaming-pet">
                <div class="roaming-pet-body-container">
                    <!-- Antenna pixels (hidden by default) -->
                    <div class="roaming-pet-antenna roaming-pixel body"></div>
                    <div class="roaming-pet-arms">
                        <div class="roaming-pixel arm"></div>
                        <div class="roaming-pet-body">
                            <!-- Row 1: Top of body -->
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>

                            <!-- Row 2: Eyes row -->
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel eye"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel eye"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>

                            <!-- Row 3: Middle body -->
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>

                            <!-- Row 4: Bottom -->
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                            <div class="roaming-pixel body"></div>
                        </div>
                        <div class="roaming-pixel arm"></div>
                    </div>
                </div>

                <!-- Legs (4 visible legs + 4 spacers for animation) -->
                <div class="roaming-pet-legs">
                    <div class="roaming-pixel leg"></div>
                    <div class="roaming-pixel leg"></div>
                    <div class="roaming-pixel leg"></div>
                    <div class="roaming-pixel leg"></div>
                    <div class="roaming-pixel leg"></div>
                    <div class="roaming-pixel leg"></div>
                    <div class="roaming-pixel leg"></div>
                    <div class="roaming-pixel leg"></div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        console.log('[Roaming Pet] HTML created');
        return container;
    }

    // Check if it's night time (11 PM - 7 AM)
    function isNightTime() {
        const hour = new Date().getHours();
        return hour >= 23 || hour < 7;
    }

    // Set animation
    function setAnimation(animation) {
        // Block all animations during spider mode
        if (spiderModeActive) return;

        const pet = document.getElementById('roaming-pet');
        if (!pet) return;

        // Special handling for growing animation
        if (animation === 'growing') {
            performGrowingAnimation();
            return;
        }

        // Special handling for jumping animation
        if (animation === 'jumping') {
            performJumpAnimation();
            return;
        }

        // Remove all animation classes
        pet.classList.remove('idle', 'walking', 'waving', 'blinking', 'playing', 'sleeping', 'growing', 'shrinking', 'jumping', 'dancing');

        // Remove state classes
        pet.classList.remove('active', 'sleeping');

        // Add state class based on animation
        if (animation === 'sleeping') {
            pet.classList.add('sleeping');
        } else {
            pet.classList.add('active');
        }

        // Add new animation
        pet.classList.add(animation);
        currentAnimation = animation;

        console.log('[Roaming Pet] Animation:', animation);
    }

    // Perform jump animation (single jump)
    function performJumpAnimation() {
        const pet = document.getElementById('roaming-pet');
        if (!pet) return;

        console.log('[Roaming Pet] Jumping!');

        // Remove other animations
        pet.classList.remove('idle', 'walking', 'waving', 'blinking', 'playing', 'sleeping', 'growing', 'shrinking', 'dancing');

        // Add jumping
        pet.classList.add('jumping');
        currentAnimation = 'jumping';

        // After jump completes (500ms), return to idle
        setTimeout(() => {
            pet.classList.remove('jumping');
            setAnimation('idle');
        }, 500);
    }

    // ===== PERSISTENT FLOWER GROWTH SYSTEM =====
    let flowerGrowthStage = 0; // 0=seed, 1-4=growing, 5=bloom, 6-13=sway variants
    let flowerGrowthStartTime = 0;
    let flowerSwayInterval = null;
    const FLOWER_BLOOM_DURATION = 180000; // 3 minutes bloom time

    // Load flower state from localStorage
    function loadFlowerState() {
        try {
            const saved = localStorage.getItem('roaming-pet-flower-state');
            if (saved) {
                const state = JSON.parse(saved);
                flowerGrowthStage = state.stage || 0;
                flowerGrowthStartTime = state.startTime || 0;

                // Check if bloom time expired
                const elapsed = Date.now() - flowerGrowthStartTime;
                if (flowerGrowthStage >= 5 && elapsed > FLOWER_BLOOM_DURATION) {
                    // Bloom expired, reset to seed
                    flowerGrowthStage = 0;
                    flowerGrowthStartTime = 0;
                    saveFlowerState();
                }

                console.log('[Roaming Pet] Loaded flower state - stage:', flowerGrowthStage);
                return true;
            }
        } catch (e) {
            console.error('[Roaming Pet] Failed to load flower state:', e);
        }
        return false;
    }

    // Save flower state to localStorage
    function saveFlowerState() {
        try {
            localStorage.setItem('roaming-pet-flower-state', JSON.stringify({
                stage: flowerGrowthStage,
                startTime: flowerGrowthStartTime
            }));
        } catch (e) {
            console.error('[Roaming Pet] Failed to save flower state:', e);
        }
    }

    // Perform growing animation sequence (progressive stages with persistence)
    function performGrowingAnimation() {
        const pet = document.getElementById('roaming-pet');
        if (!pet) return;

        console.log('[Roaming Pet] Starting flower growth cycle - current stage:', flowerGrowthStage);

        // Remove other animations
        pet.classList.remove('idle', 'walking', 'waving', 'blinking', 'playing', 'sleeping', 'shrinking', 'dancing');

        // If already in bloom, just continue swaying
        if (flowerGrowthStage >= 5) {
            console.log('[Roaming Pet] Already blooming - resuming sway');
            applyFlowerStage(5);
            startFlowerSway();
            return;
        }

        // Start from current stage and grow progressively
        flowerGrowthStartTime = Date.now();
        saveFlowerState();
        growToNextFlowerStage();
    }

    function growToNextFlowerStage() {
        const pet = document.getElementById('roaming-pet');
        if (!pet) return;

        if (flowerGrowthStage >= 5) {
            // Reached full bloom
            console.log('[Roaming Pet] Full bloom reached!');
            applyFlowerStage(5);
            saveFlowerState();
            startFlowerSway();

            // After 3 minutes, reset to seed for next cycle
            setTimeout(() => {
                console.log('[Roaming Pet] Bloom cycle complete - resetting to seed');
                flowerGrowthStage = 0;
                flowerGrowthStartTime = 0;
                saveFlowerState();
                if (flowerSwayInterval) {
                    clearInterval(flowerSwayInterval);
                    flowerSwayInterval = null;
                }
                pet.classList.remove('growing', 'flower-bloom', 'flower-sway');
                setAnimation('idle');
            }, FLOWER_BLOOM_DURATION);
            return;
        }

        // Apply current stage
        applyFlowerStage(flowerGrowthStage);
        console.log('[Roaming Pet] Growth stage:', flowerGrowthStage);

        // Schedule next stage
        const stageDuration = [800, 800, 1000, 1200, 1500][flowerGrowthStage] || 1000;
        setTimeout(() => {
            flowerGrowthStage++;
            saveFlowerState();
            growToNextFlowerStage();
        }, stageDuration);
    }

    function applyFlowerStage(stage) {
        const pet = document.getElementById('roaming-pet');
        if (!pet) return;

        pet.classList.remove('flower-stage-0', 'flower-stage-1', 'flower-stage-2', 'flower-stage-3', 'flower-stage-4', 'flower-bloom');

        if (stage < 5) {
            pet.classList.add('growing', 'flower-stage-' + stage);
        } else {
            pet.classList.add('growing', 'flower-bloom');
        }
    }

    function startFlowerSway() {
        const pet = document.getElementById('roaming-pet');
        if (!pet || flowerSwayInterval) return;

        pet.classList.add('flower-sway');

        let swayStep = 0;
        flowerSwayInterval = setInterval(() => {
            // Remove all sway classes
            for (let i = 0; i < 8; i++) {
                pet.classList.remove('flower-sway-' + i);
            }
            // Add current sway
            pet.classList.add('flower-sway-' + swayStep);
            swayStep = (swayStep + 1) % 8;
        }, 500);

        console.log('[Roaming Pet] Wind sway started');
    }

    // Go to sleep (transform into flower first)
    function goToSleep() {
        if (isSleeping) return;

        console.log('[Roaming Pet] Going to sleep - transforming into flower...');
        isSleeping = true;

        // Stop any movement
        if (moveInterval) {
            clearInterval(moveInterval);
            moveInterval = null;
        }
        isMoving = false;

        // First transform into flower (growing animation)
        const pet = document.getElementById('roaming-pet');
        if (!pet) return;

        // Start growing animation
        pet.classList.remove('idle', 'walking', 'waving', 'blinking', 'playing', 'sleeping', 'shrinking', 'dancing');
        pet.classList.add('active'); // Keep active state during growth
        pet.classList.add('growing');
        currentAnimation = 'growing';

        console.log('[Roaming Pet] Growing into flower form...');

        // After growing completes (3s), switch to sleeping state but keep flower form
        setTimeout(() => {
            console.log('[Roaming Pet] Fully grown flower - entering sleep state');

            // Now transition to sleeping state (green color) but maintain flower form
            pet.classList.remove('active');
            pet.classList.add('sleeping');
            // Keep 'growing' class to maintain the visual flower form with extended body/arms/antenna

            // Don't shrink back - stay in flower form throughout sleep
        }, 3000);
    }

    // Wake up (shrink back from flower form)
    function wakeUp() {
        if (!isSleeping) return;

        console.log('[Roaming Pet] Waking up - shrinking from flower form...');
        isSleeping = false;

        const pet = document.getElementById('roaming-pet');
        if (!pet) return;

        // Start shrinking animation to return to normal form
        pet.classList.remove('sleeping', 'growing');
        pet.classList.add('active'); // Active state during shrinking
        pet.classList.add('shrinking');
        currentAnimation = 'shrinking';

        console.log('[Roaming Pet] Shrinking back to normal form...');

        // After shrinking completes (2s), perform random wake-up behavior
        setTimeout(() => {
            pet.classList.remove('shrinking');
            console.log('[Roaming Pet] Wake up complete!');

            // Random autonomous behavior after waking up
            const wakeUpBehaviors = [
                () => {
                    // Immediately run to a random target
                    console.log('[Roaming Pet] Energetic wake-up - running to explore!');
                    moveToRandomTarget();
                },
                () => {
                    // Jump excitedly
                    console.log('[Roaming Pet] Excited wake-up - jumping!');
                    performJumpAnimation();
                    setTimeout(() => moveToRandomTarget(), 1000);
                },
                () => {
                    // Start playing with pixel immediately
                    console.log('[Roaming Pet] Playful wake-up - playing with pixel!');
                    setAnimation('playing');
                    setTimeout(() => moveToRandomTarget(), 3000);
                },
                () => {
                    // Wave and then move
                    console.log('[Roaming Pet] Friendly wake-up - waving!');
                    setAnimation('waving');
                    setTimeout(() => moveToRandomTarget(), 2000);
                },
                () => {
                    // Calm wake-up - idle then move
                    console.log('[Roaming Pet] Calm wake-up - stretching...');
                    setAnimation('idle');
                    setTimeout(() => moveToRandomTarget(), 1500);
                }
            ];

            // Pick random behavior
            const behavior = wakeUpBehaviors[Math.floor(Math.random() * wakeUpBehaviors.length)];
            behavior();
        }, 2000);
    }

    // Check sleep/wake cycle
    function checkSleepCycle() {
        const shouldSleep = isNightTime();

        if (shouldSleep && !isSleeping) {
            goToSleep();
        } else if (!shouldSleep && isSleeping) {
            wakeUp();
        }
    }

    // Get random animation from target's animations
    function getRandomAnimation(target) {
        if (!target.animations || target.animations.length === 0) {
            return 'idle';
        }
        return target.animations[Math.floor(Math.random() * target.animations.length)];
    }

    // Get random target
    function getRandomTarget() {
        // Filter available targets (elements that exist on page)
        const availableTargets = targets.filter(t => {
            const el = document.getElementById(t.id);
            return el !== null;
        });

        if (availableTargets.length === 0) {
            console.log('[Roaming Pet] No targets available');
            return null;
        }

        // Pick random target
        const target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
        console.log('[Roaming Pet] Selected target:', target.name);
        return target;
    }

    // Walk along all 4 edges of element sequentially
    function walkAllEdges(target) {
        const container = document.getElementById('roaming-pet-container');
        const targetElement = document.getElementById(target.id);

        if (!container || !targetElement || !target.walkEdges) {
            console.log('[Roaming Pet] Cannot walk edges');
            return;
        }

        console.log('[Roaming Pet] Walking all edges of', target.name);

        isMoving = true;
        setAnimation('walking');

        const targetRect = targetElement.getBoundingClientRect();
        const margin = 10;

        // Define all 4 edges in sequence: top -> right -> bottom -> left
        const edgePath = [
            { name: 'top', startX: targetRect.left + margin, startY: targetRect.top - margin, endX: targetRect.right - margin, endY: targetRect.top - margin },
            { name: 'right', startX: targetRect.right + margin, startY: targetRect.top + margin, endX: targetRect.right + margin, endY: targetRect.bottom - margin },
            { name: 'bottom', startX: targetRect.right - margin, startY: targetRect.bottom + margin, endX: targetRect.left + margin, endY: targetRect.bottom + margin },
            { name: 'left', startX: targetRect.left - margin, startY: targetRect.bottom - margin, endX: targetRect.left - margin, endY: targetRect.top + margin }
        ];

        let currentEdgeIndex = 0;

        function walkNextEdge() {
            if (currentEdgeIndex >= edgePath.length) {
                // Finished all edges
                isMoving = false;

                // Do random animation
                const randomAnim = getRandomAnimation(target);
                setAnimation(randomAnim);

                // Hold for 2-5 seconds
                const holdTime = 2000 + Math.random() * 3000;
                setTimeout(() => {
                    setAnimation('idle');
                    scheduleNextMove();
                }, holdTime);

                return;
            }

            const edge = edgePath[currentEdgeIndex];
            console.log('[Roaming Pet] Walking', edge.name, 'edge');

            const startX = edge.startX;
            const startY = edge.startY;
            const endX = edge.endX;
            const endY = edge.endY;

            // Move to start of edge
            container.style.left = startX + 'px';
            container.style.top = startY + 'px';

            // Walk along edge
            setTimeout(() => {
                const deltaX = endX - startX;
                const deltaY = endY - startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                const stepSize = 12;
                const numSteps = Math.ceil(distance / stepSize);
                const stepX = deltaX / numSteps;
                const stepY = deltaY / numSteps;

                let currentStep = 0;

                if (moveInterval) {
                    clearInterval(moveInterval);
                }

                moveInterval = setInterval(() => {
                    if (currentStep >= numSteps) {
                        clearInterval(moveInterval);
                        moveInterval = null;

                        // Move to next edge
                        currentEdgeIndex++;
                        setTimeout(walkNextEdge, 100);
                        return;
                    }

                    const newX = startX + stepX * (currentStep + 1);
                    const newY = startY + stepY * (currentStep + 1);

                    container.style.left = newX + 'px';
                    container.style.top = newY + 'px';

                    currentStep++;
                }, 125); // 8 fps
            }, 100);
        }

        // Start walking first edge
        walkNextEdge();
    }

    // Walk along single random edge of element
    function walkSingleEdge(target) {
        const container = document.getElementById('roaming-pet-container');
        const targetElement = document.getElementById(target.id);

        if (!container || !targetElement || !target.walkEdges) {
            console.log('[Roaming Pet] Cannot walk edge');
            return;
        }

        isMoving = true;
        setAnimation('walking');

        const targetRect = targetElement.getBoundingClientRect();

        // Pick random edge: top, right, bottom, left
        const edges = ['top', 'right', 'bottom', 'left'];
        const edge = edges[Math.floor(Math.random() * edges.length)];

        console.log('[Roaming Pet] Walking along', edge, 'edge of', target.name);

        let startX, startY, endX, endY;
        const margin = 10; // Distance from edge

        // Define start and end points for edge
        if (edge === 'top') {
            startX = targetRect.left + margin;
            startY = targetRect.top - margin;
            endX = targetRect.right - margin;
            endY = targetRect.top - margin;
        } else if (edge === 'right') {
            startX = targetRect.right + margin;
            startY = targetRect.top + margin;
            endX = targetRect.right + margin;
            endY = targetRect.bottom - margin;
        } else if (edge === 'bottom') {
            startX = targetRect.right - margin;
            startY = targetRect.bottom + margin;
            endX = targetRect.left + margin;
            endY = targetRect.bottom + margin;
        } else { // left
            startX = targetRect.left - margin;
            startY = targetRect.bottom - margin;
            endX = targetRect.left - margin;
            endY = targetRect.top + margin;
        }

        // Move to start of edge first
        container.style.left = startX + 'px';
        container.style.top = startY + 'px';

        // Then walk along edge
        setTimeout(() => {
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            const stepSize = 12;
            const numSteps = Math.ceil(distance / stepSize);
            const stepX = deltaX / numSteps;
            const stepY = deltaY / numSteps;

            let currentStep = 0;

            if (moveInterval) {
                clearInterval(moveInterval);
            }

            moveInterval = setInterval(() => {
                if (currentStep >= numSteps) {
                    clearInterval(moveInterval);
                    moveInterval = null;
                    isMoving = false;

                    // Do random animation at end
                    const randomAnim = getRandomAnimation(target);
                    setAnimation(randomAnim);

                    // Hold for 2-5 seconds
                    const holdTime = 2000 + Math.random() * 3000;
                    setTimeout(() => {
                        setAnimation('idle');
                        scheduleNextMove();
                    }, holdTime);

                    return;
                }

                const newX = startX + stepX * (currentStep + 1);
                const newY = startY + stepY * (currentStep + 1);

                container.style.left = newX + 'px';
                container.style.top = newY + 'px';

                currentStep++;
            }, 125); // 8 fps
        }, 100);
    }

    // Jump to target with discrete arc jumps
    function jumpToTarget(target) {
        // Block movement during spider mode
        if (spiderModeActive) return;

        const container = document.getElementById('roaming-pet-container');
        const targetElement = document.getElementById(target.id);

        if (!container || !targetElement) {
            console.log('[Roaming Pet] Cannot jump - missing elements');
            return;
        }

        isMoving = true;

        const containerRect = container.getBoundingClientRect();
        const currentX = parseFloat(container.style.left) || containerRect.left;
        const currentY = parseFloat(container.style.top)  || containerRect.top;

        // Land on top of the target element
        const landing = getLandingPoint(targetElement);
        const targetX = landing.x;
        const targetY = landing.y;

        console.log('[Roaming Pet] Jumping from', Math.round(currentX), Math.round(currentY),
                    'to', Math.round(targetX), Math.round(targetY), '(on top of', target.name, ')');

        // Calculate distance and number of jumps (60-80px per jump)
        const deltaX = targetX - currentX;
        const deltaY = targetY - currentY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        const jumpDistance = 60 + Math.random() * 20;
        const numJumps = Math.ceil(distance / jumpDistance);
        const jumpX = deltaX / numJumps;
        const jumpY = deltaY / numJumps;

        let currentJump = 0;

        function performNextJump() {
            if (currentJump >= numJumps) {
                // Reached target
                isMoving = false;
                console.log('[Roaming Pet] Reached target:', target.name);

                // Decide what to do at target
                decideTargetAction(target);
                return;
            }

            // Trigger jump animation
            setAnimation('jumping');

            // Move to next position during jump (discrete)
            const newX = currentX + jumpX * (currentJump + 1);
            const newY = currentY + jumpY * (currentJump + 1);

            container.style.left = newX + 'px';
            container.style.top = newY + 'px';

            currentJump++;

            // Wait for jump to complete (500ms) then do next jump
            setTimeout(performNextJump, 600);
        }

        // Start first jump
        performNextJump();
    }

    // Get the "landing point" on top of an element (pet sits on its top edge)
    // Returns {x, y} in viewport coords (for fixed positioning)
    function getLandingPoint(el) {
        const rect = el.getBoundingClientRect();
        const petW = 30; // approximate pet width
        const petH = 28; // approximate pet height
        // Pet lands centered on element top edge with small random offset
        const offsetX = (Math.random() - 0.5) * Math.min(rect.width * 0.5, 60);
        const x = Math.max(4, Math.min(
            window.innerWidth - petW - 4,
            rect.left + rect.width / 2 + offsetX - petW / 2
        ));
        // Sit on the top surface of the element
        const y = Math.max(4, rect.top - petH);
        return { x, y };
    }

    // Move to target walking along element surfaces (2-phase: horizontal then vertical)
    function moveToTarget(target) {
        // Block movement during spider mode
        if (spiderModeActive) return;

        const container = document.getElementById('roaming-pet-container');
        const targetElement = document.getElementById(target.id);

        if (!container || !targetElement) {
            console.log('[Roaming Pet] Cannot move - missing elements');
            return;
        }

        isMoving = true;
        setAnimation('walking');

        const containerRect = container.getBoundingClientRect();
        const startX = parseFloat(container.style.left) || containerRect.left;
        const startY = parseFloat(container.style.top) || containerRect.top;

        // Land on top of the target element
        const landing = getLandingPoint(targetElement);
        const endX = landing.x;
        const endY = landing.y;

        console.log('[Roaming Pet] Walking from', Math.round(startX), Math.round(startY),
                    'to', Math.round(endX), Math.round(endY), '(on top of', target.name, ')');

        // Clear any existing movement
        if (moveInterval) {
            clearInterval(moveInterval);
            moveInterval = null;
        }

        // Helper: animate from (x1,y1) to (x2,y2), then call onDone
        function animateSegment(x1, y1, x2, y2, onDone) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 2) { onDone(); return; }

            const stepSize = 10;
            const steps = Math.ceil(dist / stepSize);
            const sx = dx / steps;
            const sy = dy / steps;
            let step = 0;

            moveInterval = setInterval(() => {
                step++;
                container.style.left = (x1 + sx * step) + 'px';
                container.style.top  = (y1 + sy * step) + 'px';
                if (step >= steps) {
                    clearInterval(moveInterval);
                    moveInterval = null;
                    onDone();
                }
            }, 100); // ~10fps
        }

        // 2-phase movement: walk horizontally first, then vertically (like a platform game)
        // Phase 1: move horizontally at current Y
        // Phase 2: move vertically to target Y
        animateSegment(startX, startY, endX, startY, () => {
            if (!isMoving) return; // aborted
            animateSegment(endX, startY, endX, endY, () => {
                isMoving = false;
                console.log('[Roaming Pet] Reached target:', target.name);
                decideTargetAction(target);
            });
        });
    }

    // Decide what action to perform at target
    function decideTargetAction(target) {
        // Track which element the pet is now anchored to
        currentAnchorEl = document.getElementById(target.id) || null;

        // Priority for growing on logo/title
        if (target.preferGrowing && Math.random() < 0.7) {
            // 70% chance to grow on logo/title
            console.log('[Roaming Pet] Growing at', target.name);
            setAnimation('growing');
            // Growing animation handles its own completion
            return;
        }

        // Edge walking on buttons
        if (target.walkEdges) {
            const rand = Math.random();
            if (rand < 0.4) {
                // 40% chance to walk all 4 edges
                console.log('[Roaming Pet] Walking all edges');
                setTimeout(() => {
                    walkAllEdges(target);
                }, 500);
                return;
            } else if (rand < 0.7) {
                // 30% chance to walk single edge
                console.log('[Roaming Pet] Walking single edge');
                setTimeout(() => {
                    walkSingleEdge(target);
                }, 500);
                return;
            }
        }

        // Otherwise do random animation
        const randomAnim = getRandomAnimation(target);
        setAnimation(randomAnim);

        // Hold animation for 2-5 seconds
        const holdTime = 2000 + Math.random() * 3000;
        setTimeout(() => {
            setAnimation('idle');
            scheduleNextMove();
        }, holdTime);
    }

    // Schedule next movement
    function scheduleNextMove() {
        if (isMoving || isSleeping || spiderModeActive) return;

        // Random delay: 8-40 seconds (was 30-180, now much more lively)
        const delay = 8000 + Math.random() * 32000;
        console.log('[Roaming Pet] Next move in', Math.floor(delay / 1000), 'seconds');

        setTimeout(() => {
            // Check if still awake
            if (isSleeping) return;

            // 35% chance to just do animation without moving (was 20%)
            if (Math.random() < 0.35) {
                console.log('[Roaming Pet] Doing animation in place');
                const randomAnims = ['waving', 'blinking', 'dancing', 'growing', 'playing', 'jumping'];
                const anim = randomAnims[Math.floor(Math.random() * randomAnims.length)];
                setAnimation(anim);

                // Hold for 2-4 seconds then return to idle
                setTimeout(() => {
                    setAnimation('idle');
                    scheduleNextMove();
                }, 2000 + Math.random() * 2000);
                return;
            }

            const target = getRandomTarget();
            if (target) {
                currentTarget = target;

                // 40% chance to jump, 60% to walk
                if (Math.random() < 0.4) {
                    jumpToTarget(target);
                } else {
                    moveToTarget(target);
                }
            } else {
                // No targets, try again later
                scheduleNextMove();
            }
        }, delay);
    }

    // Random blinking
    function startBlinking() {
        setInterval(() => {
            if (currentAnimation === 'idle' && !isMoving && !isSleeping) {
                // 20% chance to blink
                if (Math.random() < 0.2) {
                    const pet = document.getElementById('roaming-pet');
                    if (pet) {
                        pet.classList.add('blinking');
                        setTimeout(() => {
                            pet.classList.remove('blinking');
                        }, 300);
                    }
                }
            }
        }, 5000);
    }

    // React to user interacting with page elements (hover & click)
    function setupPageInteractions() {
        // Target elements to react to
        const interactiveIds = ['logo', 'galleryBtn', 'streamBtn', 'orderBtn', 'socialToggle', 'titleContainer'];

        interactiveIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            // On hover: pet reacts if close enough or randomly
            el.addEventListener('mouseenter', () => {
                if (isSleeping || spiderModeActive || isMoving) return;
                // 50% chance to react
                if (Math.random() < 0.5) {
                    const reactions = ['waving', 'blinking', 'playing'];
                    const anim = reactions[Math.floor(Math.random() * reactions.length)];
                    setAnimation(anim);
                    setTimeout(() => {
                        if (!isMoving) setAnimation('idle');
                    }, 1200 + Math.random() * 800);
                }
            });

            // On click: pet always reacts with excitement
            el.addEventListener('click', () => {
                if (isSleeping || spiderModeActive) return;
                // Cancel current movement and react
                if (moveInterval) {
                    clearInterval(moveInterval);
                    moveInterval = null;
                    isMoving = false;
                }
                // Jump or wave excitedly
                const reactions = ['jumping', 'waving', 'dancing'];
                const anim = reactions[Math.floor(Math.random() * reactions.length)];
                setAnimation(anim);
                setTimeout(() => {
                    setAnimation('idle');
                    // Then move toward the clicked element
                    const target = targets.find(t => t.id === id);
                    if (target) {
                        setTimeout(() => moveToTarget(target), 500);
                    } else {
                        scheduleNextMove();
                    }
                }, 1500);
            });
        });

        console.log('[Roaming Pet] Page interactions set up');
    }

    // Check sleep cycle every 5 minutes
    function startSleepCycleChecker() {
        // Check immediately
        checkSleepCycle();

        // Then check every 5 minutes
        setInterval(checkSleepCycle, 5 * 60 * 1000);

        console.log('[Roaming Pet] Sleep cycle checker started');
    }

    // Check if it's time for spider mode
    function checkSpiderMode() {
        if (isSleeping || spiderModeActive) return;

        const now = Date.now();
        const timeSinceLastSpider = now - lastSpiderModeTime;

        // 20% chance to enter spider mode if cooldown passed
        if (timeSinceLastSpider > SPIDER_MODE_COOLDOWN && Math.random() < 0.2) {
            console.log('[Roaming Pet] Entering spider mode!');
            enterSpiderMode();
        }
    }

    function enterSpiderMode() {
        if (!window.SpiderWebSystem) {
            console.error('[Roaming Pet] Spider web system not loaded!');
            return;
        }

        spiderModeActive = true;
        lastSpiderModeTime = Date.now();

        // Stop all movement
        if (moveInterval) {
            clearInterval(moveInterval);
            moveInterval = null;
        }
        isMoving = false;

        const pet = document.getElementById('roaming-pet');

        // Keep green color, add spider form
        pet.classList.remove('active');
        pet.classList.add('spider-form');

        window.SpiderWebSystem.start(pet);

        // Spider mode lasts 30 minutes, then auto-ends
        setTimeout(() => {
            spiderModeActive = false;
            pet.classList.remove('spider-form');
            pet.classList.add('active');
            console.log('[Roaming Pet] Spider mode ended, resuming normal behavior');
        }, 30 * 60 * 1000);
    }

    // Start spider mode checker
    function startSpiderModeChecker() {
        // Check every 2 minutes if it's time for spider mode
        setInterval(checkSpiderMode, 2 * 60 * 1000);
        console.log('[Roaming Pet] Spider mode checker started');
    }

    // Perform random instant action (for page load)
    function performRandomInstantAction() {
        // Block during spider mode
        if (spiderModeActive) return;

        console.log('[Roaming Pet] Performing random instant action on page load!');

        // Possible instant actions
        const actions = [
            'waving',
            'playing',
            'dancing',
            'jumping',
            'growing',
            'blinking'
        ];

        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        console.log('[Roaming Pet] Instant action:', randomAction);

        setAnimation(randomAction);

        // Hold for 3-5 seconds, then return to idle
        const holdTime = 3000 + Math.random() * 2000;
        setTimeout(() => {
            setAnimation('idle');
            console.log('[Roaming Pet] Instant action complete, returned to idle');
        }, holdTime);
    }

    // Initialize pet when page loads
    function init() {
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        console.log('[Roaming Pet] Page ready, creating pet...');

        // Create pet
        const container = createPetHTML();

        // Load flower growth state
        loadFlowerState();

        // If pet was mid-bloom when user left, resume from that state
        if (flowerGrowthStage > 0) {
            console.log('[Roaming Pet] Resuming flower growth from stage:', flowerGrowthStage);
            // Apply the saved stage immediately
            applyFlowerStage(flowerGrowthStage);
            // If in bloom, start swaying
            if (flowerGrowthStage >= 5) {
                startFlowerSway();
            }
        }

        // Start on top of a random available element (not in empty space)
        {
            const startTargets = targets.filter(t => document.getElementById(t.id));
            const startTarget = startTargets[Math.floor(Math.random() * startTargets.length)];
            if (startTarget) {
                const el = document.getElementById(startTarget.id);
                const landing = getLandingPoint(el);
                container.style.left = landing.x + 'px';
                container.style.top  = landing.y + 'px';
                currentAnchorEl = el; // Track starting anchor for scroll repositioning
                console.log('[Roaming Pet] Starting on top of', startTarget.name, landing);
            } else {
                // fallback - bottom center
                container.style.left = (window.innerWidth / 2 - 15) + 'px';
                container.style.top  = (window.innerHeight - 80) + 'px';
            }
        }

        // Start blinking (works for both awake and asleep)
        startBlinking();

        // Start sleep cycle checker (checks if it's night time)
        startSleepCycleChecker();

        // Start spider mode checker (checks if it's time to hunt)
        startSpiderModeChecker();

        // Set up reactions to page element interactions
        setupPageInteractions();

        // Reposition pet to its anchor element whenever the page scrolls
        // (keeps pet sitting on top of its element rather than drifting in viewport)
        function onPageScroll() {
            if (!currentAnchorEl || isMoving || spiderModeActive) return;
            const c = document.getElementById('roaming-pet-container');
            if (!c) return;
            const pos = getLandingPoint(currentAnchorEl);
            c.style.left = pos.x + 'px';
            c.style.top  = pos.y + 'px';
        }
        window.addEventListener('scroll', onPageScroll, { passive: true });
        // Also cover the case where #main-content (slide-container) is the actual scroll container
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.addEventListener('scroll', onPageScroll, { passive: true });

        // If it's night, go to sleep immediately
        if (isNightTime()) {
            setAnimation('sleeping');
            isSleeping = true;
            console.log('[Roaming Pet] It\'s night time - sleeping');
        } else {
            // Start idle animation
            setAnimation('idle');

            // PERFORM RANDOM ACTION IMMEDIATELY ON PAGE LOAD
            setTimeout(() => {
                if (!isSleeping) {
                    performRandomInstantAction();
                }
            }, 500); // Small delay to ensure pet is fully loaded

            // Schedule first move after 8-15 seconds (after instant action completes)
            const initialDelay = 8000 + Math.random() * 7000;
            console.log('[Roaming Pet] First move in', Math.floor(initialDelay / 1000), 'seconds');

            setTimeout(() => {
                if (!isSleeping) {
                    const target = getRandomTarget();
                    if (target) {
                        currentTarget = target;

                        // 50% chance to jump, 50% to walk
                        if (Math.random() < 0.5) {
                            jumpToTarget(target);
                        } else {
                            moveToTarget(target);
                        }
                    }
                }
            }, initialDelay);
        }

        console.log('[Roaming Pet] Initialized successfully!');
    }

    // Start initialization
    init();
})();
