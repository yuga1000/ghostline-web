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
                <div class="pixel-pet idle" id="pixel-pet" style="position: relative; transform: scale(3); animation: float 3s ease-in-out infinite;">
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
        pet.classList.remove('idle', 'thinking', 'happy', 'active', 'sad', 'sleeping');

        // Parse log text and show reaction bubble
        showPetReaction(level, logText);

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
                pet.classList.add('happy');
                setTimeout(() => {
                    pet.classList.remove('happy');
                    pet.classList.add('idle');
                }, 1800);
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
                }, 1000);
                break;
            default:
                pet.classList.add('idle');
        }
    }

    // Show pet reaction bubble based on log content
    function showPetReaction(level, logText) {
        // Don't show reactions too frequently (max 1 per 5 seconds)
        const now = Date.now();
        if (window.lastPetReaction && now - window.lastPetReaction < 5000) {
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
            const petCard = document.getElementById('pet-card-feed');
            if (!petCard) return;

            // Remove old bubble if exists
            const oldBubble = petCard.querySelector('.pet-bubble');
            if (oldBubble) oldBubble.remove();

            // Create new bubble
            const bubble = document.createElement('div');
            bubble.className = 'pet-bubble';
            bubble.textContent = message;
            petCard.appendChild(bubble);

            // Remove after animation
            setTimeout(() => bubble.remove(), 2000);
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

    // Export functions to global scope if needed
    window.petModule = {
        showPetPlaceholder: showPetPlaceholder,
        clearPetPlaceholder: clearPetPlaceholder
    };

    console.log('[Pet] Pet module loaded');
})();
