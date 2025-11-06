// ===== SPIDER WEB HUNTING SYSTEM =====
// Realistic spider behavior with web physics

(function() {
    console.log('[Spider Web] Initializing hunting system...');

    // Configuration
    const CONFIG = {
        webDuration: 30 * 60 * 1000, // 30 minutes
        weavingDuration: 15000, // 15 seconds to weave (8x faster!)
        preySpawnInterval: 15000, // Spawn prey every 15 seconds
        preyLifetime: 10000, // Prey lives 10 seconds
        escapeChance: 0.3, // 30% chance prey escapes if spider too slow
        spiderSpeed: 300, // pixels per second when hunting
    };

    // State
    let webActive = false;
    let webElement = null;
    let webCorner = null;
    let preyList = [];
    let trappedPrey = null;
    let spiderHunting = false;
    let preySpawnInterval = null;

    // Web structure data
    let webLines = [];
    const WEB_SIZE = 120; // Size of web in pixels (smaller, more realistic)

    // ===== WEB CREATION =====

    function createWebStructure(corner) {
        const web = {
            corner: corner, // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
            center: getWebCenter(corner),
            radialLines: [],
            spiralLines: [],
            trapZones: [] // Areas where prey can get caught
        };

        // Create radial lines (8 lines from center)
        const numRadial = 8;
        for (let i = 0; i < numRadial; i++) {
            const angle = (Math.PI * 2 * i) / numRadial;
            const endX = web.center.x + Math.cos(angle) * WEB_SIZE;
            const endY = web.center.y + Math.sin(angle) * WEB_SIZE;

            web.radialLines.push({
                start: { x: web.center.x, y: web.center.y },
                end: { x: endX, y: endY },
                angle: angle
            });
        }

        // Create spiral lines (concentric circles)
        const numSpirals = 5;
        for (let i = 1; i <= numSpirals; i++) {
            const radius = (WEB_SIZE / numSpirals) * i;
            const points = [];

            for (let j = 0; j <= numRadial; j++) {
                const angle = (Math.PI * 2 * j) / numRadial;
                const x = web.center.x + Math.cos(angle) * radius;
                const y = web.center.y + Math.sin(angle) * radius;
                points.push({ x, y, radius });
            }

            web.spiralLines.push({ radius, points });

            // This spiral is a trap zone
            web.trapZones.push({ radius, center: web.center });
        }

        return web;
    }

    function getWebCenter(corner) {
        const margin = 20; // Closer to corner
        switch(corner) {
            case 'top-left':
                return { x: margin + WEB_SIZE/2, y: margin + WEB_SIZE/2 };
            case 'top-right':
                return { x: window.innerWidth - margin - WEB_SIZE/2, y: margin + WEB_SIZE/2 };
            case 'bottom-left':
                return { x: margin + WEB_SIZE/2, y: window.innerHeight - margin - WEB_SIZE/2 };
            case 'bottom-right':
                return { x: window.innerWidth - margin - WEB_SIZE/2, y: window.innerHeight - margin - WEB_SIZE/2 };
        }
    }

    // Check if web should attach to page elements
    function findNearbyElement(corner) {
        // Try to find a logo, button, or header near the corner
        const elements = document.querySelectorAll('img, button, h1, .logo, #logo');
        let closest = null;
        let minDist = Infinity;

        const center = getWebCenter(corner);

        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const elX = rect.left + rect.width / 2;
            const elY = rect.top + rect.height / 2;
            const dist = Math.sqrt(Math.pow(elX - center.x, 2) + Math.pow(elY - center.y, 2));

            if (dist < minDist && dist < 200) {
                minDist = dist;
                closest = { element: el, x: elX, y: elY, rect: rect };
            }
        });

        return closest;
    }

    // ===== WEB RENDERING (SVG) =====

    function createWebSVG(webData) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'spider-web-svg';
        svg.style.position = 'fixed';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '100';

        // Draw radial lines
        webData.radialLines.forEach((line, index) => {
            const pathLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            pathLine.setAttribute('x1', line.start.x);
            pathLine.setAttribute('y1', line.start.y);
            pathLine.setAttribute('x2', line.end.x);
            pathLine.setAttribute('y2', line.end.y);
            pathLine.setAttribute('stroke', '#00ff00');
            pathLine.setAttribute('stroke-width', '1');
            pathLine.setAttribute('opacity', '0.6');
            pathLine.classList.add('web-radial-line');
            pathLine.setAttribute('data-index', index);

            // Animation: draw line progressively
            const length = Math.sqrt(
                Math.pow(line.end.x - line.start.x, 2) +
                Math.pow(line.end.y - line.start.y, 2)
            );
            pathLine.style.strokeDasharray = length;
            pathLine.style.strokeDashoffset = length;

            svg.appendChild(pathLine);
        });

        // Draw anchor lines to nearby elements
        if (webData.anchorElement) {
            const anchor = webData.anchorElement;

            // Draw VERTICAL SUSPENSION LINE from top of anchor element down to web top
            const suspensionLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            // Line drops from top of element to top of web
            const suspensionStartY = anchor.rect.top;
            const suspensionEndY = webData.center.y - WEB_SIZE / 2; // Top of web

            suspensionLine.setAttribute('x1', anchor.x);
            suspensionLine.setAttribute('y1', suspensionStartY);
            suspensionLine.setAttribute('x2', anchor.x);
            suspensionLine.setAttribute('y2', suspensionEndY);
            suspensionLine.setAttribute('stroke', '#00ff00');
            suspensionLine.setAttribute('stroke-width', '2');
            suspensionLine.setAttribute('opacity', '0.8');
            suspensionLine.classList.add('web-suspension-line');

            // Animation
            const suspensionLength = Math.abs(suspensionEndY - suspensionStartY);
            suspensionLine.style.strokeDasharray = suspensionLength;
            suspensionLine.style.strokeDashoffset = suspensionLength;

            svg.appendChild(suspensionLine);

            // Also draw horizontal anchor line from web center to suspension line
            const anchorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            anchorLine.setAttribute('x1', webData.center.x);
            anchorLine.setAttribute('y1', webData.center.y - WEB_SIZE / 2);
            anchorLine.setAttribute('x2', anchor.x);
            anchorLine.setAttribute('y2', suspensionEndY);
            anchorLine.setAttribute('stroke', '#00ff00');
            anchorLine.setAttribute('stroke-width', '1.5');
            anchorLine.setAttribute('opacity', '0.6');
            anchorLine.setAttribute('stroke-dasharray', '3,2');
            anchorLine.classList.add('web-anchor-line');

            // Animation
            const length = Math.sqrt(
                Math.pow(anchor.x - webData.center.x, 2) +
                Math.pow(suspensionEndY - (webData.center.y - WEB_SIZE/2), 2)
            );
            anchorLine.style.strokeDasharray = length;
            anchorLine.style.strokeDashoffset = length;

            svg.appendChild(anchorLine);
        }

        // Draw spiral lines
        webData.spiralLines.forEach((spiral, spiralIndex) => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            let d = `M ${spiral.points[0].x} ${spiral.points[0].y}`;

            for (let i = 1; i < spiral.points.length; i++) {
                d += ` L ${spiral.points[i].x} ${spiral.points[i].y}`;
            }

            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#00ff00');
            path.setAttribute('stroke-width', '1');
            path.setAttribute('opacity', '0.4');
            path.classList.add('web-spiral-line');
            path.setAttribute('data-spiral', spiralIndex);

            // Animation
            const length = spiral.radius * Math.PI * 2;
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;

            svg.appendChild(path);
        });

        return svg;
    }

    // ===== WEB WEAVING ANIMATION =====

    function animateWebWeaving(svg, duration) {
        console.log('[Spider Web] Starting weaving animation...');

        const suspensionLine = svg.querySelector('.web-suspension-line');
        const anchorLines = svg.querySelectorAll('.web-anchor-line');
        const radialLines = svg.querySelectorAll('.web-radial-line');
        const spiralLines = svg.querySelectorAll('.web-spiral-line');

        // Phase 0: Draw suspension line first (if exists) - 15% of time
        if (suspensionLine) {
            const suspensionDuration = duration * 0.15;
            setTimeout(() => {
                suspensionLine.style.transition = `stroke-dashoffset ${suspensionDuration}ms ease-in`;
                suspensionLine.style.strokeDashoffset = '0';
            }, 0);

            // Draw anchor line to suspension
            anchorLines.forEach(line => {
                setTimeout(() => {
                    line.style.transition = `stroke-dashoffset ${suspensionDuration * 0.5}ms linear`;
                    line.style.strokeDashoffset = '0';
                }, suspensionDuration);
            });
        }

        const webStartDelay = suspensionLine ? duration * 0.2 : 0;

        // Phase 1: Draw radial lines (30% of time)
        const radialDuration = duration * 0.3;
        const radialDelay = radialDuration / radialLines.length;

        radialLines.forEach((line, index) => {
            setTimeout(() => {
                line.style.transition = `stroke-dashoffset ${radialDelay * 0.8}ms linear`;
                line.style.strokeDashoffset = '0';
            }, webStartDelay + radialDelay * index);
        });

        // Phase 2: Draw spiral lines (remaining 50% of time)
        const spiralStartDelay = webStartDelay + radialDuration;
        const spiralDuration = duration * 0.5;
        const spiralDelay = spiralDuration / spiralLines.length;

        spiralLines.forEach((line, index) => {
            setTimeout(() => {
                line.style.transition = `stroke-dashoffset ${spiralDelay * 0.8}ms ease-out`;
                line.style.strokeDashoffset = '0';
            }, spiralStartDelay + spiralDelay * index);
        });

        console.log('[Spider Web] Web weaving will complete in', duration / 1000, 'seconds');
    }

    // ===== WEB PHYSICS (VIBRATION) =====

    function vibrateWeb(svg, sourceX, sourceY, intensity = 1.0) {
        console.log('[Spider Web] Vibration detected at', sourceX, sourceY);

        const allLines = svg.querySelectorAll('line, path');

        allLines.forEach(line => {
            // Calculate distance from vibration source
            const bbox = line.getBBox();
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;
            const distance = Math.sqrt(
                Math.pow(centerX - sourceX, 2) +
                Math.pow(centerY - sourceY, 2)
            );

            // Closer lines vibrate more
            const vibrationAmount = Math.max(0, 5 * intensity * (1 - distance / WEB_SIZE));

            if (vibrationAmount > 0.5) {
                line.style.transition = 'transform 0.1s ease-out';
                line.style.transform = `translate(${(Math.random() - 0.5) * vibrationAmount}px, ${(Math.random() - 0.5) * vibrationAmount}px)`;

                setTimeout(() => {
                    line.style.transition = 'transform 0.3s ease-out';
                    line.style.transform = 'translate(0, 0)';
                }, 100);
            }
        });
    }

    // ===== PREY SYSTEM =====

    function createPrey() {
        const prey = document.createElement('div');
        prey.className = 'spider-prey';
        prey.style.position = 'fixed';
        prey.style.width = '3px';
        prey.style.height = '3px';
        prey.style.background = '#00ff00';
        prey.style.boxShadow = '0 0 3px #00ff00';
        prey.style.borderRadius = '50%';
        prey.style.zIndex = '99';
        prey.style.pointerEvents = 'none';

        // Random spawn position
        prey.x = Math.random() * (window.innerWidth - 100) + 50;
        prey.y = Math.random() * (window.innerHeight - 100) + 50;

        // Random velocity
        prey.vx = (Math.random() - 0.5) * 200; // pixels per second
        prey.vy = (Math.random() - 0.5) * 200;

        prey.style.left = prey.x + 'px';
        prey.style.top = prey.y + 'px';

        prey.trapped = false;
        prey.createdAt = Date.now();

        document.body.appendChild(prey);

        return prey;
    }

    function updatePrey(prey, deltaTime) {
        if (prey.trapped) {
            // Struggle animation
            const struggle = Math.sin(Date.now() / 100) * 2;
            prey.style.transform = `translate(${struggle}px, ${struggle}px)`;
            return;
        }

        // Move prey
        prey.x += prey.vx * deltaTime;
        prey.y += prey.vy * deltaTime;

        // Bounce off walls
        if (prey.x < 0 || prey.x > window.innerWidth) prey.vx *= -1;
        if (prey.y < 0 || prey.y > window.innerHeight) prey.vy *= -1;

        prey.x = Math.max(0, Math.min(window.innerWidth, prey.x));
        prey.y = Math.max(0, Math.min(window.innerHeight, prey.y));

        prey.style.left = prey.x + 'px';
        prey.style.top = prey.y + 'px';

        // Check lifetime
        if (Date.now() - prey.createdAt > CONFIG.preyLifetime) {
            prey.remove();
            const index = preyList.indexOf(prey);
            if (index > -1) preyList.splice(index, 1);
        }
    }

    // ===== COLLISION DETECTION =====

    function checkWebCollision(prey, webData) {
        if (!webData || prey.trapped) return false;

        const dx = prey.x - webData.center.x;
        const dy = prey.y - webData.center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if prey is within web radius
        if (distance < WEB_SIZE) {
            console.log('[Spider Web] Prey caught in web!');
            prey.trapped = true;
            prey.trapX = prey.x;
            prey.trapY = prey.y;

            // Vibrate web
            vibrateWeb(webElement, prey.x, prey.y, 2.0);

            return true;
        }

        return false;
    }

    // ===== SPIDER HUNTING AI =====

    function spiderDetectPrey(pet, webData) {
        if (!webActive || spiderHunting || !webData) return;

        // Check for trapped prey
        const trapped = preyList.find(p => p.trapped && !p.beingEaten);

        if (trapped) {
            console.log('[Spider] Detected trapped prey! Hunting...');
            trappedPrey = trapped;
            spiderHunting = true;

            // Spider runs to prey
            huntPrey(pet, trapped, webData);
        }
    }

    function huntPrey(pet, prey, webData) {
        const container = document.getElementById('roaming-pet-container');
        if (!container) return;

        // Calculate path along web (simplified - direct line for now)
        const currentX = parseInt(container.style.left) || 0;
        const currentY = parseInt(container.style.top) || 0;

        const targetX = prey.trapX;
        const targetY = prey.trapY;

        const distance = Math.sqrt(
            Math.pow(targetX - currentX, 2) +
            Math.pow(targetY - currentY, 2)
        );

        const duration = (distance / CONFIG.spiderSpeed) * 1000;

        console.log('[Spider] Running to prey at', targetX, targetY, 'duration:', duration + 'ms');

        // Animate spider movement
        container.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
        container.style.left = targetX + 'px';
        container.style.top = targetY + 'px';

        // When reached prey
        setTimeout(() => {
            eatPrey(pet, prey, webData);
        }, duration);
    }

    function eatPrey(pet, prey, webData) {
        console.log('[Spider] Eating prey...');

        prey.beingEaten = true;

        // Eating animation - prey shrinks
        prey.style.transition = 'all 1.5s ease-out';
        prey.style.transform = 'scale(0)';
        prey.style.opacity = '0';

        setTimeout(() => {
            prey.remove();
            const index = preyList.indexOf(prey);
            if (index > -1) preyList.splice(index, 1);

            trappedPrey = null;
            spiderHunting = false;

            console.log('[Spider] Prey consumed! Returning to web center...');

            // Return to web center
            const container = document.getElementById('roaming-pet-container');
            if (container && webData) {
                container.style.transition = 'left 2s ease-in-out, top 2s ease-in-out';
                container.style.left = webData.center.x + 'px';
                container.style.top = webData.center.y + 'px';
            }
        }, 1500);
    }

    // ===== MAIN SYSTEM =====

    function startSpiderMode(pet) {
        if (webActive) {
            console.log('[Spider Web] Already in spider mode');
            return;
        }

        console.log('[Spider Web] Starting spider mode!');
        webActive = true;

        // Prefer top-left corner (near image/logo area)
        const corners = ['top-left', 'top-left', 'top-left', 'top-right']; // 75% chance top-left
        webCorner = corners[Math.floor(Math.random() * corners.length)];

        console.log('[Spider Web] Building web in', webCorner);

        // Create web structure
        const webData = createWebStructure(webCorner);

        // Check for nearby elements to attach to
        const nearbyElement = findNearbyElement(webCorner);
        if (nearbyElement) {
            console.log('[Spider Web] Found nearby element to attach:', nearbyElement.element.tagName);
            // Add visual anchor line
            webData.anchorElement = nearbyElement;
        }

        // Create SVG
        webElement = createWebSVG(webData);
        document.body.appendChild(webElement);

        // Animate weaving
        animateWebWeaving(webElement, CONFIG.weavingDuration);

        // Move spider to web center immediately
        const container = document.getElementById('roaming-pet-container');
        if (container) {
            // Position spider in center of web
            container.style.transition = 'left 2s ease-in-out, top 2s ease-in-out';
            container.style.left = (webData.center.x - 15) + 'px'; // -15 to center the pet sprite
            container.style.top = (webData.center.y - 15) + 'px';

            // Add a class to indicate spider is on web
            const pet = document.getElementById('roaming-pet');
            if (pet) {
                pet.classList.add('on-spider-web');
            }
        }

        // Start spawning prey after web is complete
        setTimeout(() => {
            console.log('[Spider Web] Web complete! Starting prey spawning...');
            startPreySpawning();
            startPreyUpdates(webData);
            startHuntingAI(pet, webData);
        }, CONFIG.weavingDuration);

        // Auto-cleanup after duration
        setTimeout(() => {
            stopSpiderMode();
        }, CONFIG.webDuration);
    }

    function startPreySpawning() {
        preySpawnInterval = setInterval(() => {
            if (preyList.length < 3) { // Max 3 prey at once
                const prey = createPrey();
                preyList.push(prey);
                console.log('[Spider Web] Prey spawned');
            }
        }, CONFIG.preySpawnInterval);
    }

    let preyUpdateInterval;
    function startPreyUpdates(webData) {
        let lastTime = Date.now();

        preyUpdateInterval = setInterval(() => {
            const now = Date.now();
            const deltaTime = (now - lastTime) / 1000;
            lastTime = now;

            preyList.forEach(prey => {
                updatePrey(prey, deltaTime);
                checkWebCollision(prey, webData);
            });
        }, 1000 / 60); // 60 FPS
    }

    let huntingInterval;
    function startHuntingAI(pet, webData) {
        huntingInterval = setInterval(() => {
            spiderDetectPrey(pet, webData);
        }, 500); // Check every 500ms
    }

    function stopSpiderMode() {
        console.log('[Spider Web] Spider mode ending...');

        webActive = false;

        if (webElement) {
            webElement.style.transition = 'opacity 2s ease-out';
            webElement.style.opacity = '0';
            setTimeout(() => {
                webElement.remove();
                webElement = null;
            }, 2000);
        }

        if (preySpawnInterval) {
            clearInterval(preySpawnInterval);
            preySpawnInterval = null;
        }

        if (preyUpdateInterval) {
            clearInterval(preyUpdateInterval);
            preyUpdateInterval = null;
        }

        if (huntingInterval) {
            clearInterval(huntingInterval);
            huntingInterval = null;
        }

        // Remove all prey
        preyList.forEach(p => p.remove());
        preyList = [];

        trappedPrey = null;
        spiderHunting = false;

        console.log('[Spider Web] Spider mode ended');
    }

    // ===== EXPORT =====
    window.SpiderWebSystem = {
        start: startSpiderMode,
        stop: stopSpiderMode,
        isActive: () => webActive
    };

    console.log('[Spider Web] System loaded!');
})();
