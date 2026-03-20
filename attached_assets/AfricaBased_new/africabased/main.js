
// Deposit mode switcher: Intercept Deposit link clicks and redirect based on admin setting
document.addEventListener('DOMContentLoaded', function() {
	// Find all links to deposit.html
	var depositLinks = document.querySelectorAll('a[href="deposit.html"]');
	if (!depositLinks.length) return;
	depositLinks.forEach(function(link) {
		link.addEventListener('click', function(e) {
			// Only intercept left-clicks, not ctrl/cmd/alt/shift or middle-click
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
			var mode = localStorage.getItem('activeDepositMode') || 'manual';
			if (mode === 'auto') {
				e.preventDefault();
				window.location.href = 'auto-deposit.html';
			} // else let default go to deposit.html
		});
	});
});
// Intercept Deposit link clicks and redirect based on admin-set mode
document.addEventListener('DOMContentLoaded', function() {
	// Find all links to deposit.html
	var depositLinks = Array.from(document.querySelectorAll('a[href="deposit.html"]'));
	depositLinks.forEach(function(link) {
		link.addEventListener('click', function(e) {
			// Check mode from localStorage
			var mode = localStorage.getItem('activeDepositMode') || 'manual';
			if (mode === 'auto') {
				e.preventDefault();
				window.location.href = 'auto-deposit.html';
			} else if (mode === 'manual') {
				// Default: let it go to deposit.html
				// (Optional: could force reload)
			}
		});
	});
});
