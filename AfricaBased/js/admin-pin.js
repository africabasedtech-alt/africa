(function () {
  var SESSION_KEY = 'ab_adm_pin_ok';

  function getAdminKey() {
    var isSuper = localStorage.getItem('superAdmin') === 'true' ||
                  sessionStorage.getItem('superAdmin') === 'true';
    if (isSuper) return '1540568e';
    var d = {};
    try { d = JSON.parse(localStorage.getItem('adminData') || sessionStorage.getItem('adminData') || '{}'); } catch (e) {}
    return d.api_key || '';
  }

  if (sessionStorage.getItem(SESSION_KEY) === '1') return;

  var GLOBE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:#060d1a;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

  var overlay = document.createElement('div');
  overlay.id = '__abPinOverlay';
  overlay.innerHTML = '<style>'
    + '#__abPinOverlay{'
    + 'position:fixed;inset:0;z-index:99999;background:#080e1d;'
    + 'display:flex;align-items:center;justify-content:center;'
    + 'font-family:"Segoe UI",system-ui,-apple-system,sans-serif;}'
    + '#__abPinBox{'
    + 'background:#0d1628;border:1px solid rgba(78,205,196,0.18);'
    + 'border-radius:18px;padding:44px 36px 36px;width:100%;max-width:360px;'
    + 'box-shadow:0 24px 64px rgba(0,0,0,0.5);text-align:center;}'
    + '.pin-logo{display:inline-flex;align-items:center;gap:10px;margin-bottom:32px;}'
    + '.pin-logo-icon{width:40px;height:40px;background:#4ecdc4;border-radius:10px;'
    + 'display:flex;align-items:center;justify-content:center;flex-shrink:0;}'
    + '.pin-logo-name{font-size:1.2rem;font-weight:700;color:#fff;}'
    + '.pin-title{font-size:1.22rem;font-weight:700;color:#fff;margin-bottom:6px;}'
    + '.pin-sub{font-size:0.82rem;color:rgba(255,255,255,0.38);margin-bottom:28px;line-height:1.6;}'
    + '#__abPinDots{display:flex;justify-content:center;gap:14px;margin-bottom:24px;}'
    + '.pin-dot{width:14px;height:14px;border-radius:50%;border:2px solid rgba(78,205,196,0.4);'
    + 'background:transparent;transition:background 0.15s,border-color 0.15s;}'
    + '.pin-dot.filled{background:#4ecdc4;border-color:#4ecdc4;}'
    + '#__abPinKeypad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px;}'
    + '.pk-btn{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);'
    + 'border-radius:10px;color:#fff;font-size:1.25rem;font-weight:600;padding:16px 0;'
    + 'cursor:pointer;transition:background 0.15s;user-select:none;-webkit-user-select:none;}'
    + '.pk-btn:hover{background:rgba(78,205,196,0.14);border-color:rgba(78,205,196,0.3);}'
    + '.pk-btn:active{background:rgba(78,205,196,0.25);}'
    + '.pk-del{color:#ff6b6b;font-size:1rem;}'
    + '.pk-ok{background:linear-gradient(90deg,#4ecdc4,#00b3a4);color:#080e1d;'
    + 'border:none;font-weight:700;}'
    + '.pk-ok:hover{opacity:0.88;}'
    + '.pk-btn:disabled{opacity:0.4;cursor:not-allowed;}'
    + '#__abPinError{font-size:0.8rem;color:#ff6b6b;min-height:18px;margin-bottom:4px;}'
    + '@keyframes __abShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}'
    + '40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}'
    + '.__abShake{animation:__abShake 0.35s ease;}'
    + '</style>'
    + '<div id="__abPinBox">'
    + '<div class="pin-logo"><div class="pin-logo-icon">' + GLOBE_SVG + '</div>'
    + '<span class="pin-logo-name">AfricaBased</span></div>'
    + '<div class="pin-title">Security PIN Required</div>'
    + '<div class="pin-sub">Enter your 4-digit PIN to access<br>the admin dashboard.</div>'
    + '<div id="__abPinDots">'
    + '<div class="pin-dot" id="pd0"></div><div class="pin-dot" id="pd1"></div>'
    + '<div class="pin-dot" id="pd2"></div><div class="pin-dot" id="pd3"></div>'
    + '</div>'
    + '<div id="__abPinKeypad">'
    + '<button class="pk-btn" data-v="1">1</button>'
    + '<button class="pk-btn" data-v="2">2</button>'
    + '<button class="pk-btn" data-v="3">3</button>'
    + '<button class="pk-btn" data-v="4">4</button>'
    + '<button class="pk-btn" data-v="5">5</button>'
    + '<button class="pk-btn" data-v="6">6</button>'
    + '<button class="pk-btn" data-v="7">7</button>'
    + '<button class="pk-btn" data-v="8">8</button>'
    + '<button class="pk-btn" data-v="9">9</button>'
    + '<button class="pk-btn pk-del" id="__pkDel">&#9003;</button>'
    + '<button class="pk-btn" data-v="0">0</button>'
    + '<button class="pk-btn pk-ok" id="__pkOk">OK</button>'
    + '</div>'
    + '<div id="__abPinError"></div>'
    + '</div>';

  function init() {
    document.body.appendChild(overlay);

    var entered  = '';
    var busy     = false;
    var errEl    = document.getElementById('__abPinError');
    var box      = document.getElementById('__abPinBox');
    var allBtns  = overlay.querySelectorAll('.pk-btn');

    function setLocked(locked) {
      busy = locked;
      allBtns.forEach(function (b) { b.disabled = locked; });
    }

    function updateDots() {
      for (var i = 0; i < 4; i++) {
        var d = document.getElementById('pd' + i);
        if (d) d.className = 'pin-dot' + (i < entered.length ? ' filled' : '');
      }
    }

    function shake() {
      box.classList.add('__abShake');
      setTimeout(function () { box.classList.remove('__abShake'); }, 400);
    }

    function verify() {
      if (entered.length !== 4) {
        errEl.textContent = 'Please enter all 4 digits.';
        shake();
        return;
      }
      if (busy) return;
      setLocked(true);
      errEl.textContent = '';

      var key = getAdminKey();
      fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ pin: entered })
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok) {
          sessionStorage.setItem(SESSION_KEY, '1');
          overlay.style.transition = 'opacity 0.3s';
          overlay.style.opacity = '0';
          setTimeout(function () { overlay.remove(); }, 320);
        } else {
          errEl.textContent = data.error || 'Incorrect PIN. Please try again.';
          entered = '';
          updateDots();
          shake();
          setLocked(false);
        }
      })
      .catch(function () {
        errEl.textContent = 'Network error. Please try again.';
        entered = '';
        updateDots();
        shake();
        setLocked(false);
      });
    }

    document.getElementById('__pkDel').addEventListener('click', function () {
      if (busy) return;
      if (entered.length > 0) { entered = entered.slice(0, -1); updateDots(); }
      errEl.textContent = '';
    });

    document.getElementById('__pkOk').addEventListener('click', verify);

    overlay.querySelectorAll('.pk-btn[data-v]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (busy) return;
        if (entered.length < 4) {
          entered += this.getAttribute('data-v');
          updateDots();
          errEl.textContent = '';
          if (entered.length === 4) verify();
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (busy) return;
      if (e.key >= '0' && e.key <= '9' && entered.length < 4) {
        entered += e.key;
        updateDots();
        errEl.textContent = '';
        if (entered.length === 4) verify();
      } else if (e.key === 'Backspace') {
        if (entered.length > 0) { entered = entered.slice(0, -1); updateDots(); }
      } else if (e.key === 'Enter') {
        verify();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
