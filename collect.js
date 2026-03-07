// Simple collection function
function collectIncome(index) {
    alert("Collection started for index: " + index);
    
    try {
        const myProducts = JSON.parse(localStorage.getItem('myProducts') || '[]');
        const product = myProducts[index];
        
        if (product) {
            const amount = product.dailyIncome || 0;
            const balance = parseFloat(localStorage.getItem('walletBalance') || '0');
            
            localStorage.setItem('walletBalance', (balance + amount).toString());
            product.lastCollected = new Date().getTime();
            product.collectedAmount = (product.collectedAmount || 0) + amount;
            
            myProducts[index] = product;
            localStorage.setItem('myProducts', JSON.stringify(myProducts));
            
            alert("Collected KSH " + amount);
            location.reload();
        } else {
            alert("Product not found!");
        }
    } catch (e) {
        alert("Error during collection: " + e.message);
    }
}
