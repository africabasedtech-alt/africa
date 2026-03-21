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
      deferredPrompt.userChoice.then(function (choice) {
        deferredPrompt = null;
        hideBanner();
        if (choice.outcome === 'accepted') {
          if (typeof showToast === 'function') showToast('AfricaBased is being installed!', 'success');
        }
      });
      return;
    }

    var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      if (typeof showToast === 'function') showToast('You are already using the installed app!', 'info');
      return;
    }

    showInstallModal();
  };

  function showInstallModal() {
    var existing = document.getElementById('ab-install-guide');
    if (existing) existing.remove();

    var ua = navigator.userAgent || '';
    var isIOS = /iPhone|iPad|iPod/.test(ua);
    var isAndroid = /Android/.test(ua);
    var appUrl = window.location.origin;

    var overlay = document.createElement('div');
    overlay.id = 'ab-install-guide';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(5,11,21,0.9);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);padding:20px;';

    var content = '<div style="background:linear-gradient(135deg,#0d1b2a,#0a1628);border:1px solid rgba(212,160,23,0.25);border-radius:20px;padding:32px 24px;max-width:380px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,0.6);color:#fff;font-family:\'Plus Jakarta Sans\',sans-serif;font-size:0.9rem;position:relative;">';
    content += '<button id="ab-guide-close" style="position:absolute;top:12px;right:14px;background:none;border:none;color:rgba(255,255,255,0.4);font-size:1.3rem;cursor:pointer;padding:4px;">✕</button>';
    content += '<div style="text-align:center;margin-bottom:20px;">';
    content += '<img src="/public/icons/icon-96x96.png" style="width:72px;height:72px;border-radius:16px;margin:0 auto 14px;display:block;box-shadow:0 8px 24px rgba(0,0,0,0.4);">';
    content += '<div style="font-size:1.15rem;font-weight:800;margin-bottom:4px;">Install AfricaBased</div>';
    content += '<div style="font-size:0.8rem;color:rgba(255,255,255,0.45);">Get the full app experience</div>';
    content += '</div>';

    if (isAndroid) {
      content += '<a href="/api/download/app" id="ab-download-apk" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;background:linear-gradient(135deg,#d4a017,#b8890f);color:#fff;border:none;border-radius:12px;font-size:0.95rem;font-weight:700;cursor:pointer;text-decoration:none;margin-bottom:14px;box-shadow:0 4px 16px rgba(212,160,23,0.3);"><i class="fas fa-download"></i> Download App</a>';
      content += '<div style="text-align:center;color:rgba(255,255,255,0.35);font-size:0.78rem;margin-bottom:14px;">— or install directly —</div>';
      content += '<button id="ab-pwa-install" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.8);border-radius:12px;font-size:0.88rem;font-weight:600;cursor:pointer;"><i class="fas fa-globe"></i> Add to Home Screen</button>';
      content += '<div style="margin-top:12px;padding:12px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:0.78rem;color:rgba(255,255,255,0.4);line-height:1.6;">';
      content += '<i class="fas fa-info-circle" style="color:var(--gold,#d4a017);margin-right:4px;"></i> After downloading, open the file from your notifications or Files app to install.';
      content += '</div>';
    } else if (isIOS) {
      content += '<div style="text-align:left;line-height:1.9;padding:4px 0;">';
      content += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:10px;margin-bottom:8px;"><span style="width:28px;height:28px;border-radius:8px;background:rgba(0,122,255,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#007AFF;font-size:0.85rem;">1</span><span>Tap <b>Share</b> <i class="fas fa-arrow-up-from-bracket" style="color:#007AFF"></i> at the bottom</span></div>';
      content += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:10px;margin-bottom:8px;"><span style="width:28px;height:28px;border-radius:8px;background:rgba(0,122,255,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#007AFF;font-size:0.85rem;">2</span><span>Tap <b>"Add to Home Screen"</b> <i class="fas fa-plus-square" style="color:#007AFF"></i></span></div>';
      content += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:10px;"><span style="width:28px;height:28px;border-radius:8px;background:rgba(0,122,255,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#007AFF;font-size:0.85rem;">3</span><span>Tap <b>"Add"</b> to install</span></div>';
      content += '</div>';
    } else {
      content += '<button id="ab-pwa-install" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;background:linear-gradient(135deg,#d4a017,#b8890f);color:#fff;border:none;border-radius:12px;font-size:0.95rem;font-weight:700;cursor:pointer;margin-bottom:14px;box-shadow:0 4px 16px rgba(212,160,23,0.3);"><i class="fas fa-download"></i> Install App</button>';
      content += '<div style="margin-top:4px;padding:12px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:0.78rem;color:rgba(255,255,255,0.4);line-height:1.6;">';
      content += '<i class="fas fa-info-circle" style="color:var(--gold,#d4a017);margin-right:4px;"></i> If the install prompt doesn\'t appear, look for "Install" in your browser menu (⋮).';
      content += '</div>';
    }

    content += '</div>';
    overlay.innerHTML = content;
    document.body.appendChild(overlay);

    document.getElementById('ab-guide-close').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    var pwaBtn = document.getElementById('ab-pwa-install');
    if (pwaBtn) {
      pwaBtn.addEventListener('click', function () {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(function () { deferredPrompt = null; overlay.remove(); });
        } else {
          if (typeof showToast === 'function') showToast('Tap your browser menu (⋮) and select "Install app" or "Add to Home Screen"', 'info');
        }
      });
    }
  }

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
