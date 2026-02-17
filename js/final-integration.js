// Final integration functions for order.html
// Add these functions to the script section

// Copy wallet address function
function copyAddress(crypto) {
    const addressElement = document.getElementById(`address-${crypto}`);
    const address = addressElement.textContent;
    
    navigator.clipboard.writeText(address).then(() => {
        playSound('success');
        
        // Update button text
        const button = addressElement.nextElementSibling;
        button.classList.add('copied');
        button.textContent = 'COPIED!';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.classList.remove('copied');
            button.textContent = 'COPY';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        playSound('success');
        const button = addressElement.nextElementSibling;
        button.classList.add('copied');
        button.textContent = 'COPIED!';
        setTimeout(() => {
            button.classList.remove('copied');
            button.textContent = 'COPY';
        }, 2000);
    });
}

// Add this to window.addEventListener('load') section:

// Crypto currency selector
document.querySelectorAll('.crypto-option').forEach(option => {
    option.addEventListener('click', function() {
        playSound('click');
        
        // Update selection
        document.querySelectorAll('.crypto-option').forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        
        // Get selected crypto
        selectedCrypto = this.dataset.crypto;
        
        // Show corresponding wallet
        document.querySelectorAll('.wallet-box').forEach(wallet => {
            wallet.style.display = 'none';
        });
        document.getElementById(`wallet-${selectedCrypto}`).style.display = 'block';
        
        // Update price display
        updatePriceDisplay();
        updateProgress();
        
        // Save state
        saveFormState();
    });
});

// Initialize progress on first load
setTimeout(() => {
    updateProgress();
}, 300);
