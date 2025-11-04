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

    // Track last activity time
    let lastActivityTime = Date.now();
    let inactivityTimer = null;

    function startInactivityMonitor() {
        // Check every 30 seconds
        inactivityTimer = setInterval(() => {
            const timeSinceActivity = Date.now() - lastActivityTime;
            const pet = document.getElementById('pixel-pet');

            if (!pet) return;

            // If 5 minutes (300000ms) of inactivity, fade to 10% opacity
            if (timeSinceActivity > 300000) {
                pet.style.transition = 'opacity 2s ease';
                pet.style.opacity = '0.1';
                console.log('[Pet] Pet sleeping due to inactivity');
            } else {
                // Active - full opacity
                pet.style.opacity = '1';
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
                <div class="pixel-pet idle" id="pixel-pet" style="position: relative; transform: scale(2);">
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

        // Restore full opacity when active
        pet.style.opacity = '1';

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
                const animations = ['white-eyes', 'legs-spread', 'legs-grow', 'arms-wave', 'squat', 'horns-grow'];
                specialAnimation = animations[Math.floor(Math.random() * animations.length)];
                specialAnimationFrame = 0;
                console.log('[Pet] Special animation:', specialAnimation);

                // Stop after 2 seconds
                setTimeout(() => {
                    specialAnimation = null;
                }, 2000);
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

        // Main animation loop (10fps for retro pixel feel)
        const animationInterval = setInterval(() => {
            frame++;

            // Debug: log every 50 frames (5 seconds)
            if (frame % 50 === 0) {
                console.log('[Pet Animation] Frame:', frame, 'Classes:', pet.className);
            }

            // Handle special animations first
            if (specialAnimation) {
                specialAnimationFrame++;
                handleSpecialAnimation(pet);
                return; // Skip normal animations
            }

            // Get current state
            const isIdle = pet.classList.contains('idle');
            const isThinking = pet.classList.contains('thinking');
            const isHappy = pet.classList.contains('happy');
            const isSad = pet.classList.contains('sad');
            const isActive = pet.classList.contains('active');
            const isExcited = pet.classList.contains('excited');

            // Idle breathing animation - snap to pixels
            if (isIdle) {
                const breathe = Math.round(Math.sin(frame / 5) * 3); // Snap to integer pixels
                pet.style.transform = `scale(2) translateY(${breathe}px)`;
            }

            // Thinking wiggle - BIGGER movements
            else if (isThinking) {
                const wiggle = Math.round(Math.sin(frame / 2) * 10);
                const tilt = Math.round(Math.sin(frame / 2) * 8);
                pet.style.transform = `scale(2) translateX(${wiggle}px) rotate(${tilt}deg)`;
            }

            // Happy bounce - MUCH BIGGER
            else if (isHappy) {
                const bounce = Math.round(Math.abs(Math.sin(frame / 1.5)) * 25);
                const rotate = Math.round(Math.sin(frame / 1.5) * 15);
                pet.style.transform = `scale(2) translateY(${-bounce}px) rotate(${rotate}deg)`;
            }

            // Excited shake - INTENSE
            else if (isExcited) {
                const shake = Math.round(Math.sin(frame * 2) * 15);
                const rotate = Math.round(Math.sin(frame * 2) * 20);
                pet.style.transform = `scale(2) translateX(${shake}px) rotate(${rotate}deg)`;
            }

            // Sad shake - VISIBLE
            else if (isSad) {
                const shake = Math.round(Math.sin(frame * 1.5) * 8);
                const shiver = Math.round(Math.sin(frame * 2) * 5);
                pet.style.transform = `scale(2) translateX(${shake}px) rotate(${shiver}deg)`;
            }

            // Active pulse - STRONGER
            else if (isActive) {
                const pulse = Math.round(Math.sin(frame / 2) * 8);
                pet.style.transform = `scale(2) translateY(${-pulse}px)`;
            }

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
            pet.style.transform = `scale(2) translateY(${squat}px)`;
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

        // Gentle breathing during special animations (except squat)
        if (specialAnimation !== 'squat') {
            const breathe = Math.round(Math.sin(specialAnimationFrame / 5) * 2);
            pet.style.transform = `scale(2) translateY(${breathe}px)`;
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
