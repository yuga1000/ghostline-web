// GHOSTLINE Spider Animation
// Extracted from pixel editor sprite sheet

const SPIDER_FRAMES = {
    // Frame 1 - legs down
    frame1: [
        // Body
        {x: 14, y: 12, color: '#00ff00'},
        {x: 15, y: 12, color: '#00ff00'},
        {x: 16, y: 12, color: '#00ff00'},
        {x: 17, y: 12, color: '#00ff00'},
        {x: 13, y: 13, color: '#00ff00'},
        {x: 14, y: 13, color: '#00ff00'},
        {x: 15, y: 13, color: '#00ff00'},
        {x: 16, y: 13, color: '#00ff00'},
        {x: 17, y: 13, color: '#00ff00'},
        {x: 18, y: 13, color: '#00ff00'},
        {x: 12, y: 14, color: '#00ff00'},
        {x: 13, y: 14, color: '#00ff00'},
        {x: 14, y: 14, color: '#00ff00'},
        {x: 15, y: 14, color: '#00ff00'},
        {x: 16, y: 14, color: '#00ff00'},
        {x: 17, y: 14, color: '#00ff00'},
        {x: 18, y: 14, color: '#00ff00'},
        {x: 19, y: 14, color: '#00ff00'},
        {x: 12, y: 15, color: '#00ff00'},
        {x: 13, y: 15, color: '#00ff00'},
        {x: 14, y: 15, color: '#00ff00'},
        {x: 15, y: 15, color: '#00ff00'},
        {x: 16, y: 15, color: '#00ff00'},
        {x: 17, y: 15, color: '#00ff00'},
        {x: 18, y: 15, color: '#00ff00'},
        {x: 19, y: 15, color: '#00ff00'},
        {x: 13, y: 16, color: '#00ff00'},
        {x: 14, y: 16, color: '#00ff00'},
        {x: 15, y: 16, color: '#00ff00'},
        {x: 16, y: 16, color: '#00ff00'},
        {x: 17, y: 16, color: '#00ff00'},
        {x: 18, y: 16, color: '#00ff00'},
        {x: 14, y: 17, color: '#00ff00'},
        {x: 15, y: 17, color: '#00ff00'},
        {x: 16, y: 17, color: '#00ff00'},
        {x: 17, y: 17, color: '#00ff00'},
        // Left legs (straight)
        {x: 0, y: 14, color: '#00ff00'},
        {x: 1, y: 14, color: '#00ff00'},
        {x: 2, y: 14, color: '#00ff00'},
        {x: 3, y: 14, color: '#00ff00'},
        {x: 4, y: 14, color: '#00ff00'},
        {x: 5, y: 14, color: '#00ff00'},
        {x: 6, y: 14, color: '#00ff00'},
        {x: 7, y: 14, color: '#00ff00'},
        {x: 8, y: 14, color: '#00ff00'},
        {x: 9, y: 14, color: '#00ff00'},
        {x: 10, y: 14, color: '#00ff00'},
        {x: 0, y: 15, color: '#00ff00'},
        {x: 1, y: 15, color: '#00ff00'},
        {x: 2, y: 15, color: '#00ff00'},
        {x: 3, y: 15, color: '#00ff00'},
        {x: 4, y: 15, color: '#00ff00'},
        {x: 5, y: 15, color: '#00ff00'},
        {x: 6, y: 15, color: '#00ff00'},
        {x: 7, y: 15, color: '#00ff00'},
        {x: 8, y: 15, color: '#00ff00'},
        {x: 9, y: 15, color: '#00ff00'},
        {x: 10, y: 15, color: '#00ff00'},
        // Right legs (straight)
        {x: 21, y: 14, color: '#00ff00'},
        {x: 22, y: 14, color: '#00ff00'},
        {x: 23, y: 14, color: '#00ff00'},
        {x: 24, y: 14, color: '#00ff00'},
        {x: 25, y: 14, color: '#00ff00'},
        {x: 26, y: 14, color: '#00ff00'},
        {x: 27, y: 14, color: '#00ff00'},
        {x: 28, y: 14, color: '#00ff00'},
        {x: 29, y: 14, color: '#00ff00'},
        {x: 30, y: 14, color: '#00ff00'},
        {x: 31, y: 14, color: '#00ff00'},
        {x: 21, y: 15, color: '#00ff00'},
        {x: 22, y: 15, color: '#00ff00'},
        {x: 23, y: 15, color: '#00ff00'},
        {x: 24, y: 15, color: '#00ff00'},
        {x: 25, y: 15, color: '#00ff00'},
        {x: 26, y: 15, color: '#00ff00'},
        {x: 27, y: 15, color: '#00ff00'},
        {x: 28, y: 15, color: '#00ff00'},
        {x: 29, y: 15, color: '#00ff00'},
        {x: 30, y: 15, color: '#00ff00'},
        {x: 31, y: 15, color: '#00ff00'}
    ],

    // Frame 2 - legs up/bent (walking motion)
    frame2: [
        // Body (same)
        {x: 14, y: 12, color: '#00ff00'},
        {x: 15, y: 12, color: '#00ff00'},
        {x: 16, y: 12, color: '#00ff00'},
        {x: 17, y: 12, color: '#00ff00'},
        {x: 13, y: 13, color: '#00ff00'},
        {x: 14, y: 13, color: '#00ff00'},
        {x: 15, y: 13, color: '#00ff00'},
        {x: 16, y: 13, color: '#00ff00'},
        {x: 17, y: 13, color: '#00ff00'},
        {x: 18, y: 13, color: '#00ff00'},
        {x: 12, y: 14, color: '#00ff00'},
        {x: 13, y: 14, color: '#00ff00'},
        {x: 14, y: 14, color: '#00ff00'},
        {x: 15, y: 14, color: '#00ff00'},
        {x: 16, y: 14, color: '#00ff00'},
        {x: 17, y: 14, color: '#00ff00'},
        {x: 18, y: 14, color: '#00ff00'},
        {x: 19, y: 14, color: '#00ff00'},
        {x: 12, y: 15, color: '#00ff00'},
        {x: 13, y: 15, color: '#00ff00'},
        {x: 14, y: 15, color: '#00ff00'},
        {x: 15, y: 15, color: '#00ff00'},
        {x: 16, y: 15, color: '#00ff00'},
        {x: 17, y: 15, color: '#00ff00'},
        {x: 18, y: 15, color: '#00ff00'},
        {x: 19, y: 15, color: '#00ff00'},
        {x: 13, y: 16, color: '#00ff00'},
        {x: 14, y: 16, color: '#00ff00'},
        {x: 15, y: 16, color: '#00ff00'},
        {x: 16, y: 16, color: '#00ff00'},
        {x: 17, y: 16, color: '#00ff00'},
        {x: 18, y: 16, color: '#00ff00'},
        {x: 14, y: 17, color: '#00ff00'},
        {x: 15, y: 17, color: '#00ff00'},
        {x: 16, y: 17, color: '#00ff00'},
        {x: 17, y: 17, color: '#00ff00'},
        // Bent legs - upper left
        {x: 10, y: 10, color: '#00ff00'},
        {x: 11, y: 10, color: '#00ff00'},
        {x: 10, y: 11, color: '#00ff00'},
        {x: 11, y: 11, color: '#00ff00'},
        {x: 10, y: 12, color: '#00ff00'},
        {x: 11, y: 12, color: '#00ff00'},
        // Bent legs - upper right
        {x: 20, y: 10, color: '#00ff00'},
        {x: 21, y: 10, color: '#00ff00'},
        {x: 20, y: 11, color: '#00ff00'},
        {x: 21, y: 11, color: '#00ff00'},
        {x: 20, y: 12, color: '#00ff00'},
        {x: 21, y: 12, color: '#00ff00'},
        // Bent legs - middle left
        {x: 6, y: 12, color: '#00ff00'},
        {x: 7, y: 12, color: '#00ff00'},
        {x: 6, y: 13, color: '#00ff00'},
        {x: 7, y: 13, color: '#00ff00'},
        {x: 8, y: 13, color: '#00ff00'},
        {x: 9, y: 13, color: '#00ff00'},
        // Bent legs - middle right
        {x: 24, y: 12, color: '#00ff00'},
        {x: 25, y: 12, color: '#00ff00'},
        {x: 24, y: 13, color: '#00ff00'},
        {x: 25, y: 13, color: '#00ff00'},
        {x: 22, y: 13, color: '#00ff00'},
        {x: 23, y: 13, color: '#00ff00'},
        // Bent legs - lower left
        {x: 3, y: 18, color: '#00ff00'},
        {x: 4, y: 18, color: '#00ff00'},
        {x: 5, y: 18, color: '#00ff00'},
        {x: 6, y: 18, color: '#00ff00'},
        {x: 7, y: 18, color: '#00ff00'},
        {x: 8, y: 18, color: '#00ff00'},
        {x: 9, y: 18, color: '#00ff00'},
        {x: 10, y: 18, color: '#00ff00'},
        {x: 3, y: 19, color: '#00ff00'},
        {x: 4, y: 19, color: '#00ff00'},
        {x: 5, y: 19, color: '#00ff00'},
        {x: 6, y: 19, color: '#00ff00'},
        {x: 7, y: 19, color: '#00ff00'},
        {x: 8, y: 19, color: '#00ff00'},
        // Bent legs - lower right
        {x: 21, y: 18, color: '#00ff00'},
        {x: 22, y: 18, color: '#00ff00'},
        {x: 23, y: 18, color: '#00ff00'},
        {x: 24, y: 18, color: '#00ff00'},
        {x: 25, y: 18, color: '#00ff00'},
        {x: 26, y: 18, color: '#00ff00'},
        {x: 27, y: 18, color: '#00ff00'},
        {x: 28, y: 18, color: '#00ff00'},
        {x: 25, y: 19, color: '#00ff00'},
        {x: 26, y: 19, color: '#00ff00'},
        {x: 27, y: 19, color: '#00ff00'},
        {x: 28, y: 19, color: '#00ff00'}
    ]
};

// Function to render spider frame
function renderSpiderFrame(ctx, frame, x, y, pixelSize = 3) {
    SPIDER_FRAMES[frame].forEach(pixel => {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(
            x + pixel.x * pixelSize,
            y + pixel.y * pixelSize,
            pixelSize,
            pixelSize
        );
    });
}

// Spider animation class
class SpiderPet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.currentFrame = 'frame1';
        this.frameTime = 0;
        this.frameDelay = 200; // ms between frames
        this.pixelSize = 3;
    }

    update(deltaTime) {
        this.frameTime += deltaTime;

        if (this.frameTime >= this.frameDelay) {
            this.currentFrame = this.currentFrame === 'frame1' ? 'frame2' : 'frame1';
            this.frameTime = 0;
        }

        // Optional: make spider crawl
        this.x += 0.5; // Move right slowly
        if (this.x > window.innerWidth) {
            this.x = -100; // Reset to left
        }
    }

    render(ctx) {
        renderSpiderFrame(ctx, this.currentFrame, this.x, this.y, this.pixelSize);
    }
}

console.log('🕷️ Spider animation loaded!');
