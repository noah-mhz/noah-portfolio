/*
 * Text scramble for short mono labels: characters cycle through random glyphs
 * and resolve left to right. Only used on monospaced text, so the width never
 * changes while it runs. Only the element's own text nodes are touched —
 * nested elements (arrows, icons) are left alone.
 *
 *   data-scramble          scrambles once when the label scrolls into view
 *   data-scramble="intro"  scrambled by the intro timeline instead
 *   data-scramble-hover    scrambles on hover (fine pointers only)
 */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·—+';
const REDUCED = '(prefers-reduced-motion: reduce)';
const FINE = '(hover: hover) and (pointer: fine) and (min-width: 1024px)';
const running = new WeakMap();

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

function textNodes(el) {
  return [...el.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
}

/** Scrambles `el` for `duration` seconds. Restarting mid-run resolves cleanly to the original. */
export function scramble(el, { duration = 0.6, delay = 0 } = {}) {
  if (!el || window.matchMedia(REDUCED).matches) return;

  running.get(el)?.cancel();

  const nodes = textNodes(el);
  if (!nodes.length) return;
  const originals = nodes.map((node) => node.textContent);
  const total = originals.reduce((sum, text) => sum + text.length, 0);
  let frame = 0;
  let start = 0;
  let raf = 0;

  const restore = () => nodes.forEach((node, i) => { node.textContent = originals[i]; });

  const step = (now) => {
    if (!start) start = now + delay * 1000;
    const progress = Math.min(1, Math.max(0, (now - start) / (duration * 1000)));
    frame += 1;
    // Swap glyphs every other frame — fast enough to read as noise, slow enough to stay calm.
    if (frame % 2 === 0 || progress === 1) {
      const resolved = Math.floor(progress * total);
      let index = 0;
      nodes.forEach((node, i) => {
        node.textContent = [...originals[i]].map((ch) => {
          const keep = index < resolved || /\s/.test(ch);
          index += 1;
          return keep ? ch : randomGlyph();
        }).join('');
      });
    }
    if (progress < 1) {
      raf = requestAnimationFrame(step);
    } else {
      restore();
      running.delete(el);
    }
  };

  running.set(el, {
    cancel: () => {
      cancelAnimationFrame(raf);
      restore();
      running.delete(el);
    },
  });
  raf = requestAnimationFrame(step);
}

const ON_VIEW = '.section-label > span, .footer__bottom > span, .contact__meta dt';
const ON_HOVER = 'a.label, .label a, .footer__links a, .footer__back';

const isMono = (el) => /mono/i.test(getComputedStyle(el).fontFamily);

/** The element that actually holds the label's text (links sometimes wrap it in a span). */
function textHolder(el) {
  if (textNodes(el).length) return el;
  return [...el.querySelectorAll('*')].find((child) => textNodes(child).length) || null;
}

export function initScramble() {
  if (window.matchMedia(REDUCED).matches) return;

  document.querySelectorAll(ON_VIEW).forEach((el) => {
    if (!el.hasAttribute('data-scramble') && isMono(el)) el.setAttribute('data-scramble', '');
  });
  document.querySelectorAll(ON_HOVER).forEach((el) => {
    if (el.closest('[data-cursor]') || !isMono(el)) return;
    el.setAttribute('data-scramble-hover', '');
    // Links get their real text as a label so screen readers never hear the noise.
    if (!el.hasAttribute('aria-label')) {
      const copy = el.cloneNode(true);
      copy.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
      el.setAttribute('aria-label', copy.textContent.trim().replace(/\s+/g, ' '));
    }
  });

  const onView = [...document.querySelectorAll('[data-scramble]')].filter((el) => el.dataset.scramble !== 'intro');
  if (onView.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        observer.unobserve(target);
        scramble(target, { delay: 0.15 });
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    onView.forEach((el) => observer.observe(el));
  }

  if (window.matchMedia(FINE).matches) {
    document.querySelectorAll('[data-scramble-hover]').forEach((el) => {
      const holder = textHolder(el);
      if (holder) el.addEventListener('pointerenter', () => scramble(holder, { duration: 0.45 }));
    });
  }
}
