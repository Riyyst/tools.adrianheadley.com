(() => {
  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (_) {}
    }
  };

  const applyTextSize = (size) => {
    const scale = size === 'xlarge' ? 1.25 : size === 'large' ? 1.125 : 1;
    document.documentElement.style.fontSize = `${16 * scale}px`;
    document.querySelectorAll('[data-text-size]').forEach((button) => {
      button.classList.toggle('active', button.dataset.textSize === size);
    });
  };

  const applyColourMode = (mode) => {
    document.body.classList.toggle('cb-mode', mode === 'cb');
    document.querySelectorAll('[data-color-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.colorMode === mode);
    });
  };

  const applyToggle = (id, className, enabled) => {
    document.body.classList.toggle(className, enabled);
    const input = document.getElementById(id);
    if (input) input.checked = enabled;
  };

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('a11y-button');
    const panel = document.getElementById('a11y-panel');
    if (!button || !panel) return;

    applyTextSize(storage.get('ah-text-size') || 'normal');
    applyColourMode(storage.get('ah-color-mode') || 'normal');
    applyToggle('underline-toggle', 'links-underlined', storage.get('ah-links') === 'underline');
    applyToggle('motion-toggle', 'reduce-motion', storage.get('ah-motion') === 'reduce');
    applyToggle('focus-toggle', 'strong-focus', storage.get('ah-focus') === 'strong');

    button.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', (event) => {
      if (!panel.contains(event.target) && !button.contains(event.target)) {
        panel.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        panel.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
        button.focus();
      }
    });

    document.querySelectorAll('[data-text-size]').forEach((chip) => {
      chip.addEventListener('click', () => {
        applyTextSize(chip.dataset.textSize);
        storage.set('ah-text-size', chip.dataset.textSize);
      });
    });

    document.querySelectorAll('[data-color-mode]').forEach((chip) => {
      chip.addEventListener('click', () => {
        applyColourMode(chip.dataset.colorMode);
        storage.set('ah-color-mode', chip.dataset.colorMode);
      });
    });

    const bindings = [
      ['underline-toggle', 'links-underlined', 'ah-links', 'underline', 'normal'],
      ['motion-toggle', 'reduce-motion', 'ah-motion', 'reduce', 'normal'],
      ['focus-toggle', 'strong-focus', 'ah-focus', 'strong', 'normal']
    ];

    bindings.forEach(([id, className, key, onValue, offValue]) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('change', () => {
        document.body.classList.toggle(className, input.checked);
        storage.set(key, input.checked ? onValue : offValue);
      });
    });
  });
})();
