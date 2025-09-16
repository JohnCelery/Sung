const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
];

const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 0);

let activeTrap = null;

function getFocusableElements(container) {
  if (!container) {
    return [];
  }
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS.join(','))).filter(
    (element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden')
  );
}

export function focusFirstElement(container) {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
  } else {
    container?.setAttribute('tabindex', '-1');
    container?.focus();
  }
}

function onKeyDown(event) {
  if (!activeTrap?.container) {
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const focusable = getFocusableElements(activeTrap.container);
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  } else if (document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function trapFocus(container, options = {}) {
  if (!container) {
    return () => {};
  }

  const previousTrap = activeTrap;
  const previousFocus = document.activeElement;

  activeTrap = {
    container,
    previousFocus,
  };

  document.addEventListener('keydown', onKeyDown);

  if (options.immediate !== false) {
    raf(() => focusFirstElement(container));
  }

  return function release() {
    if (previousTrap) {
      activeTrap = previousTrap;
      return;
    }

    document.removeEventListener('keydown', onKeyDown);
    activeTrap = null;
    if (options.restoreFocus !== false && previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
  };
}

export function releaseFocus() {
  if (!activeTrap) {
    return;
  }
  const { previousFocus } = activeTrap;
  document.removeEventListener('keydown', onKeyDown);
  activeTrap = null;
  if (previousFocus instanceof HTMLElement) {
    previousFocus.focus();
  }
}

export function announce(message, polite = true) {
  if (typeof document === 'undefined') {
    return;
  }
  let region = document.querySelector('[data-live-region]');
  if (!region) {
    region = document.createElement('div');
    region.setAttribute('aria-live', polite ? 'polite' : 'assertive');
    region.setAttribute('aria-atomic', 'true');
    region.dataset.liveRegion = 'true';
    region.style.position = 'absolute';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.margin = '-1px';
    region.style.clip = 'rect(0 0 0 0)';
    region.style.overflow = 'hidden';
    document.body.appendChild(region);
  }
  region.textContent = message;
}
