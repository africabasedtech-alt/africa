(function(){
  var style = document.createElement('style');
  style.textContent = [
    '.ab-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-100px);z-index:99999;',
    'padding:14px 22px;border-radius:14px;font-family:inherit;font-size:.88rem;font-weight:600;',
    'color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.4);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);',
    'max-width:360px;width:calc(100% - 2rem);text-align:center;transition:transform .4s ease,opacity .4s ease;opacity:0;line-height:1.5}',
    '.ab-toast.show{transform:translateX(-50%) translateY(0);opacity:1}',
    '.ab-toast.success{background:linear-gradient(135deg,rgba(34,197,94,0.95),rgba(22,101,52,0.95));border:1px solid rgba(74,222,128,0.3)}',
    '.ab-toast.error{background:linear-gradient(135deg,rgba(239,68,68,0.95),rgba(153,27,27,0.95));border:1px solid rgba(248,113,113,0.3)}',
    '.ab-toast.info{background:linear-gradient(135deg,rgba(13,21,32,0.97),rgba(26,34,56,0.97));border:1px solid rgba(212,160,23,0.3);color:var(--gold-bright,#f5c842)}',
    '.ab-modal-ov{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;',
    'opacity:0;transition:opacity .3s ease;pointer-events:none}',
    '.ab-modal-ov.open{opacity:1;pointer-events:auto}',
    '.ab-modal-bx{background:linear-gradient(135deg,#0d1520,#1a2238);border:1px solid rgba(212,160,23,0.15);',
    'border-radius:18px;padding:28px 24px;max-width:360px;width:100%;text-align:center;',
    'box-shadow:0 12px 48px rgba(0,0,0,0.5);transform:scale(0.9);transition:transform .3s ease}',
    '.ab-modal-ov.open .ab-modal-bx{transform:scale(1)}',
    '.ab-modal-ic{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
    'font-size:1.5rem;margin:0 auto 14px}',
    '.ab-modal-ic.success{background:rgba(34,197,94,0.15);color:#4ade80}',
    '.ab-modal-ic.error{background:rgba(239,68,68,0.15);color:#f87171}',
    '.ab-modal-ic.confirm{background:rgba(212,160,23,0.15);color:#f5c842}',
    '.ab-modal-ic.info{background:rgba(96,165,250,0.15);color:#60a5fa}',
    '.ab-modal-title{font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:8px}',
    '.ab-modal-msg{font-size:.88rem;color:rgba(255,255,255,0.6);line-height:1.6;margin-bottom:20px;white-space:pre-line}',
    '.ab-modal-acts{display:flex;gap:10px;justify-content:center}',
    '.ab-modal-btn{flex:1;padding:11px 18px;border-radius:12px;border:none;font-size:.88rem;font-weight:700;cursor:pointer;transition:opacity .2s;font-family:inherit}',
    '.ab-modal-btn:active{opacity:.8}',
    '.ab-modal-btn.primary{background:linear-gradient(135deg,#166534,#22c55e);color:#fff;box-shadow:0 3px 12px rgba(34,160,64,0.3)}',
    '.ab-modal-btn.danger{background:linear-gradient(135deg,#991b1b,#ef4444);color:#fff}',
    '.ab-modal-btn.cancel{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.1)}'
  ].join('');
  document.head.appendChild(style);

  var toastTimer = null;
  window.showABToast = function(msg, type) {
    type = type || 'info';
    var old = document.querySelector('.ab-toast');
    if (old) old.remove();
    clearTimeout(toastTimer);
    var t = document.createElement('div');
    t.className = 'ab-toast ' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ t.classList.add('show'); }); });
    toastTimer = setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ if(t.parentNode) t.remove(); }, 400); }, 4000);
  };

  window.showABModal = function(opts) {
    opts = opts || {};
    var type = opts.type || 'info';
    var title = opts.title || '';
    var msg = opts.message || '';
    var confirmText = opts.confirmText || 'OK';
    var cancelText = opts.cancelText || 'Cancel';
    var showCancel = opts.showCancel !== undefined ? opts.showCancel : false;

    var icons = { success:'fa-check-circle', error:'fa-times-circle', confirm:'fa-question-circle', info:'fa-info-circle' };

    var ov = document.createElement('div');
    ov.className = 'ab-modal-ov';
    ov.innerHTML = '<div class="ab-modal-bx">' +
      '<div class="ab-modal-ic ' + type + '"><i class="fas ' + (icons[type]||icons.info) + '"></i></div>' +
      '<div class="ab-modal-title">' + title + '</div>' +
      '<div class="ab-modal-msg">' + msg + '</div>' +
      '<div class="ab-modal-acts">' +
        (showCancel ? '<button class="ab-modal-btn cancel" data-action="cancel">' + cancelText + '</button>' : '') +
        '<button class="ab-modal-btn ' + (type==='error'?'danger':'primary') + '" data-action="confirm">' + confirmText + '</button>' +
      '</div></div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ ov.classList.add('open'); }); });

    return new Promise(function(resolve) {
      function close(result) {
        ov.classList.remove('open');
        setTimeout(function(){ if(ov.parentNode) ov.remove(); }, 300);
        resolve(result);
      }
      ov.querySelector('[data-action="confirm"]').addEventListener('click', function(){ close(true); });
      var cancelBtn = ov.querySelector('[data-action="cancel"]');
      if (cancelBtn) cancelBtn.addEventListener('click', function(){ close(false); });
      ov.addEventListener('click', function(e){ if(e.target === ov) close(showCancel ? false : true); });
    });
  };
})();
