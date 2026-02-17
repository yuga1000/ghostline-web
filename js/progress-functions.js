// Progress Indicator Functions for order.html
// Add this to the script section

// Progress indicator management
function updateProgress() {
    let progress = 0;
    let currentStep = 0;
    
    // Reset all steps
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    // Check SIZE (25%)
    if (document.querySelector('input[name="size"]:checked')) {
        progress += 25;
        document.getElementById('step1').classList.add('completed');
        currentStep = 1;
    } else {
        document.getElementById('step1').classList.add('active');
    }
    
    // Check VIBE (25%) - optional, always marked as completed if size is done
    if (currentStep >= 1) {
        progress += 25;
        document.getElementById('step2').classList.add('completed');
        currentStep = 2;
    }
    
    // Check FORMAT (25%)
    if (document.querySelector('input[name="format"]:checked')) {
        progress += 25;
        document.getElementById('step3').classList.add('completed');
        currentStep = 3;
    } else if (currentStep >= 2) {
        document.getElementById('step3').classList.add('active');
    }
    
    // Check PAYMENT (25%)
    const email = document.getElementById('email').value;
    const txHash = document.getElementById('txHash').value;
    
    if (currentStep >= 3) {
        // Payment section is active
        if (validateEmail(email) && validateTxHash(txHash)) {
            progress += 25;
            document.getElementById('step4').classList.add('completed');
        } else {
            document.getElementById('step4').classList.add('active');
            // Partial progress for payment section
            if (validateEmail(email)) {
                progress += 12.5; // Half of payment progress for valid email
            }
            if (selectedCrypto !== 'ETH') {
                progress += 6.25; // Quarter for selecting payment method
            }
            if (txHash.length > 0) {
                progress += 6.25; // Quarter for starting to enter tx hash
            }
        }
    }
    
    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = progress + '%';
    
    // Add effects based on progress
    if (progress === 100) {
        progressFill.style.background = 'linear-gradient(90deg, #00ff00 0%, #44ff88 50%, #88ffcc 100%)';
        progressFill.style.boxShadow = '0 0 30px #00ff00, inset 0 0 10px rgba(255,255,255,0.3)';
        
        // Add pulse animation to submit button
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.style.animation = 'pulse 1s ease-in-out infinite';
        }
    } else if (progress >= 75) {
        progressFill.style.background = 'linear-gradient(90deg, #00ff00 0%, #44ff88 100%)';
        progressFill.style.boxShadow = '0 0 20px #00ff00';
    } else if (progress >= 50) {
        progressFill.style.background = 'linear-gradient(90deg, #00cc00 0%, #00ff00 100%)';
        progressFill.style.boxShadow = '0 0 15px #00ff00';
    } else if (progress >= 25) {
        progressFill.style.background = 'linear-gradient(90deg, #008800 0%, #00cc00 100%)';
        progressFill.style.boxShadow = '0 0 10px #00ff00';
    } else {
        progressFill.style.background = '#00ff00';
        progressFill.style.boxShadow = '0 0 5px #00ff00';
    }
    
    // Show percentage in console for debugging
    console.log(`Form progress: ${progress}%`);
}

// Initialize progress on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initial progress check
    setTimeout(() => {
        updateProgress();
    }, 500);
});

// Add these event listeners to update progress on changes:
// (Add to existing event listeners in order.html)

// For size selection:
// Add: updateProgress();

// For vibe selection:
// Add: updateProgress();

// For format selection:
// Add: updateProgress();

// For crypto selection:
// Add: updateProgress();

// For email input:
// Add to existing email event listener:
// updateProgress();

// For transaction hash input:
// Add to existing txHash event listener:
// updateProgress();

// CSS Animation for pulse (add to style section):
/*
@keyframes pulse {
    0%, 100% { 
        transform: scale(1); 
        box-shadow: inset 0 0 30px rgba(0, 255, 0, 0.4);
    }
    50% { 
        transform: scale(1.02); 
        box-shadow: inset 0 0 40px rgba(0, 255, 0, 0.6), 0 0 30px rgba(0, 255, 0, 0.8);
    }
}
*/
