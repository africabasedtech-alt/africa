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
    } else {
      var link = document.createElement('a');
      link.href = '/manifest.json';
      link.setAttribute('rel', 'manifest');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function() {
        if (typeof showToast === 'function') showToast('If install did not start, tap your browser menu and select "Add to Home Screen" or "Install App"', 'info');
        else alert('If install did not start, tap your browser menu and select "Add to Home Screen" or "Install App"');
      }, 1500);
    }
  };

  function showInstallBanner() {
    if (document.getElementById('ab-install-banner')) return;
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

  // ═══ Offline / Online notification banner ═══
  (function () {
    var offlineBanner = null;
    var onlineTimeout = null;

    function injectStyles() {
      if (document.getElementById('ab-net-styles')) return;
      var s = document.createElement('style');
      s.id = 'ab-net-styles';
      s.textContent = [
        '@keyframes abNetSlide{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}',
        '@keyframes abNetFade{from{opacity:1}to{opacity:0}}',
        '#ab-net-banner{position:fixed;top:0;left:0;right:0;z-index:999999;display:flex;align-items:center;gap:10px;',
        'padding:12px 16px;font-family:"Plus Jakarta Sans",sans-serif;font-size:0.88rem;font-weight:600;',
        'animation:abNetSlide 0.35s ease;box-shadow:0 4px 20px rgba(0,0,0,0.3)}',
        '#ab-net-banner.offline{background:linear-gradient(135deg,#b71c1c,#c62828);color:#fff}',
        '#ab-net-banner.online{background:linear-gradient(135deg,#1b5e20,#2e7d32);color:#fff}',
        '#ab-net-banner .ab-net-icon{font-size:1.15rem;flex-shrink:0}',
        '#ab-net-banner .ab-net-text{flex:1}',
        '#ab-net-banner.fade-out{animation:abNetFade 0.4s ease forwards}'
      ].join('');
      document.head.appendChild(s);
    }

    function showBanner(type) {
      removeBanner(true);
      injectStyles();
      offlineBanner = document.createElement('div');
      offlineBanner.id = 'ab-net-banner';
      offlineBanner.className = type;
      if (type === 'offline') {
        offlineBanner.innerHTML = '<span class="ab-net-icon"><i class="fas fa-wifi-slash" style="display:inline"></i><i class="fas fa-exclamation-triangle" style="display:none"></i></span><span class="ab-net-text">You are offline. Some features may be unavailable.</span>';
        var icon = offlineBanner.querySelector('.fa-wifi-slash');
        if (!icon) {
          offlineBanner.querySelector('.ab-net-icon').innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        }
      } else {
        offlineBanner.innerHTML = '<span class="ab-net-icon"><i class="fas fa-wifi"></i></span><span class="ab-net-text">Back online!</span>';
        onlineTimeout = setTimeout(function () {
          if (offlineBanner) {
            offlineBanner.classList.add('fade-out');
            setTimeout(function () { removeBanner(false); }, 450);
          }
        }, 3000);
      }
      document.body.appendChild(offlineBanner);
    }

    function removeBanner(immediate) {
      if (onlineTimeout) { clearTimeout(onlineTimeout); onlineTimeout = null; }
      if (offlineBanner) {
        if (immediate) { offlineBanner.remove(); offlineBanner = null; }
        else { offlineBanner.remove(); offlineBanner = null; }
      }
      var existing = document.getElementById('ab-net-banner');
      if (existing) existing.remove();
    }

    window.addEventListener('offline', function () { showBanner('offline'); });
    window.addEventListener('online', function () { showBanner('online'); });

    if (!navigator.onLine) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { showBanner('offline'); });
      } else {
        showBanner('offline');
      }
    }
  })();
})();
