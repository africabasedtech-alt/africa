(function() {
  var token = localStorage.getItem('ab_token');
  if (!token) return;

  window.exitImpersonation = function() {
    var adminToken = localStorage.getItem('ab_admin_token');
    var adminUser  = localStorage.getItem('ab_admin_user');

    localStorage.removeItem('ab_token');
    localStorage.removeItem('ab_user');
    localStorage.removeItem('impersonating_as');
    localStorage.removeItem('ab_admin_token');
    localStorage.removeItem('ab_admin_user');

    if (adminToken) {
      localStorage.setItem('ab_token', adminToken);
    }
    if (adminUser) {
      localStorage.setItem('ab_user', adminUser);
    }

    fetch('/api/admin/me')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.admin) {
          window.location.href = d.admin.isSubAdmin ? '/sub-admin-panel.html' : '/admin-user.html';
        } else if (adminToken) {
          window.location.href = '/home';
        } else {
          window.location.href = '/login.html';
        }
      })
      .catch(function() {
        if (adminToken) {
          window.location.href = '/home';
        } else {
          window.location.href = '/admin-user.html';
        }
      });
  };

  fetch('/api/auth/me', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function(res) {
    if (!res.ok) return;
    return res.json();
  }).then(function(data) {
    if (!data || !data.isImpersonated) return;

    var isFullAccess = data.impersonateLevel === 'full';
    var username = (data.user && (data.user.username || data.user.email)) || 'user';

    var exitBtn = '<button onclick="exitImpersonation();" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.5);color:#fff;padding:4px 14px;border-radius:5px;cursor:pointer;font-size:0.8rem;margin-left:10px;font-weight:600;" data-testid="exit-impersonation-btn">Exit</button>';

    var banner = document.createElement('div');
    banner.id = 'impersonation-banner';
    banner.setAttribute('data-testid', 'impersonation-banner');

    if (isFullAccess) {
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(90deg,#e67e22,#d35400);color:#fff;text-align:center;padding:10px 16px;font-size:0.9rem;font-weight:700;letter-spacing:0.5px;box-shadow:0 2px 12px rgba(230,126,34,0.4);display:flex;align-items:center;justify-content:center;gap:10px;';
      banner.innerHTML = '<i class="fas fa-user-secret" style="font-size:1.1rem;"></i> FULL ACCESS — Viewing as <strong style="margin:0 4px;">' + username + '</strong>. Full permissions active. ' + exitBtn;
    } else {
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(90deg,#ff6b6b,#ee5a24);color:#fff;text-align:center;padding:10px 16px;font-size:0.9rem;font-weight:700;letter-spacing:0.5px;box-shadow:0 2px 12px rgba(255,107,107,0.4);display:flex;align-items:center;justify-content:center;gap:10px;';
      banner.innerHTML = '<i class="fas fa-eye" style="font-size:1.1rem;"></i> VIEW-ONLY — Viewing as <strong style="margin:0 4px;">' + username + '</strong>. No changes can be made. ' + exitBtn;
    }

    document.body.insertBefore(banner, document.body.firstChild);
    document.body.style.paddingTop = (banner.offsetHeight + 4) + 'px';

    if (!isFullAccess) {
      var ACTION_WORDS = ['invest', 'deposit', 'withdraw', 'send', 'submit', 'save', 'update', 'delete', 'redeem', 'collect', 'confirm', 'pay', 'transfer', 'activate'];

      function lockButton(el) {
        if (el.dataset.impLocked) return;
        var text = (el.textContent || el.value || '').toLowerCase();
        var isAction = ACTION_WORDS.some(function(w) { return text.includes(w); });
        if (isAction) {
          el.disabled = true;
          el.style.opacity = '0.4';
          el.style.cursor = 'not-allowed';
          el.title = 'View-only mode: changes not allowed';
          el.dataset.impLocked = '1';
        }
      }

      function lockAll() {
        document.querySelectorAll('button, input[type="submit"], .btn').forEach(lockButton);
      }

      lockAll();

      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          m.addedNodes.forEach(function(node) {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches('button, input[type="submit"], .btn')) {
              lockButton(node);
            }
            node.querySelectorAll && node.querySelectorAll('button, input[type="submit"], .btn').forEach(lockButton);
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }).catch(function() {});
})();
