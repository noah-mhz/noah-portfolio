/*
 * Timeline achievements.
 *
 *   Each point gets a short dash that draws in before its text rises, one
 *   point after another. Figures in a point ("10%", "10–15%") are picked out in
 *   the accent and count up from zero as they appear. The figures are Noah's
 *   own résumé numbers, taken from the markup; nothing is added.
 */

const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Adds the dashes and wraps the figures. Safe to call more than once. */
export function preparePoints(root = document) {
  $$('.tl__points li', root).forEach((li) => {
    if (li.dataset.point) return;
    li.dataset.point = 'true';
    const dash = document.createElement('i');
    dash.className = 'tl__dash';
    dash.setAttribute('aria-hidden', 'true');
    li.prepend(dash);
    const text = li.querySelector('[data-tl-item]');
    if (!text) return;
    // A range ("10–15%") counts up as one figure, both ends together.
    text.innerHTML = text.innerHTML.replace(/(\d+)(?:–(\d+))?%/g, (m, a, b) => `<b class="tl__num" data-count="${a}"${b ? ` data-count-to="${b}"` : ''}>${m}</b>`);
  });
}

/** A paused timeline that draws one list's dashes, raises its points and counts its figures. */
export function pointsTimeline(list, { delay = 0 } = {}) {
  const { gsap } = window;
  const items = $$('li', list);
  const tl = gsap.timeline({ paused: true, delay });
  items.forEach((li, i) => {
    const at = i * 0.12;
    const dash = li.querySelector('.tl__dash');
    const text = li.querySelector('[data-tl-item]');
    if (dash) tl.fromTo(dash, { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: 'power3.out' }, at);
    if (text) tl.fromTo(text, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'expo.out' }, at + 0.12);
    $$('.tl__num', li).forEach((num) => {
      const end = Number(num.dataset.count);
      const endTo = num.dataset.countTo ? Number(num.dataset.countTo) : null;
      const counter = { v: 0 };
      tl.fromTo(counter, { v: 0 }, {
        v: 1,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate: () => {
          const a = Math.round(end * counter.v);
          num.textContent = endTo === null ? `${a}%` : `${a}–${Math.round(endTo * counter.v)}%`;
        },
      }, at + 0.2);
    });
  });
  return tl;
}
