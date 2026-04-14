(function() {
  var STORAGE_KEY = 'ab-theme';

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  }

  function getTheme() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return getSystemTheme();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f4f5' : '#09090b');
  }

  applyTheme(getTheme());

  window.abToggleTheme = function() {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    var next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    updateToggleIcons(next);
    return next;
  };

  window.abGetTheme = function() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  };

  function updateToggleIcons(theme) {
    var btns = document.querySelectorAll('.ft-theme-toggle');
    btns.forEach(function(btn) {
      var icon = btn.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      }
    });
  }

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
        updateToggleIcons(e.matches ? 'dark' : 'light');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateToggleIcons(getTheme());

    if (!document.querySelector('.ft-theme-toggle')) {
      var fab = document.createElement('button');
      fab.className = 'ft-theme-toggle ft-theme-fab';
      fab.setAttribute('onclick', 'abToggleTheme()');
      fab.setAttribute('title', 'Toggle theme');
      fab.innerHTML = '<i class="fas fa-sun"></i>';
      document.body.appendChild(fab);
      updateToggleIcons(getTheme());
    }
  });
})();
