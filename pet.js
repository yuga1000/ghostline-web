/* ==================== PIXEL PET LOGIC ==================== */

// Initialize pet when DOM is loaded
(function() {
    'use strict';

    console.log('[Pet] Initializing pixel pet...');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPet);
    } else {
        initPet();
    }

    function initPet() {
        // Add pet HTML to the page
        addPetCard();

        // Set initial state
        const pet = document.getElementById('pixel-pet');
        if (pet) {
            pet.classList.add('idle');
            console.log('[Pet] Pet initialized in idle state');
        }

        // Show placeholder initially
        showPetPlaceholder();

        // Hook into log message handler
        hookIntoLogs();

        // Start inactivity monitor
        startInactivityMonitor();

        // Start idle animation variations
        startIdleVariations();

        // Start programmatic animations with delay to ensure DOM is ready
        setTimeout(() => {
            console.log('[Pet] Attempting to start animations...');
            startProgrammaticAnimations();
        }, 500);
    }

    // Track last activity time and opacity
    let lastActivityTime = Date.now();
    let inactivityTimer = null;
    let petOpacity = 0.2; // Start almost transparent
    let targetOpacity = 0.2; // Target opacity for smooth transitions

    function startInactivityMonitor() {
        // Check every 30 seconds
        inactivityTimer = setInterval(() => {
            const timeSinceActivity = Date.now() - lastActivityTime;
            const pet = document.getElementById('pixel-pet');

            if (!pet) return;

            // Fade to transparent when no logs (after 30 seconds)
            if (timeSinceActivity > 30000) {
                targetOpacity = 0.15; // Almost transparent
                console.log('[Pet] Pet fading due to inactivity');
            } else {
                targetOpacity = 1.0; // Fully visible
            }
        }, 30000); // Check every 30 seconds
    }

    function addPetCard() {
        // Find the video grid
        const videoGrid = document.querySelector('.video-grid');
        if (!videoGrid) {
            console.error('[Pet] Could not find video grid!');
            return;
        }

        // Create pet card HTML
        const petCard = document.createElement('div');
        petCard.className = 'terminal-border robot-card';
        petCard.innerHTML = `
            <div class="pixel-font text-xs mb-2 flex justify-between">
                <span>[AGENT_PET]</span>
                <span><span class="status-online" id="status4"></span></span>
            </div>
            <div class="video-feed h-40 terminal-border relative" id="pet-card-feed" style="display: flex; align-items: center; justify-content: center; background: #0a0a0a;">
                <!-- Noise mask placeholder (shown when no logs) -->
                <div class="noise-mask" id="pet-noise-mask"></div>
                <!-- Pixel Pet Agent -->
                <div class="pixel-pet idle" id="pixel-pet" style="position: relative; transform: scale(1);">
                    <!-- Row 1: Top of head -->
                    <div class="pet-row">
                        <div class="pet-pixel"></div>
                        <div class="pet-pixel pink"></div>
                        <div class="pet-pixel pink"></div>
                        <div class="pet-pixel pink"></div>
                        <div class="pet-pixel"></div>
                    </div>
                    <!-- Row 2: Eyes row -->
                    <div class="pet-row">
                        <div class="pet-pixel pink"></div>
                        <div class="pet-pixel eye" id="pet-eye-left"></div>
                        <div class="pet-pixel pink"></div>
                        <div class="pet-pixel eye" id="pet-eye-right"></div>
                        <div class="pet-pixel pink"></div>
                    </div>
                    <!-- Row 3: Body -->
                    <div class="pet-row">
                        <div class="pet-pixel pink"></div>
                        <div class="pet-pixel pink"></div>
                        <div class="pet-pixel pink"></div>
                        <div class="pet-pixel pink"></div>
                        <div class="pet-pixel pink"></div>
                    </div>
                    <!-- Row 4: Legs -->
                    <div class="pet-row">
                        <div class="pet-pixel"></div>
                        <div class="pet-pixel pink"></div>
                        <div class="pet-pixel"></div>
                        <div class="pet-pixel pink"></div>
                        <div class="pet-pixel"></div>
                    </div>
                </div>
            </div>
            <div class="pixel-font text-green-600 text-xs mt-2">
                <div>MOOD: <span id="pet-mood">HAPPY</span></div>
                <div>STATE: <span id="pet-state">Watching logs...</span></div>
            </div>
        `;

        // Append to video grid
        videoGrid.appendChild(petCard);
        console.log('[Pet] Pet card added to page');
    }

    function hookIntoLogs() {
        // Try multiple times to hook into logs (wait for main script to load)
        let attempts = 0;
        const maxAttempts = 10;

        function tryHook() {
            attempts++;
            console.log(`[Pet] Attempt ${attempts} to hook into logs...`);

            const originalHandleLogMessage = window.handleLogMessage;

            if (originalHandleLogMessage) {
                // Override handleLogMessage to intercept logs
                window.handleLogMessage = function(data) {
                    console.log('[Pet] Log intercepted:', data);

                    // Call original function first
                    originalHandleLogMessage.call(this, data);

                    // Then update pet
                    const { content, level } = data;
                    if (content && level) {
                        console.log('[Pet] Updating pet state for level:', level);
                        updatePetState(level, content);
                    }
                };

                console.log('[Pet] ✓ Successfully hooked into log message handler');
                return true;
            } else {
                console.warn(`[Pet] handleLogMessage not found yet (attempt ${attempts}/${maxAttempts})`);

                if (attempts < maxAttempts) {
                    setTimeout(tryHook, 500);
                } else {
                    console.error('[Pet] Failed to hook into logs after 10 attempts, using fallback');
                    setInterval(checkForLogs, 1000);
                }
                return false;
            }
        }

        tryHook();
    }

    function checkForLogs() {
        // Fallback method: check if logs are present
        const logContent = document.getElementById('agent-log-content');
        if (logContent && logContent.children.length > 0) {
            clearPetPlaceholder();
        }
    }

    // Update pixel pet animation based on log level
    function updatePetState(level, logText) {
        const pet = document.getElementById('pixel-pet');
        if (!pet) return;

        // Update activity time
        lastActivityTime = Date.now();

        // Make pet fully visible when log arrives
        targetOpacity = 1.0;

        // Clear pet placeholder when first log arrives
        clearPetPlaceholder();

        // Remove all state classes
        pet.classList.remove('idle', 'thinking', 'happy', 'active', 'sad', 'sleeping', 'excited');

        // Parse log text and show reaction bubble
        showPetReaction(level, logText);

        // Determine if this is an exciting log (multiple keywords or important events)
        const lowerLog = logText.toLowerCase();
        const isExciting = lowerLog.includes('complete') ||
                          lowerLog.includes('success') ||
                          lowerLog.includes('generated') ||
                          lowerLog.includes('launching');

        // Set state based on log level
        switch(level) {
            case 'thinking':
                pet.classList.add('thinking');
                setTimeout(() => {
                    pet.classList.remove('thinking');
                    pet.classList.add('idle');
                }, 2000);
                break;
            case 'success':
                // Use excited animation for extra-special success logs
                if (isExciting) {
                    pet.classList.add('excited');
                    setTimeout(() => {
                        pet.classList.remove('excited');
                        pet.classList.add('happy');
                        setTimeout(() => {
                            pet.classList.remove('happy');
                            pet.classList.add('idle');
                        }, 800);
                    }, 800);
                } else {
                    pet.classList.add('happy');
                    setTimeout(() => {
                        pet.classList.remove('happy');
                        pet.classList.add('idle');
                    }, 1800);
                }
                break;
            case 'error':
                pet.classList.add('sad');
                setTimeout(() => {
                    pet.classList.remove('sad');
                    pet.classList.add('idle');
                }, 1500);
                break;
            case 'action':
                pet.classList.add('active');
                setTimeout(() => {
                    pet.classList.remove('active');
                    pet.classList.add('idle');
                }, 1500);
                break;
            default:
                pet.classList.add('idle');
        }
    }

    // Show pet reaction bubble based on log content
    function showPetReaction(level, logText) {
        console.log('[Pet] showPetReaction called with:', level, logText.substring(0, 50));

        // Don't show reactions too frequently (max 1 per 5 seconds)
        const now = Date.now();
        if (window.lastPetReaction && now - window.lastPetReaction < 5000) {
            console.log('[Pet] Skipping reaction - too soon (cooldown)');
            return;
        }
        window.lastPetReaction = now;

        const lowerLog = logText.toLowerCase();
        let message = null;

        // Parse log for keywords and generate terminal-style reactions
        if (lowerLog.includes('vercept') || lowerLog.includes('workflow')) {
            message = '> INIT_VERCEPT';
        } else if (lowerLog.includes('generating') || lowerLog.includes('rendering')) {
            message = '> RENDER_ACTIVE';
        } else if (lowerLog.includes('image generated') || lowerLog.includes('complete')) {
            message = '> TASK_SUCCESS';
        } else if (lowerLog.includes('error') || lowerLog.includes('failed')) {
            message = '> ERROR_DETECT';
        } else if (lowerLog.includes('waiting') || lowerLog.includes('scanning')) {
            message = '> WAIT_STATE';
        } else if (lowerLog.includes('shutting down') || lowerLog.includes('cleanup')) {
            message = '> SHUTDOWN_SEQ';
        } else if (lowerLog.includes('launching') || lowerLog.includes('starting')) {
            message = '> BOOT_SEQ';
        } else if (lowerLog.includes('cooldown') || lowerLog.includes('delay')) {
            message = '> COOL_DOWN';
        } else {
            // Random generic reactions (10% chance)
            if (Math.random() < 0.1) {
                const generic = ['> WATCHING', '> MONITORING', '> OBSERVING', '> LOGGING'];
                message = generic[Math.floor(Math.random() * generic.length)];
            }
        }

        if (message) {
            console.log('[Pet] Showing bubble:', message);
            const petCard = document.getElementById('pet-card-feed');
            if (!petCard) {
                console.error('[Pet] pet-card-feed not found!');
                return;
            }

            // Remove old bubble if exists
            const oldBubble = petCard.querySelector('.pet-bubble');
            if (oldBubble) {
                console.log('[Pet] Removing old bubble');
                oldBubble.remove();
            }

            // Create new bubble
            const bubble = document.createElement('div');
            bubble.className = 'pet-bubble';

            // Add level-specific styling
            if (level === 'success') {
                bubble.classList.add('success');
            } else if (level === 'error') {
                bubble.classList.add('error');
            } else if (level === 'thinking') {
                bubble.classList.add('thinking');
            } else if (level === 'action') {
                bubble.classList.add('action');
            }

            bubble.textContent = message;
            petCard.appendChild(bubble);
            console.log('[Pet] Bubble added to DOM');

            // Remove after animation
            setTimeout(() => bubble.remove(), 2000);
        } else {
            console.log('[Pet] No matching keywords for reaction');
        }
    }

    // Show pet placeholder (when no logs)
    function showPetPlaceholder() {
        const petNoiseMask = document.getElementById('pet-noise-mask');
        if (petNoiseMask) {
            petNoiseMask.style.display = 'block';
        }
    }

    // Clear pet placeholder (when logs arrive)
    function clearPetPlaceholder() {
        const petNoiseMask = document.getElementById('pet-noise-mask');
        if (petNoiseMask && petNoiseMask.style.display !== 'none') {
            petNoiseMask.style.display = 'none';
        }
    }

    // Special animation state
    let specialAnimation = null;
    let specialAnimationFrame = 0;

    // Add random idle animations to make pet feel more alive
    function startIdleVariations() {
        setInterval(() => {
            const pet = document.getElementById('pixel-pet');
            if (!pet) return;

            // Only add variations if pet is in idle state
            if (!pet.classList.contains('idle')) return;

            // Random chance for special animation (30%)
            if (Math.random() < 0.3) {
                const animations = ['white-eyes', 'legs-spread', 'legs-grow', 'arms-wave', 'squat', 'horns-grow', 'walk'];
                specialAnimation = animations[Math.floor(Math.random() * animations.length)];
                specialAnimationFrame = 0;
                console.log('[Pet] Special animation:', specialAnimation);

                // Walking animation is longer (4 seconds)
                const duration = specialAnimation === 'walk' ? 4000 : 2000;
                setTimeout(() => {
                    specialAnimation = null;
                }, duration);
            }
        }, 8000); // Check every 8 seconds
    }

    // Programmatic animations using JavaScript (more reliable than CSS)
    function startProgrammaticAnimations() {
        const pet = document.getElementById('pixel-pet');
        if (!pet) {
            console.error('[Pet Animation] ✗ Pet element not found!');
            return;
        }

        console.log('[Pet Animation] ✓ Starting animation loop...');

        let frame = 0;
        let eyeBlinkCounter = 0;

        // Free movement variables (pet can move around screen)
        let petX = 0; // Center of container
        let petY = 0; // Center of container
        let velocityX = 0;
        let velocityY = 0;
        let gravity = 'floor'; // 'floor', 'ceiling', 'wall-left', 'wall-right'
        let jumpTimer = 0;
        const container = pet.parentElement;
        const containerWidth = container ? container.offsetWidth : 300;
        const containerHeight = container ? container.offsetHeight : 160;
        const petSize = 40; // 5x8 pixels

        // Main animation loop (10fps for retro pixel feel)
        const animationInterval = setInterval(() => {
            frame++;

            // Smooth opacity transition
            if (Math.abs(petOpacity - targetOpacity) > 0.01) {
                petOpacity += (targetOpacity - petOpacity) * 0.1;
                pet.style.opacity = petOpacity.toFixed(2);
            }

            // Debug: log every 50 frames (5 seconds)
            if (frame % 50 === 0) {
                console.log('[Pet Animation] Frame:', frame, 'Classes:', pet.className, 'Opacity:', petOpacity.toFixed(2));
            }

            // Handle special animations first
            if (specialAnimation) {
                specialAnimationFrame++;
                handleSpecialAnimation(pet);
                return; // Skip normal animations
            }

            // Free movement system (10 frame pixel-perfect motion)
            // Pet randomly jumps and moves around, sometimes on ceiling/walls
            jumpTimer++;

            // Random jump every 3-5 seconds (30-50 frames)
            if (jumpTimer > 30 + Math.random() * 20) {
                jumpTimer = 0;

                // Random horizontal velocity
                velocityX = Math.round((Math.random() - 0.5) * 4); // -2 to +2 pixels per frame

                // Random jump or gravity change
                const action = Math.random();
                if (action < 0.6) {
                    // Normal jump
                    velocityY = -8; // Jump up
                } else if (action < 0.75) {
                    // Switch to ceiling
                    gravity = 'ceiling';
                    velocityY = 8; // "Fall" to ceiling
                } else if (action < 0.85) {
                    // Crawl on wall
                    gravity = Math.random() < 0.5 ? 'wall-left' : 'wall-right';
                    velocityY = Math.round((Math.random() - 0.5) * 6);
                } else {
                    // Return to floor
                    gravity = 'floor';
                    velocityY = 0;
                }
            }

            // Apply gravity and movement
            if (gravity === 'floor') {
                velocityY += 1; // Gravity pulls down
                petY += velocityY;
                petX += velocityX;

                // Floor collision
                if (petY >= 0) {
                    petY = 0;
                    velocityY = 0;
                    velocityX *= 0.9; // Friction
                }
            } else if (gravity === 'ceiling') {
                velocityY -= 1; // Reverse gravity
                petY += velocityY;
                petX += velocityX;

                // Ceiling collision
                const maxY = -(containerHeight - petSize);
                if (petY <= maxY) {
                    petY = maxY;
                    velocityY = 0;
                    velocityX *= 0.9;
                }
            } else if (gravity === 'wall-left') {
                petX = -(containerWidth / 2 - petSize);
                petY += velocityY;
                velocityY *= 0.95;
            } else if (gravity === 'wall-right') {
                petX = containerWidth / 2 - petSize;
                petY += velocityY;
                velocityY *= 0.95;
            }

            // Clamp position to container bounds
            petX = Math.max(-(containerWidth / 2 - petSize / 2), Math.min(containerWidth / 2 - petSize / 2, petX));
            petY = Math.max(-(containerHeight - petSize), Math.min(0, petY));

            // Get current state
            const isIdle = pet.classList.contains('idle');
            const isThinking = pet.classList.contains('thinking');
            const isHappy = pet.classList.contains('happy');
            const isSad = pet.classList.contains('sad');
            const isActive = pet.classList.contains('active');
            const isExcited = pet.classList.contains('excited');

            // Apply free movement position + state animations
            let animX = Math.round(petX);
            let animY = Math.round(petY);
            let rotate = 0;
            let scaleX = 1;
            let scaleY = 1;

            // Add state-based animation on top of movement
            if (isIdle) {
                const breathe = Math.round(Math.sin(frame / 5) * 3);
                animY += breathe;
            } else if (isThinking) {
                const wiggle = Math.round(Math.sin(frame / 2) * 10);
                const tilt = Math.round(Math.sin(frame / 2) * 8);
                animX += wiggle;
                rotate = tilt;
            } else if (isHappy) {
                const bounce = Math.round(Math.abs(Math.sin(frame / 1.5)) * 25);
                const rotateAnim = Math.round(Math.sin(frame / 1.5) * 15);
                animY -= bounce;
                rotate = rotateAnim;
            } else if (isExcited) {
                const shake = Math.round(Math.sin(frame * 2) * 15);
                const rotateAnim = Math.round(Math.sin(frame * 2) * 20);
                animX += shake;
                rotate = rotateAnim;
            } else if (isSad) {
                const shake = Math.round(Math.sin(frame * 1.5) * 8);
                const shiver = Math.round(Math.sin(frame * 2) * 5);
                animX += shake;
                rotate = shiver;
            } else if (isActive) {
                const pulse = Math.round(Math.sin(frame / 2) * 8);
                animY -= pulse;
            }

            // Flip sprite when on ceiling or moving left
            if (gravity === 'ceiling') {
                scaleY = -1;
            }
            if (velocityX < 0) {
                scaleX = -1;
            }

            // Apply final transform
            pet.style.transform = `scale(${scaleX}, ${scaleY}) translate(${animX}px, ${animY}px) rotate(${rotate}deg)`;

        }, 100); // 10fps for retro pixel animation

        // Eye blinking animation
        const leftEye = document.getElementById('pet-eye-left');
        const rightEye = document.getElementById('pet-eye-right');

        setInterval(() => {
            eyeBlinkCounter++;

            // Blink every 4 seconds for idle
            if (pet.classList.contains('idle') && eyeBlinkCounter % 240 === 0) {
                blinkEyes(leftEye, rightEye, 100);
            }

            // Faster blink for active
            if (pet.classList.contains('active') && eyeBlinkCounter % 120 === 0) {
                blinkEyes(leftEye, rightEye, 100);
            }

            // Double blink for thinking
            if (pet.classList.contains('thinking') && eyeBlinkCounter % 120 === 0) {
                blinkEyes(leftEye, rightEye, 80);
                setTimeout(() => blinkEyes(leftEye, rightEye, 80), 150);
            }

        }, 16);
    }

    function handleSpecialAnimation(pet) {
        const rows = pet.querySelectorAll('.pet-row');
        const leftEye = document.getElementById('pet-eye-left');
        const rightEye = document.getElementById('pet-eye-right');

        if (specialAnimation === 'white-eyes') {
            leftEye.style.background = '#fff';
            rightEye.style.background = '#fff';
            if (specialAnimationFrame > 15) {
                leftEye.style.background = '#000';
                rightEye.style.background = '#000';
            }
        }

        else if (specialAnimation === 'legs-spread') {
            const legRow = rows[3];
            if (specialAnimationFrame < 10) {
                legRow.style.transform = 'scaleX(1.5)';
            } else {
                legRow.style.transform = 'scaleX(1)';
            }
        }

        else if (specialAnimation === 'legs-grow') {
            const legRow = rows[3];
            const legPixels = legRow.querySelectorAll('.pet-pixel.pink');
            if (specialAnimationFrame < 10) {
                legPixels.forEach(leg => leg.style.height = '16px');
            } else {
                legPixels.forEach(leg => leg.style.height = '8px');
            }
        }

        else if (specialAnimation === 'squat') {
            const squat = specialAnimationFrame < 8 ? specialAnimationFrame : 16 - specialAnimationFrame;
            pet.style.transform = `scale(1) translateY(${squat}px)`;
        }

        else if (specialAnimation === 'horns-grow') {
            const headRow = rows[0];
            if (!headRow.querySelector('.horn-left')) {
                const hornLeft = document.createElement('div');
                hornLeft.className = 'pet-pixel pink horn-left';
                hornLeft.style.position = 'absolute';
                hornLeft.style.left = '-8px';
                hornLeft.style.top = '-8px';
                headRow.style.position = 'relative';
                headRow.appendChild(hornLeft);

                const hornRight = document.createElement('div');
                hornRight.className = 'pet-pixel pink horn-right';
                hornRight.style.position = 'absolute';
                hornRight.style.right = '-8px';
                hornRight.style.top = '-8px';
                headRow.appendChild(hornRight);
            }

            const hornLeft = headRow.querySelector('.horn-left');
            const hornRight = headRow.querySelector('.horn-right');
            if (hornLeft && hornRight && specialAnimationFrame < 10) {
                const grow = Math.min(specialAnimationFrame, 3);
                hornLeft.style.height = `${8 * (grow + 1)}px`;
                hornRight.style.height = `${8 * (grow + 1)}px`;
            }

            if (specialAnimationFrame > 18) {
                const horns = headRow.querySelectorAll('.horn-left, .horn-right');
                horns.forEach(horn => horn.remove());
            }
        }

        else if (specialAnimation === 'arms-wave') {
            const bodyRow = rows[2];
            const wave = Math.round(Math.sin(specialAnimationFrame / 3) * 2);

            if (!bodyRow.querySelector('.arm-left')) {
                const armLeft = document.createElement('div');
                armLeft.className = 'pet-pixel pink arm-left';
                armLeft.style.position = 'absolute';
                armLeft.style.left = '-8px';
                bodyRow.style.position = 'relative';
                bodyRow.appendChild(armLeft);

                const armRight = document.createElement('div');
                armRight.className = 'pet-pixel pink arm-right';
                armRight.style.position = 'absolute';
                armRight.style.right = '-8px';
                bodyRow.appendChild(armRight);
            }

            const armLeft = bodyRow.querySelector('.arm-left');
            const armRight = bodyRow.querySelector('.arm-right');
            if (armLeft && armRight) {
                armLeft.style.top = `${wave * 8}px`;
                armRight.style.top = `${-wave * 8}px`;
            }

            if (specialAnimationFrame > 18) {
                const arms = bodyRow.querySelectorAll('.arm-left, .arm-right');
                arms.forEach(arm => arm.remove());
            }
        }

        else if (specialAnimation === 'walk') {
            // South Park style walking - just slide left/right with leg wiggle
            const container = pet.parentElement;
            const containerWidth = container ? container.offsetWidth : 300;
            const petWidth = 32; // Approximate pet width
            const walkDistance = containerWidth - petWidth - 40; // Leave margin

            // Walk from left to right and back
            const progress = specialAnimationFrame / 40; // 40 frames = 4 seconds
            let xPos;
            let direction;

            if (progress < 0.5) {
                // Walk right
                xPos = (progress * 2) * walkDistance - walkDistance/2;
                direction = 1;
            } else {
                // Walk left
                xPos = ((1 - (progress - 0.5) * 2)) * walkDistance - walkDistance/2;
                direction = -1;
            }

            // Flip sprite when walking left
            const scaleX = direction === -1 ? -1 : 1;

            // Leg wiggle animation (alternate legs)
            const legRow = rows[3];
            const legWiggle = Math.sin(specialAnimationFrame / 2) > 0 ? 1 : -1;
            legRow.style.transform = `translateX(${legWiggle}px)`;

            pet.style.transform = `scale(1) scaleX(${scaleX}) translateX(${Math.round(xPos)}px)`;
        }

        // Gentle breathing during special animations (except squat and walk)
        if (specialAnimation !== 'squat' && specialAnimation !== 'walk') {
            const breathe = Math.round(Math.sin(specialAnimationFrame / 5) * 2);
            pet.style.transform = `scale(1) translateY(${breathe}px)`;
        }
    }

    function blinkEyes(leftEye, rightEye, duration) {
        if (!leftEye || !rightEye) return;

        leftEye.style.height = '2px';
        leftEye.style.marginTop = '3px';
        rightEye.style.height = '2px';
        rightEye.style.marginTop = '3px';

        setTimeout(() => {
            leftEye.style.height = '8px';
            leftEye.style.marginTop = '0';
            rightEye.style.height = '8px';
            rightEye.style.marginTop = '0';
        }, duration);
    }

    // Export functions to global scope if needed
    window.petModule = {
        showPetPlaceholder: showPetPlaceholder,
        clearPetPlaceholder: clearPetPlaceholder,
        onLogReceived: function(level, content) {
            console.log('[Pet] onLogReceived called:', level, content.substring(0, 50));
            updatePetState(level, content);
        }
    };

    console.log('[Pet] Pet module loaded');

    // Visual confirmation that module loaded
    setTimeout(() => {
        const pet = document.getElementById('pixel-pet');
        const mood = document.getElementById('pet-mood');

        if (pet && mood) {
            console.log('[Pet] ✓ Pet element found, animations should be running');
            console.log('[Pet] Current classes:', pet.className);
            console.log('[Pet] Current transform:', pet.style.transform);

            // Visual indicator
            mood.textContent = 'ANIMATED ✓';
            mood.style.color = '#00ff00';
        } else {
            console.error('[Pet] ✗ Pet element NOT found!');
            if (mood) {
                mood.textContent = 'ERROR ✗';
                mood.style.color = '#ff0000';
            }
        }
    }, 2000);
})();
