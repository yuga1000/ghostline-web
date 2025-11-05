// ===== ROAMING AGENT PET MODULE (for index.html) =====

(function() {
    console.log('[Roaming Pet] Initializing...');

    // Pet state
    let currentAnimation = 'idle';
    let currentTarget = null;
    let isMoving = false;
    let moveInterval = null;
    let isSleeping = false;

    // Movement targets on index.html
    const targets = [
        { id: 'logo', name: 'logo', animations: ['playing', 'idle', 'waving', 'growing'], walkEdges: false, preferGrowing: true },
        { id: 'galleryBtn', name: 'gallery', animations: ['waving', 'idle', 'playing', 'waving'], walkEdges: true, preferGrowing: false },
        { id: 'streamBtn', name: 'stream', animations: ['waving', 'idle', 'playing', 'waving'], walkEdges: true, preferGrowing: false },
        { id: 'orderBtn', name: 'order', animations: ['waving', 'idle', 'playing', 'waving'], walkEdges: true, preferGrowing: false },
        { id: 'socialToggle', name: 'social', animations: ['waving', 'idle', 'waving'], walkEdges: true, preferGrowing: false },
        { id: 'titleContainer', name: 'title', animations: ['idle', 'waving', 'growing', 'waving'], walkEdges: false, preferGrowing: true }
    ];

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

                <!-- Legs (4 legs) -->
                <div class="roaming-pet-legs">
                    <div class="roaming-pixel leg"></div>
                    <div class="roaming-pixel leg" style="opacity: 0;"></div>
                    <div class="roaming-pixel leg"></div>
                    <div class="roaming-pixel leg" style="opacity: 0;"></div>
                    <div class="roaming-pixel leg"></div>
                    <div class="roaming-pixel leg" style="opacity: 0;"></div>
                    <div class="roaming-pixel leg"></div>
                    <div class="roaming-pixel leg" style="opacity: 0;"></div>
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

    // Perform growing animation sequence
    function performGrowingAnimation() {
        const pet = document.getElementById('roaming-pet');
        if (!pet) return;

        console.log('[Roaming Pet] Growing like a plant...');

        // Remove other animations
        pet.classList.remove('idle', 'walking', 'waving', 'blinking', 'playing', 'sleeping', 'shrinking', 'dancing');

        // Start growing
        pet.classList.add('growing');
        currentAnimation = 'growing';

        // After growing completes (3s), hold for 2-3 seconds
        setTimeout(() => {
            console.log('[Roaming Pet] Fully grown, holding...');

            // After holding, start shrinking back
            setTimeout(() => {
                console.log('[Roaming Pet] Shrinking back...');
                pet.classList.remove('growing');
                pet.classList.add('shrinking');
                currentAnimation = 'shrinking';

                // After shrinking completes (2s), return to idle
                setTimeout(() => {
                    pet.classList.remove('shrinking');
                    setAnimation('idle');
                }, 2000);
            }, 2000 + Math.random() * 1000);
        }, 3000);
    }

    // Go to sleep
    function goToSleep() {
        if (isSleeping) return;

        console.log('[Roaming Pet] Going to sleep...');
        isSleeping = true;

        // Stop any movement
        if (moveInterval) {
            clearInterval(moveInterval);
            moveInterval = null;
        }
        isMoving = false;

        // Set sleeping animation
        setAnimation('sleeping');
    }

    // Wake up
    function wakeUp() {
        if (!isSleeping) return;

        console.log('[Roaming Pet] Waking up!');
        isSleeping = false;

        // Set idle animation
        setAnimation('idle');

        // Schedule next move
        scheduleNextMove();
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
        const container = document.getElementById('roaming-pet-container');
        const targetElement = document.getElementById(target.id);

        if (!container || !targetElement) {
            console.log('[Roaming Pet] Cannot jump - missing elements');
            return;
        }

        isMoving = true;

        // Get current and target positions
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const currentX = containerRect.left;
        const currentY = containerRect.top;

        // Target position: near the element but with random offset
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        const targetX = targetRect.left + targetRect.width / 2 + offsetX - 20;
        const targetY = targetRect.top + targetRect.height / 2 + offsetY - 20;

        console.log('[Roaming Pet] Jumping from', currentX, currentY, 'to', targetX, targetY);

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

    // Move to target with discrete walking steps
    function moveToTarget(target) {
        const container = document.getElementById('roaming-pet-container');
        const targetElement = document.getElementById(target.id);

        if (!container || !targetElement) {
            console.log('[Roaming Pet] Cannot move - missing elements');
            return;
        }

        isMoving = true;
        setAnimation('walking');

        // Get current and target positions
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        // Calculate target position (near the element, with some offset)
        const currentX = containerRect.left;
        const currentY = containerRect.top;

        // Target position: near the element but with random offset
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        const targetX = targetRect.left + targetRect.width / 2 + offsetX - 20;
        const targetY = targetRect.top + targetRect.height / 2 + offsetY - 20;

        console.log('[Roaming Pet] Walking from', currentX, currentY, 'to', targetX, targetY);

        // Calculate distance and steps
        const deltaX = targetX - currentX;
        const deltaY = targetY - currentY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Discrete steps: move 12px at a time (4 pixels * 3px = 12px per step)
        const stepSize = 12;
        const numSteps = Math.ceil(distance / stepSize);
        const stepX = deltaX / numSteps;
        const stepY = deltaY / numSteps;

        let currentStep = 0;

        // Clear any existing movement
        if (moveInterval) {
            clearInterval(moveInterval);
        }

        // Move in discrete steps (8 fps = 125ms per frame)
        moveInterval = setInterval(() => {
            if (currentStep >= numSteps) {
                // Reached target
                clearInterval(moveInterval);
                moveInterval = null;
                isMoving = false;

                console.log('[Roaming Pet] Reached target:', target.name);

                // Decide what to do at target
                decideTargetAction(target);
                return;
            }

            // Move one step
            const newX = currentX + stepX * (currentStep + 1);
            const newY = currentY + stepY * (currentStep + 1);

            container.style.left = newX + 'px';
            container.style.top = newY + 'px';

            currentStep++;
        }, 125); // 8 fps
    }

    // Decide what action to perform at target
    function decideTargetAction(target) {
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
        if (isMoving || isSleeping) return;

        // Random delay: 30-180 seconds
        const delay = 30000 + Math.random() * 150000;
        console.log('[Roaming Pet] Next move in', Math.floor(delay / 1000), 'seconds');

        setTimeout(() => {
            // Check if still awake
            if (isSleeping) return;

            // 20% chance to just do animation without moving
            if (Math.random() < 0.2) {
                console.log('[Roaming Pet] Doing animation in place');
                const randomAnims = ['waving', 'blinking', 'dancing', 'growing', 'playing'];
                const anim = randomAnims[Math.floor(Math.random() * randomAnims.length)];
                setAnimation(anim);

                // Hold for 3-5 seconds then return to idle
                setTimeout(() => {
                    setAnimation('idle');
                    scheduleNextMove();
                }, 3000 + Math.random() * 2000);
                return;
            }

            const target = getRandomTarget();
            if (target) {
                currentTarget = target;

                // 30% chance to jump, 70% to walk (more walking!)
                if (Math.random() < 0.3) {
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

    // Check sleep cycle every 5 minutes
    function startSleepCycleChecker() {
        // Check immediately
        checkSleepCycle();

        // Then check every 5 minutes
        setInterval(checkSleepCycle, 5 * 60 * 1000);

        console.log('[Roaming Pet] Sleep cycle checker started');
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

        // Set random initial position
        const randomX = 20 + Math.random() * (window.innerWidth - 100);
        const randomY = 20 + Math.random() * (window.innerHeight - 100);
        container.style.left = randomX + 'px';
        container.style.top = randomY + 'px';
        console.log('[Roaming Pet] Starting at random position:', randomX, randomY);

        // Start blinking (works for both awake and asleep)
        startBlinking();

        // Start sleep cycle checker (checks if it's night time)
        startSleepCycleChecker();

        // If it's night, go to sleep immediately
        if (isNightTime()) {
            setAnimation('sleeping');
            isSleeping = true;
            console.log('[Roaming Pet] It\'s night time - sleeping');
        } else {
            // Start idle animation
            setAnimation('idle');

            // Schedule first move after 5-10 seconds
            const initialDelay = 5000 + Math.random() * 5000;
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
