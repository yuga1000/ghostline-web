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
        { id: 'logo', name: 'logo', animation: 'playing' },
        { id: 'galleryBtn', name: 'gallery', animation: 'waving' },
        { id: 'streamBtn', name: 'stream', animation: 'waving' },
        { id: 'orderBtn', name: 'order', animation: 'waving' },
        { id: 'socialToggle', name: 'social', animation: 'waving' },
        { id: 'titleContainer', name: 'title', animation: 'idle' }
    ];

    // Create pet HTML structure (8x4 body, 3px pixels)
    function createPetHTML() {
        const container = document.createElement('div');
        container.id = 'roaming-pet-container';
        container.className = 'roaming-pet-container';

        container.innerHTML = `
            <div class="roaming-pet active idle" id="roaming-pet">
                <div class="roaming-pet-body-container">
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

        // Remove all animation classes
        pet.classList.remove('idle', 'walking', 'waving', 'blinking', 'playing', 'sleeping');

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

    // Move to target with discrete steps
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

        console.log('[Roaming Pet] Moving from', currentX, currentY, 'to', targetX, targetY);

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

                // Play target animation
                setAnimation(target.animation);

                // Hold animation for 2-4 seconds
                const holdTime = 2000 + Math.random() * 2000;
                setTimeout(() => {
                    setAnimation('idle');
                    scheduleNextMove();
                }, holdTime);

                console.log('[Roaming Pet] Reached target:', target.name);
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

    // Schedule next movement
    function scheduleNextMove() {
        if (isMoving || isSleeping) return;

        // Random delay: 30-180 seconds
        const delay = 30000 + Math.random() * 150000;
        console.log('[Roaming Pet] Next move in', Math.floor(delay / 1000), 'seconds');

        setTimeout(() => {
            // Check if still awake
            if (isSleeping) return;

            const target = getRandomTarget();
            if (target) {
                currentTarget = target;
                moveToTarget(target);
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
        createPetHTML();

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
                        moveToTarget(target);
                    }
                }
            }, initialDelay);
        }

        console.log('[Roaming Pet] Initialized successfully!');
    }

    // Start initialization
    init();
})();
