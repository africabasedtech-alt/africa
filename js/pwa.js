(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').then(function(reg) {
        reg.update();
      }).catch(function () {});
    });
  }

  var deferredPrompt = null;
  var isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    document.querySelectorAll('.ab-install-trigger').forEach(function(el) {
      el.style.display = '';
    });
    var dismissed = localStorage.getItem('ab_pwa_dismissed');
    if (!dismissed) {
      showInstallBanner();
    }
  });

  window.abTriggerInstall = function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        deferredPrompt = null;
        hideBanner();
      });
    } else if (isInstalled) {
      if (typeof showToast === 'function') showToast('App is already installed!', 'info');
      else alert('App is already installed!');
    } else {
      var ua = navigator.userAgent || '';
      if (/iPhone|iPad|iPod/.test(ua)) {
        if (typeof showToast === 'function') showToast('Tap the Share button, then "Add to Home Screen"', 'info');
        else alert('Tap the Share button, then "Add to Home Screen"');
      } else {
        if (typeof showToast === 'function') showToast('Open this site in your browser and tap "Add to Home Screen"', 'info');
        else alert('Open this site in your browser and tap "Add to Home Screen"');
      }
    }
  };

  function showInstallBanner() {
    if (document.getElementById('ab-install-banner')) return;
    if (isInstalled) return;
    var banner = document.createElement('div');
    banner.id = 'ab-install-banner';
    banner.style.cssText = [
      'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
      'background:linear-gradient(135deg,#1a2238,#0f172a)',
      'border:1px solid rgba(212,160,23,0.35)',
      'color:#fff', 'padding:0.75rem 1.2rem',
      'border-radius:14px', 'box-shadow:0 8px 32px rgba(0,0,0,0.4)',
      'display:flex', 'align-items:center', 'gap:0.8rem',
      'z-index:99999', 'font-family:inherit', 'font-size:0.88rem',
      'max-width:340px', 'width:calc(100% - 2rem)', 'animation:slideUp 0.4s ease',
      'backdrop-filter:blur(12px)'
    ].join(';');

    if (!document.getElementById('ab-pwa-keyframes')) {
      var style = document.createElement('style');
      style.id = 'ab-pwa-keyframes';
      style.textContent = '@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
      document.head.appendChild(style);
    }

    banner.innerHTML = [
      '<span style="font-size:1.5rem">📲</span>',
      '<div style="flex:1">',
        '<strong style="display:block;font-size:0.9rem;margin-bottom:2px">Install AfricaBased</strong>',
        '<span style="color:rgba(255,255,255,0.6);font-size:0.8rem">Add to home screen for the best experience</span>',
      '</div>',
      '<button id="ab-install-btn" style="background:linear-gradient(135deg,var(--gold,#d4a017),#b8890f);color:#fff;border:none;border-radius:8px;padding:0.45rem 0.9rem;font-size:0.82rem;font-weight:600;cursor:pointer;white-space:nowrap">Install</button>',
      '<button id="ab-install-dismiss" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:1.1rem;cursor:pointer;padding:0 0.2rem;line-height:1">\u2715</button>'
    ].join('');

    document.body.appendChild(banner);

    document.getElementById('ab-install-btn').addEventListener('click', function () {
      window.abTriggerInstall();
    });

    document.getElementById('ab-install-dismiss').addEventListener('click', hideBanner);
  }

  function hideBanner() {
    var b = document.getElementById('ab-install-banner');
    if (b) b.remove();
    localStorage.setItem('ab_pwa_dismissed', '1');
  }

  window.addEventListener('appinstalled', function () {
    hideBanner();
    deferredPrompt = null;
    isInstalled = true;
    document.querySelectorAll('.ab-install-trigger').forEach(function(el) {
      el.style.display = 'none';
    });
  });
})();
