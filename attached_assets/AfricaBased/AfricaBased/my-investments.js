// my-investments.js
// This script loads and displays the user's invested products from localStorage on the My-products.html page

// Global collect function
window.handleCollectIncome = function(index) {
    const myProducts = JSON.parse(localStorage.getItem('myProducts') || '[]');
    const product = myProducts[index];
    if (!product) {
        alert('Product not found!');
        return;
    }

    const now = new Date();
    const lastCollected = product.lastCollected ? new Date(product.lastCollected) : new Date(product.investedAt);
    const daysSinceCollection = Math.floor((now - lastCollected) / (1000 * 60 * 60 * 24));
    const totalDaysInvested = Math.floor((now - new Date(product.investedAt)) / (1000 * 60 * 60 * 24));

    if (totalDaysInvested >= product.holdPeriod) {
        alert('Investment period is over!');
        return;
    }
    
    if (daysSinceCollection > 0) {
        // Update wallet balance
        const currentBalance = parseFloat(localStorage.getItem('walletBalance') || '0');
        const amount = product.dailyIncome;
        localStorage.setItem('walletBalance', (currentBalance + amount).toString());

        // Update product
        product.lastCollected = now.getTime();
        product.collectedAmount = (product.collectedAmount || 0) + amount;
        myProducts[index] = product;
        localStorage.setItem('myProducts', JSON.stringify(myProducts));

        alert('Successfully collected KSH ' + amount + ' from ' + product.name);
        location.reload(); // Refresh to show updated values
    } else {
        alert('No income available to collect yet. Next collection available at: ' + 
              new Date(lastCollected.getTime() + 24*60*60*1000).toLocaleTimeString());
    }
};

alert('Script loaded!'); // Verify script loading

// Make collectIncome function global
window.handleCollectIncome = function(index) {
    alert('Collection clicked for index:                                     <button onclick="handleCollectIncome(${idx})" class="collect-btn action-btn mt-1 w-100" ${collectableAmount === 0 ? 'disabled' : ''}>
                                        Collect Income
                                    </button> index);
    const myProducts = JSON.parse(localStorage.getItem('myProducts') || '[]');
    const product = myProducts[index];
    if (!product) return;

    const now = new Date();
    const lastCollected = product.lastCollected ? new Date(product.lastCollected) : new Date(product.investedAt);
    const daysSinceCollection = Math.floor((now - lastCollected) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCollection > 0) {
        // Update wallet balance
        const currentBalance = parseFloat(localStorage.getItem('walletBalance') || '0');
        const amount = product.dailyIncome;
        localStorage.setItem('walletBalance', (currentBalance + amount).toString());

        // Update product
        product.lastCollected = now.getTime();
        product.collectedAmount = (product.collectedAmount || 0) + amount;
        myProducts[index] = product;
        localStorage.setItem('myProducts', JSON.stringify(myProducts));

        alert('Successfully collected KSH ' + amount + ' from ' + product.name);
        location.reload(); // Refresh to show updated values
    } else {
        alert('No income available to collect yet');
    }
};

// Utility Functions
function getWalletBalance() {
    return parseFloat(localStorage.getItem('walletBalance') || '0');
}

function setWalletBalance(amount) {
    localStorage.setItem('walletBalance', amount.toString());
}

