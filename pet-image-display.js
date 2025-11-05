// AGENT_PET Image Display Module
// Displays generated images directly in the pet window

(function() {
    console.log('[PET] Image display module initializing...');
    
    // Find or create pet window
    function initPetDisplay() {
        // Find the AGENT_PET robot card
        const petCards = Array.from(document.querySelectorAll('.robot-card'));
        const petCard = petCards.find(card => {
            const title = card.querySelector('.pixel-font');
            return title && title.textContent.includes('AGENT_PET');
        });
        
        if (!petCard) {
            console.error('[PET] Could not find AGENT_PET window!');
            return;
        }
        
        // Find the video feed div
        const videoFeed = petCard.querySelector('.video-feed');
        if (!videoFeed) {
            console.error('[PET] Could not find video feed container!');
            return;
        }
        
        // Clear existing content but keep the structure
        const existingNoise = videoFeed.querySelector('.noise-mask');
        if (existingNoise) {
            existingNoise.style.display = 'none';
        }
        
        // Create image container
        let imageContainer = videoFeed.querySelector('#pet-image-container');
        if (!imageContainer) {
            imageContainer = document.createElement('div');
            imageContainer.id = 'pet-image-container';
            imageContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #000;
                z-index: 5;
            `;
            videoFeed.appendChild(imageContainer);
        }
        
        // Create status text overlay
        let statusOverlay = videoFeed.querySelector('#pet-status-overlay');
        if (!statusOverlay) {
            statusOverlay = document.createElement('div');
            statusOverlay.id = 'pet-status-overlay';
            statusOverlay.style.cssText = `
                position: absolute;
                top: 5px;
                left: 5px;
                color: #00ff00;
                font-size: 10px;
                font-family: 'Share Tech Mono', monospace;
                z-index: 10;
                text-shadow: 0 0 3px rgba(0, 255, 0, 0.5);
            `;
            videoFeed.appendChild(statusOverlay);
        }
        
        // Update mood/stage display
        const moodElement = petCard.querySelector('div:last-child');
        if (moodElement) {
            moodElement.innerHTML = `
                <div>MOOD: <span id="pet-mood">Waiting for art...</span></div>
                <div>STAGE: <span id="pet-stage">0 / 4</span></div>
            `;
        }
        
        return { imageContainer, statusOverlay, petCard };
    }
    
    // Display image function
    window.displayPetImage = function(imageUrl, filename) {
        console.log('[PET] Displaying image:', imageUrl);
        
        const elements = initPetDisplay();
        if (!elements) return;
        
        const { imageContainer, statusOverlay, petCard } = elements;
        
        // Update status
        statusOverlay.textContent = 'NEW IMAGE!';
        statusOverlay.style.color = '#44ff44';
        
        // Create image element
        const img = document.createElement('img');
        img.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
            border: 1px solid #00ff00;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        `;
        
        img.onload = function() {
            // Clear container and add new image
            imageContainer.innerHTML = '';
            imageContainer.appendChild(img);
            
            // Update mood
            const moodElement = document.getElementById('pet-mood');
            if (moodElement) {
                moodElement.textContent = 'Showing: ' + (filename || 'artwork');
            }
            
            // Update stage
            const stageElement = document.getElementById('pet-stage');
            if (stageElement) {
                const currentStage = parseInt(stageElement.textContent.split('/')[0]) || 0;
                stageElement.textContent = `${(currentStage + 1) % 5} / 4`;
            }
            
            // Fade out status after 3 seconds
            setTimeout(() => {
                statusOverlay.style.color = '#00ff00';
                statusOverlay.textContent = 'ANIMATED';
            }, 3000);
            
            // Reset to sleeping after 60 seconds
            setTimeout(() => {
                if (moodElement) {
                    moodElement.textContent = 'Sleeping... ZZZ';
                }
                statusOverlay.textContent = '';
            }, 60000);
        };
        
        img.onerror = function() {
            console.error('[PET] Failed to load image:', imageUrl);
            statusOverlay.textContent = 'LOAD ERROR';
            statusOverlay.style.color = '#ff4444';
            
            // Try to show as text link
            imageContainer.innerHTML = `
                <div style="padding: 10px; text-align: center;">
                    <div style="color: #ff4444; font-size: 10px; margin-bottom: 5px;">Failed to load</div>
                    <a href="${imageUrl}" target="_blank" style="color: #00ff00; font-size: 8px; word-break: break-all;">
                        ${imageUrl.substring(0, 50)}...
                    </a>
                </div>
            `;
        };
        
        // Start loading
        img.src = imageUrl;
    };
    
    // Listen for WebSocket messages
    const originalOnMessage = window.ws ? window.ws.onmessage : null;
    
    // Hook into WebSocket if it exists
    function hookWebSocket() {
        if (window.ws) {
            const originalHandler = window.ws.onmessage;
            window.ws.onmessage = function(event) {
                // Call original handler first
                if (originalHandler) {
                    originalHandler.call(this, event);
                }
                
                // Check for image messages
                try {
                    const data = JSON.parse(event.data);
                    if (data.level === 'IMAGE' && data.metadata) {
                        const imageUrl = data.metadata.image_url || 
                                       data.metadata.catbox_url || 
                                       data.metadata.url;
                        const filename = data.metadata.filename || 'generated.png';
                        
                        if (imageUrl && imageUrl.startsWith('http')) {
                            console.log('[PET] Image message detected:', imageUrl);
                            window.displayPetImage(imageUrl, filename);
                        }
                    }
                } catch (e) {
                    // Not JSON or parse error - ignore
                }
            };
            console.log('[PET] WebSocket hooked for image messages');
        }
    }
    
    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initPetDisplay();
            setTimeout(hookWebSocket, 1000); // Wait for WebSocket to initialize
        });
    } else {
        initPetDisplay();
        setTimeout(hookWebSocket, 1000);
    }
    
    // Re-hook if WebSocket reconnects
    setInterval(() => {
        if (window.ws && !window.ws._petHooked) {
            hookWebSocket();
            window.ws._petHooked = true;
        }
    }, 3000);
    
    console.log('[PET] Image display module loaded');
})();
