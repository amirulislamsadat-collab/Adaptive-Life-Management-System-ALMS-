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

  // --- AI Assistant widget ---
  var fab = document.getElementById('assistantFab');
  var panel = document.getElementById('assistantPanel');
  if (fab && panel) {
    var messagesEl = document.getElementById('assistantMessages');
    var form = document.getElementById('assistantForm');
    var input = document.getElementById('assistantInput');
    var sendBtn = form.querySelector('.assistant-send');
    var history = [];

    function addMessage(text, cls) {
      var div = document.createElement('div');
      div.className = 'assistant-msg ' + cls;
      div.textContent = text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return div;
    }

    fab.addEventListener('click', function () {
      panel.hidden = false;
      input.focus();
    });
    document.getElementById('assistantClose').addEventListener('click', function () {
      panel.hidden = true;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      addMessage(text, 'assistant-msg-user');
      history.push({ role: 'user', content: text });
      input.value = '';
      input.disabled = true;
      sendBtn.disabled = true;
      var thinking = addMessage('Thinking...', 'assistant-msg-bot');

      fetch('/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(0, -1) })
      })
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (res) {
          thinking.remove();
          if (res.ok) {
            addMessage(res.data.reply, 'assistant-msg-bot');
            history.push({ role: 'assistant', content: res.data.reply });
          } else {
            addMessage(res.data.error || 'Something went wrong.', 'assistant-msg-error');
          }
        })
        .catch(function () {
          thinking.remove();
          addMessage("Couldn't reach the assistant — check your connection and try again.", 'assistant-msg-error');
        })
        .finally(function () {
          input.disabled = false;
          sendBtn.disabled = false;
          input.focus();
        });
    });
  }
})();
