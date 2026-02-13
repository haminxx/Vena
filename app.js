(function () {
  'use strict';

  const landing = document.getElementById('landing');
  const browserUI = document.getElementById('browser-ui');
  const root = document.documentElement;

  const DEFAULT_GRADIENT = {
    from: '#1a1a2e',
    to: '#16213e'
  };

  function hexToRgb(hex) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const h = Math.max(0, Math.min(255, Math.round(x)));
      return h.toString(16).padStart(2, '0');
    }).join('');
  }

  function adjustBrightness(hex, factor) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
  }

  function setBackgroundFromColor(hex) {
    if (!hex) {
      root.style.setProperty('--bg-gradient-from', DEFAULT_GRADIENT.from);
      root.style.setProperty('--bg-gradient-to', DEFAULT_GRADIENT.to);
      return;
    }
    root.style.setProperty('--bg-gradient-from', hex);
    root.style.setProperty('--bg-gradient-to', adjustBrightness(hex, 0.4));
  }

  function enterFullscreenAndShowBrowser() {
    const doc = document.documentElement;
    if (!document.fullscreenElement) {
      doc.requestFullscreen().then(() => {
        landing.classList.add('hidden');
        browserUI.classList.add('active');
      }).catch(() => {
        landing.classList.add('hidden');
        browserUI.classList.add('active');
      });
    } else {
      landing.classList.add('hidden');
      browserUI.classList.add('active');
    }
  }

  function handleF11(e) {
    if (e.key === 'F11') {
      e.preventDefault();
      enterFullscreenAndShowBrowser();
    }
  }

  document.addEventListener('keydown', handleF11);

  function bindHoverToColoredElements() {
    const selector = '[data-color]';
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
      el.addEventListener('mouseenter', function () {
        setBackgroundFromColor(this.getAttribute('data-color'));
      });
      el.addEventListener('mouseleave', function () {
        setBackgroundFromColor(null);
      });
    });
  }

  bindHoverToColoredElements();
})();