function updateDashboardSummary(myProducts) {
    const totalInvested = document.getElementById('total-invested');
    const totalDailyReturns = document.getElementById('total-daily-returns');
    const activeInvestments = document.getElementById('active-investments');
    const totalEarnings = document.getElementById('total-earnings');

    let invested = 0, dailyReturns = 0, active = 0, earnings = 0;

    myProducts.forEach(prod => {
        invested += prod.price || 0;
        dailyReturns += prod.dailyIncome || 0;
        
        const investedDate = new Date(prod.investedAt);
        const daysSinceInvestment = Math.floor((Date.now() - investedDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceInvestment <= prod.holdPeriod) {
            active++;
        }

        // Calculate earnings
        const lastCollected = prod.lastCollected ? new Date(prod.lastCollected) : investedDate;
        const daysSinceCollection = Math.floor((Date.now() - lastCollected) / (1000 * 60 * 60 * 24));
        earnings += prod.collectedAmount || 0;
    });

    totalInvested.textContent = `KSH ${invested.toLocaleString()}`;
    totalDailyReturns.textContent = `KSH ${dailyReturns.toLocaleString()}`;
    activeInvestments.textContent = active.toString();
    totalEarnings.textContent = `KSH ${earnings.toLocaleString()}`;
}

function calculateCollectableAmount(product) {
    const lastCollected = product.lastCollected ? new Date(product.lastCollected) : new Date(product.investedAt);
    const now = new Date();
    const daysSinceCollection = Math.max(0, Math.floor((now - lastCollected) / (1000 * 60 * 60 * 24)));
    const investedDate = new Date(product.investedAt);
    const totalDaysInvested = Math.floor((now - investedDate) / (1000 * 60 * 60 * 24));
    
    if (totalDaysInvested >= product.holdPeriod) {
        return 0; // Investment period is over
    }

    return Math.min(daysSinceCollection, product.holdPeriod) * product.dailyIncome;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    const investmentsContainer = document.getElementById('investments-container');
    const noInvestments = document.getElementById('no-investments');

    if (!investmentsContainer) {
        console.error('Investments container not found!');
        return;
    }
    
    // Initialize free machine if not exists
    let myProducts = [];
    try {
        myProducts = JSON.parse(localStorage.getItem('myProducts')) || [];
        const hasFreeMachine = myProducts.some(p => p.name === 'Free Product');
        if (!hasFreeMachine) {
            myProducts.push({
                name: 'Free Product',
                sector: 'Promo',
                image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80',
                description: 'A free product for every user. Earn KSH 20 per day for 2 days.',
                price: 0,
                dailyIncome: 20,
                holdPeriod: 2,
                investedAt: Date.now(),
                lastCollected: null,
                collectedAmount: 0
            });
            localStorage.setItem('myProducts', JSON.stringify(myProducts));
        }
    } catch (e) {
        myProducts = [];
    }

    // Hide/show empty state
    if (!myProducts.length) {
        investmentsContainer.style.display = 'none';
        noInvestments.style.display = 'block';
        return;
    } else {
        investmentsContainer.style.display = 'flex';
        noInvestments.style.display = 'none';
    }

    // Update dashboard summary
    updateDashboardSummary(myProducts);

    // Create modal for messages
    function showModal(title, message, type = 'success') {
        // Remove existing modal if any
        const existingModal = document.querySelector('.message-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'message-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-icon">
                        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                    </div>
                    <h3 class="modal-title">${title}</h3>
                    <p class="modal-message">${message}</p>
                    <button class="modal-button" onclick="this.closest('.message-modal').remove()">OK</button>
                </div>
            </div>
        `;

        // Add styles for the modal
        const style = document.createElement('style');
        style.textContent = `
            .message-modal .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            }
            .message-modal .modal-content {
                background: linear-gradient(45deg, #2c2c2c, #333);
                border: 2px solid #4ecdc4;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                max-width: 400px;
                width: 90%;
                animation: slideIn 0.3s ease;
            }
            .message-modal .modal-icon {
                font-size: 3rem;
                margin-bottom: 20px;
                color: ${type === 'success' ? '#4ecdc4' : '#ff6b6b'};
            }
            .message-modal .modal-title {
                color: #fff;
                font-size: 1.5rem;
                margin-bottom: 15px;
            }
            .message-modal .modal-message {
                color: #ccc;
                margin-bottom: 25px;
                font-size: 1.1rem;
            }
            .message-modal .modal-button {
                background: linear-gradient(45deg, #4ecdc4, #45b7af);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .message-modal .modal-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(78,205,196,0.2);
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;

        document.body.appendChild(style);
        document.body.appendChild(modal);

        // Auto-remove modal after 3 seconds
        setTimeout(() => {
            modal.remove();
        }, 3000);
    }

    // Handle collecting income
    function collectIncome(index) {
        const product = myProducts[index];
        const amount = calculateCollectableAmount(product);
        
        if (amount > 0) {
            // Update wallet balance
            const currentBalance = getWalletBalance();
            setWalletBalance(currentBalance + amount);

            // Update product details
            product.lastCollected = Date.now();
            product.collectedAmount = (product.collectedAmount || 0) + amount;
            localStorage.setItem('myProducts', JSON.stringify(myProducts));

            // Update the UI
            updateDashboardSummary(myProducts);
            renderInvestments();

            showModal(
                'Collection Successful!', 
                `You have collected KSH ${amount.toLocaleString()} from your ${product.name}.`,
                'success'
            );
        } else {
            showModal(
                'Collection Failed', 
                'No income available to collect at this time.',
                'error'
            );
        }
    }

    function renderInvestments() {
        investmentsContainer.innerHTML = myProducts.map((prod, idx) => {
            const collectableAmount = calculateCollectableAmount(prod);
            const investedDate = new Date(prod.investedAt);
            const totalDaysInvested = Math.floor((Date.now() - investedDate) / (1000 * 60 * 60 * 24));
            const isActive = totalDaysInvested < prod.holdPeriod;
            
            return `
                <div class="col-md-6 col-lg-4">
                    <div class="investment-card">
                        <img src="${prod.image || ''}" alt="${prod.name}" class="investment-image">
                        <div class="investment-details">
                            <div class="investment-title">${prod.name}</div>
                            <div class="investment-sector">${prod.sector || ''}</div>
                            <div class="info-grid">
                                <div class="info-box">
                                    <div class="info-label">Invested Amount</div>
                                    <div class="info-value">KSH ${prod.price?.toLocaleString() || 0}</div>
                                </div>
                                <div class="info-box">
                                    <div class="info-label">Daily Returns</div>
                                    <div class="info-value">KSH ${prod.dailyIncome?.toLocaleString() || 0}</div>
                                </div>
                                <div class="info-box">
                                    <div class="info-label">Duration</div>
                                    <div class="info-value">${totalDaysInvested}/${prod.holdPeriod} days</div>
                                </div>
                                <div class="info-box">
                                    <div class="info-label">Status</div>
                                    <div class="info-value" style="color: ${isActive ? '#4ecdc4' : '#ff6b6b'}">${isActive ? 'Active' : 'Expired'}</div>
                                </div>
                            </div>
                            <div class="earnings-box">
                                <div class="earnings-grid">
                                    <div>
                                        <div class="info-label">Total Collected</div>
                                        <div class="info-value">KSH ${(prod.collectedAmount || 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div class="info-label">Available to Collect</div>
                                        <div class="info-value">KSH ${collectableAmount.toLocaleString()}</div>
                                    </div>
                                </div>
                                ${isActive ? `
                                    <div class="info-label mt-3" style="text-align: center;">Next Collection Available</div>
                                    <div class="info-value mb-3" style="text-align: center; color: #4ecdc4;">
                                        ${collectableAmount > 0 ? 'Now' : 
                                          new Date(prod.lastCollected ? new Date(prod.lastCollected).getTime() + 24*60*60*1000 : new Date(prod.investedAt).getTime() + 24*60*60*1000).toLocaleTimeString()}
                                    </div>
                                    <button data-index="${idx}" class="collect-btn action-btn mt-1 w-100" ${collectableAmount === 0 ? 'disabled' : ''}>
                                        Collect Income
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Initial render
    renderInvestments();

    console.log('Setting up click handlers');

    // Add event listeners for collect buttons
    investmentsContainer.addEventListener('click', (event) => {
        console.log('Container clicked', event.target);
        const collectBtn = event.target.closest('.collect-btn');
        if (collectBtn) {
            console.log('Collect button clicked', collectBtn.dataset.index);
            const index = parseInt(collectBtn.dataset.index);
            if (!isNaN(index)) {
                collectIncome(index);
            } else {
                console.error('Invalid index:', collectBtn.dataset.index);
            }
        }
    });

    // Also add direct button handlers after render
    document.querySelectorAll('.collect-btn').forEach(btn => {
        console.log('Found collect button:', btn.dataset.index);
        btn.addEventListener('click', (e) => {
            console.log('Direct button click:', e.currentTarget.dataset.index);
            const index = parseInt(e.currentTarget.dataset.index);
            if (!isNaN(index)) {
                collectIncome(index);
            }
        });
    });
})();  // End of IIFE
