(function() {
  var token = localStorage.getItem('ab_token');
  if (!token) return;

  window.exitImpersonation = function() {
    var adminToken = localStorage.getItem('ab_admin_token');
    var adminUser = localStorage.getItem('ab_admin_user');
    localStorage.removeItem('ab_token');
    localStorage.removeItem('ab_user');
    localStorage.removeItem('impersonating_as');
    if (adminToken) {
      localStorage.setItem('ab_token', adminToken);
      localStorage.removeItem('ab_admin_token');
    }
    if (adminUser) {
      localStorage.setItem('ab_user', adminUser);
      localStorage.removeItem('ab_admin_user');
    }
    if (!adminToken) {
      window.location.href = '/login.html';
    } else {
      fetch('/api/admin/me').then(function(r){return r.json();}).then(function(d){
        if (d.admin && d.admin.isSubAdmin) {
          window.location.href = '/sub-admin-panel.html';
        } else {
          window.location.href = '/admin-user.html';
        }
      }).catch(function(){
        window.location.href = '/admin-user.html';
      });
    }
  };

  fetch('/api/auth/me', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function(res) {
    if (!res.ok) return;
    return res.json();
  }).then(function(data) {
    if (!data || !data.isImpersonated) return;

    var isFullAccess = data.impersonateLevel === 'full';
    var banner = document.createElement('div');
    banner.id = 'impersonation-banner';
    banner.setAttribute('data-testid', 'impersonation-banner');

    var exitBtn = '<button onclick="exitImpersonation();" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.5);color:#fff;padding:4px 14px;border-radius:5px;cursor:pointer;font-size:0.8rem;margin-left:10px;font-weight:600;" data-testid="exit-impersonation-btn">Exit</button>';

    if (isFullAccess) {
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(90deg,#e67e22,#d35400);color:#fff;text-align:center;padding:10px 16px;font-size:0.9rem;font-weight:700;letter-spacing:0.5px;box-shadow:0 2px 12px rgba(230,126,34,0.4);display:flex;align-items:center;justify-content:center;gap:10px;';
      banner.innerHTML = '<i class="fas fa-user-secret" style="font-size:1.1rem;"></i> FULL ACCESS MODE — You are acting as this user with full permissions. ' + exitBtn;
    } else {
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(90deg,#ff6b6b,#ee5a24);color:#fff;text-align:center;padding:10px 16px;font-size:0.9rem;font-weight:700;letter-spacing:0.5px;box-shadow:0 2px 12px rgba(255,107,107,0.4);display:flex;align-items:center;justify-content:center;gap:10px;';
      banner.innerHTML = '<i class="fas fa-eye" style="font-size:1.1rem;"></i> VIEW-ONLY MODE — You are viewing this account as an admin. No changes can be made. ' + exitBtn;
    }
    document.body.insertBefore(banner, document.body.firstChild);
    document.body.style.paddingTop = (banner.offsetHeight) + 'px';

    if (!isFullAccess) {
      document.querySelectorAll('button, input[type="submit"], .btn').forEach(function(el) {
        var text = (el.textContent || el.value || '').toLowerCase();
        var isAction = ['invest', 'deposit', 'withdraw', 'send', 'submit', 'save', 'update', 'delete', 'redeem', 'collect', 'confirm', 'pay', 'transfer'].some(function(w) { return text.includes(w); });
        if (isAction) {
          el.disabled = true;
          el.style.opacity = '0.4';
          el.style.cursor = 'not-allowed';
          el.title = 'View-only mode: changes not allowed';
        }
      });
    }
  }).catch(function() {});
})();
