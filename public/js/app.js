// ============================================================
// ALMS client — service worker registration, "Install App" handling
// (Android/desktop get a real prompt; iOS gets Add-to-Home-Screen
// instructions since Safari doesn't support beforeinstallprompt), and a
// Ctrl+K / Cmd+K command palette for fast navigation.
// ============================================================
// --- Toast (replaces alert() for success/error feedback app-wide) ---
window.almsToast = function (text, isError) {
  var toast = document.createElement('div');
  toast.className = 'flash ' + (isError ? 'flash-error' : 'flash-success');
  toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:600;max-width:90vw;';
  toast.innerHTML = '<i class="fas fa-' + (isError ? 'exclamation-triangle' : 'check-circle') + '" aria-hidden="true"></i> ' + text;
  document.body.appendChild(toast);
  setTimeout(function () { toast.remove(); }, isError ? 4000 : 2600);
};

// --- Confetti celebration (level-ups, streak milestones, setup complete) ---
// Lightweight, self-contained — no external library, respects reduced-motion.
window.almsCelebrate = function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var colors = ['#FF5A5F', '#ff8a8e', '#38BDF8', '#FFD700', '#39D353'];
  var container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);
  for (var i = 0; i < 40; i++) {
    var piece = document.createElement('div');
    var size = 6 + Math.random() * 6;
    var left = Math.random() * 100;
    var duration = 2.2 + Math.random() * 1.4;
    var delay = Math.random() * 0.4;
    var rotation = Math.random() * 720 - 360;
    piece.style.cssText =
      'position:absolute;top:-20px;left:' + left + 'vw;width:' + size + 'px;height:' + (size * 0.4) + 'px;' +
      'background:' + colors[i % colors.length] + ';opacity:0.9;border-radius:2px;' +
      'animation:confetti-fall ' + duration + 's ease-in ' + delay + 's forwards;' +
      '--rot:' + rotation + 'deg;';
    container.appendChild(piece);
  }
  setTimeout(function () { container.remove(); }, 4200);
};

(function () {
  // Auto-trigger confetti for any flash message that reads as a celebration
  // (level-up, streak milestone, freshly-finished setup) — one place to
  // handle it instead of wiring a JS call into every controller.
  var flashEls = document.querySelectorAll('.flash-success');
  flashEls.forEach(function (el) {
    if (/🎉|🔥 \d+-day|all set! Welcome/.test(el.textContent)) {
      window.almsCelebrate();
    }
  });
  if (new URLSearchParams(location.search).get('justSetup') === '1') {
    window.almsCelebrate();
    var url = new URL(location.href);
    url.searchParams.delete('justSetup');
    history.replaceState({}, '', url);
  }

  // --- Service worker (installability + offline fallback) ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/service-worker.js').catch(function () {});
    });
  }

  // --- Install App button: opens a picker (browser install / iOS steps /
  // Windows & Android downloads) rather than guessing a single action,
  // since a native download is always an option even when this browser
  // doesn't support installing the PWA directly. ---
  var deferredPrompt = null;
  var installBtns = document.querySelectorAll('.js-install-app');
  var isNativeApp = /ALMSDesktop|ALMSMobile/i.test(navigator.userAgent);
  var isStandalone = isNativeApp || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  function setInstallButtonsVisible(visible) {
    installBtns.forEach(function (btn) { btn.hidden = !visible; });
  }

  setInstallButtonsVisible(!isStandalone);

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var browserOpt = document.getElementById('installPickerBrowser');
    if (browserOpt) browserOpt.hidden = false;
  });
  window.addEventListener('appinstalled', function () {
    setInstallButtonsVisible(false);
    deferredPrompt = null;
  });

  var iosOpt = document.getElementById('installPickerIOS');
  if (iosOpt) iosOpt.hidden = !isIOS;

  var pickerModal = document.getElementById('installPickerModal');
  installBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (pickerModal) pickerModal.hidden = false;
    });
  });
  var pickerClose = document.getElementById('installPickerClose');
  if (pickerClose) pickerClose.addEventListener('click', function () { pickerModal.hidden = true; });

  var browserOptBtn = document.getElementById('installPickerBrowser');
  if (browserOptBtn) {
    browserOptBtn.addEventListener('click', function () {
      if (!deferredPrompt) return;
      pickerModal.hidden = true;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
    });
  }

  var iosOptBtn = document.getElementById('installPickerIOS');
  var iosModal = document.getElementById('iosInstallModal');
  if (iosOptBtn && iosModal) {
    iosOptBtn.addEventListener('click', function () {
      pickerModal.hidden = true;
      iosModal.hidden = false;
    });
  }
  var iosModalClose = document.getElementById('iosInstallModalClose');
  if (iosModalClose) {
    iosModalClose.addEventListener('click', function () { iosModal.hidden = true; });
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

  // --- AI Assistant widget (history persists server-side per user) ---
  var fab = document.getElementById('assistantFab');
  var panel = document.getElementById('assistantPanel');
  if (fab && panel) {
    var messagesEl = document.getElementById('assistantMessages');
    var form = document.getElementById('assistantForm');
    var input = document.getElementById('assistantInput');
    var sendBtn = form.querySelector('.assistant-send');
    var clearBtn = document.getElementById('assistantClear');
    var historyLoaded = false;
    var WELCOME_TEXT = 'Hi! I can help you find or understand any feature in ALMS — ask me anything about how the app works.';

    function addMessage(text, cls) {
      var div = document.createElement('div');
      div.className = 'assistant-msg ' + cls;
      div.textContent = text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return div;
    }

    function loadHistory() {
      if (historyLoaded) return;
      historyLoaded = true;
      fetch('/assistant/history')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.history && data.history.length) {
            messagesEl.innerHTML = '';
            data.history.forEach(function (m) {
              addMessage(m.content, m.role === 'user' ? 'assistant-msg-user' : 'assistant-msg-bot');
            });
          }
        })
        .catch(function () {});
    }

    fab.addEventListener('click', function () {
      panel.hidden = false;
      loadHistory();
      input.focus();
    });
    document.getElementById('assistantClose').addEventListener('click', function () {
      panel.hidden = true;
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        fetch('/assistant/history', { method: 'DELETE' })
          .then(function () {
            messagesEl.innerHTML = '';
            addMessage(WELCOME_TEXT, 'assistant-msg-bot');
          })
          .catch(function () {});
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      addMessage(text, 'assistant-msg-user');
      input.value = '';
      input.disabled = true;
      sendBtn.disabled = true;
      var thinking = addMessage('Thinking...', 'assistant-msg-bot');

      fetch('/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (res) {
          thinking.remove();
          if (res.ok) {
            addMessage(res.data.reply, 'assistant-msg-bot');
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
