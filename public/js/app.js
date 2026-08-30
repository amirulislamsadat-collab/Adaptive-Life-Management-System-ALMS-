// ============================================================
// ALMS client — service worker registration, "Install App" handling
// (Android/desktop get a real prompt; iOS gets Add-to-Home-Screen
// instructions since Safari doesn't support beforeinstallprompt), and a
// Ctrl+K / Cmd+K command palette for fast navigation.
// ============================================================
(function () {
  // --- Service worker (installability + offline fallback) ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/service-worker.js').catch(function () {});
    });
  }

  // --- Install App button ---
  var deferredPrompt = null;
  var installBtns = document.querySelectorAll('.js-install-app');
  var isNativeApp = /ALMSDesktop|ALMSMobile/i.test(navigator.userAgent);
  var isStandalone = isNativeApp || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  function setInstallButtonsVisible(visible) {
    installBtns.forEach(function (btn) { btn.hidden = !visible; });
  }

  if (isStandalone) {
    setInstallButtonsVisible(false);
  } else if (isIOS) {
    setInstallButtonsVisible(true);
  } else {
    setInstallButtonsVisible(false);
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      setInstallButtonsVisible(true);
    });
    window.addEventListener('appinstalled', function () {
      setInstallButtonsVisible(false);
      deferredPrompt = null;
    });
  }

  installBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (isIOS) {
        var modal = document.getElementById('iosInstallModal');
        if (modal) modal.hidden = false;
        return;
      }
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
      }
    });
  });

  var iosModalClose = document.getElementById('iosInstallModalClose');
  if (iosModalClose) {
    iosModalClose.addEventListener('click', function () {
      document.getElementById('iosInstallModal').hidden = true;
    });
  }

  // --- Command palette (Ctrl+K / Cmd+K) ---
  var palette = document.getElementById('commandPalette');
  var paletteInput = document.getElementById('commandPaletteInput');
  var paletteList = document.getElementById('commandPaletteList');
  if (palette && paletteInput && paletteList) {
    var items = Array.prototype.slice.call(paletteList.querySelectorAll('a'));

    function openPalette() {
      palette.hidden = false;
      paletteInput.value = '';
      filterPalette('');
      paletteInput.focus();
    }
    function closePalette() { palette.hidden = true; }

    function filterPalette(query) {
      var q = query.trim().toLowerCase();
      items.forEach(function (a) {
        var text = a.textContent.toLowerCase();
        a.style.display = !q || text.indexOf(q) !== -1 ? 'flex' : 'none';
      });
    }

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        palette.hidden ? openPalette() : closePalette();
      } else if (e.key === 'Escape' && !palette.hidden) {
        closePalette();
      }
    });
    palette.addEventListener('click', function (e) {
      if (e.target === palette) closePalette();
    });
    paletteInput.addEventListener('input', function () { filterPalette(paletteInput.value); });

    var paletteTrigger = document.getElementById('commandPaletteTrigger');
    if (paletteTrigger) paletteTrigger.addEventListener('click', openPalette);
  }
})();
