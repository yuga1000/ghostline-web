// Crypto currency selector and copy functions
// This should be added to order.html script section

// Update price display based on selected crypto
function updatePriceDisplay() {
    const priceElement = document.querySelector('.price-value');
    const total = parseFloat(document.getElementById('totalPrice').textContent);
    
    if (selectedCrypto === 'BTC') {
        // Convert ETH to BTC (approximate rate)
        const btcPrice = (total * 0.05).toFixed(6); // Example: 1 ETH = 0.05 BTC
        priceElement.innerHTML = `<span id="totalPrice">${btcPrice}</span> BTC`;
    } else if (selectedCrypto === 'USDT') {
        // Convert ETH to USDT (approximate rate)
        const usdtPrice = (total * 2500).toFixed(2); // Example: 1 ETH = 2500 USDT
        priceElement.innerHTML = `<span id="totalPrice">${usdtPrice}</span> USDT`;
    } else {
        priceElement.innerHTML = `<span id="totalPrice">${total.toFixed(3)}</span> ETH`;
    }
}

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

// Add this to the window.addEventListener('load') section:
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
        
        // Update progress
        updateProgress();
        
        // Save state
        saveFormState();
    });
});

// Also update the updateTotalPrice function to call updatePriceDisplay:
// Add this line at the end of updateTotalPrice():
// updatePriceDisplay();
