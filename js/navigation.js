import { scramble } from './scramble.js';

const { gsap, ScrollTrigger } = window;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/**
 * Section-aware navigation. Every element with [data-nav-label] is a zone:
 * an empty label shows the full link list (opening sections); a label folds
 * the links away and shows a visible "Section · Menu +" button instead.
 * "Start a project" never folds away.
 *
 * The links come back by themselves when you scroll up or reach a section
 * without a label; "Menu +" (click, tap, hover or keyboard) opens them any
 * time, and its "+" turns into "×" while they are open.
 */
export function initNavigation({ reduceMotion = false } = {}) {
  const right = $('[data-nav]');
  if (!right) return undefined;
  const list = $('.nav__list', right);
  const links = $$('.nav__list .nav__link', right);
  const status = $('[data-nav-status]', right);
  const text = $('[data-nav-status-text]', right);
  const pace = reduceMotion ? 0 : 1;

  const zones = $$('[data-nav-label]').map((el, order) => ({
    order,
    label: el.dataset.navLabel,
    key: el.dataset.navSection || '',
    // A pinned element is measured through its spacer so the zone spans the pin.
    trigger: el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el,
  }));

  const active = new Set();
  let label = '';      // current section name ('' = opening section)
  let open = false;    // menu opened by the visitor (click / hover / focus)
  let hovered = false; // opened by hover, so leaving closes it
  let peek = false;    // links shown because the visitor scrolled up
  let linksShown = true;
  let statusShown = false;

  /* ---------- Pieces ---------- */

  const showLinks = (show) => {
    if (show === linksShown) return;
    linksShown = show;
    if (show) {
      gsap.set(list, { display: '' });
      gsap.fromTo(links, { yPercent: -110 }, { yPercent: 0, duration: 0.6 * pace, stagger: 0.04 * pace, ease: 'power4.out', overwrite: true });
    } else {
      gsap.to(links, {
        yPercent: -110, duration: 0.4 * pace, stagger: 0.03 * pace, ease: 'power3.in', overwrite: true,
        onComplete: () => { if (!linksShown) gsap.set(list, { display: 'none' }); },
      });
    }
  };

  const showStatus = (show) => {
    if (show === statusShown) return;
    statusShown = show;
    right.classList.toggle('has-status', show);
    if (show) gsap.fromTo(status, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6 * pace, ease: 'power4.out', overwrite: true });
    else gsap.set(status, { autoAlpha: 0, yPercent: 0, overwrite: true });
  };

  const render = () => {
    const sectioned = Boolean(label);
    right.classList.toggle('is-open', open && sectioned);
    status.setAttribute('aria-expanded', String(open || !sectioned));
    status.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');

    if (!sectioned) { showLinks(true); showStatus(false); return; }
    if (open) { showLinks(true); showStatus(true); return; }
    if (peek) { showLinks(true); showStatus(false); return; }
    showStatus(true);
    showLinks(false);
  };

  // The section name rolls: the old one leaves upward, the new one rises in and resolves out of noise.
  const setLabel = (next) => {
    if (next === label) return;
    const was = label;
    label = next;
    if (!next || !statusShown || !pace) { text.textContent = next; return; }
    if (!was) { text.textContent = next; return; }
    gsap.to(text, {
      yPercent: -110, duration: 0.3, ease: 'power3.in', overwrite: true,
      onComplete: () => {
        text.textContent = next;
        gsap.fromTo(text, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'power4.out' });
        scramble(text, { duration: 0.55 });
      },
    });
  };

  const update = () => {
    const zone = [...active].sort((a, b) => b.order - a.order)[0];
    const key = zone ? zone.key : '';
    links.forEach((link) => link.classList.toggle('is-active', link.dataset.navLink === key));
    setLabel(zone ? zone.label : '');
    render();
  };

  zones.forEach((zone) => {
    ScrollTrigger.create({
      trigger: zone.trigger,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        if (self.isActive) active.add(zone);
        else active.delete(zone);
        update();
      },
    });
  });

  // Scrolling up brings the links back; scrolling down folds them (and closes a click-opened menu).
  let lastY = window.scrollY;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      if (Math.abs(y - lastY) < 8) return;
      const up = y < lastY;
      lastY = y;
      if (!up && open && !hovered && !right.contains(document.activeElement)) open = false;
      if (up !== peek) { peek = up; render(); }
      else if (!up) render();
    },
  });

  /* ---------- Opening and closing ---------- */

  const setOpen = (next) => {
    if (next === open) return;
    open = next;
    if (!next) hovered = false;
    render();
  };

  const onStatusClick = () => {
    setOpen(!open);
    if (open) links[0]?.focus({ preventScroll: true });
  };

  const onFocusIn = (event) => { if (list.contains(event.target)) setOpen(true); };
  const onFocusOut = (event) => { if (!right.contains(event.relatedTarget) && !hovered) setOpen(false); };
  const onDocClick = (event) => { if (open && !right.contains(event.target)) setOpen(false); };
  const onKey = (event) => { if (open && event.key === 'Escape') { setOpen(false); status.focus({ preventScroll: true }); } };

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const onEnter = () => { if (!label || open) return; hovered = true; setOpen(true); };
  const onLeave = () => { if (hovered) setOpen(false); };

  const bindings = [
    [status, 'click', onStatusClick],
    [right, 'focusin', onFocusIn],
    [right, 'focusout', onFocusOut],
    [document, 'click', onDocClick],
    [document, 'keydown', onKey],
    ...(finePointer ? [[status, 'pointerenter', onEnter], [right, 'pointerleave', onLeave]] : []),
  ];
  bindings.forEach(([el, type, fn]) => el.addEventListener(type, fn));

  gsap.set(status, { autoAlpha: 0 });
  update();

  // Page progress, drawn along the top edge.
  gsap.to('.progress__bar', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: reduceMotion ? true : 0.3 },
  });

  return () => {
    bindings.forEach(([el, type, fn]) => el.removeEventListener(type, fn));
    gsap.set([list, status], { clearProps: 'display,visibility,opacity' });
    gsap.set([links, text, status], { clearProps: 'transform' });
    right.classList.remove('is-open', 'has-status');
  };
}
