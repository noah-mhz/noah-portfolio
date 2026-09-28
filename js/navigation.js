const { gsap, ScrollTrigger } = window;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/**
 * Section-aware navigation. Every element with [data-nav-label] is a zone:
 * an empty label shows the full link list (opening sections); a label swaps
 * the list for a quiet status — the project index ("02 / 04") inside the
 * work, the section name elsewhere. Hover, focus or tapping the status
 * brings the links back.
 */
export function initNavigation({ reduceMotion = false } = {}) {
  const right = $('[data-nav]');
  const list = $('.nav__list', right);
  const links = $$('.nav__link', right);
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
  let mode = 'links';
  let label = '';
  let open = false;

  const setMode = (next) => {
    if (next === mode) return;
    mode = next;
    right.dataset.mode = next;

    if (next === 'status') {
      gsap.to(links, {
        yPercent: -110, duration: 0.5 * pace, stagger: 0.04 * pace, ease: 'power3.in', overwrite: true,
        onComplete: () => gsap.set(list, { visibility: 'hidden' }),
      });
      gsap.set(status, { visibility: 'visible' });
      gsap.fromTo(text, { yPercent: 110 }, { yPercent: 0, duration: 0.7 * pace, delay: 0.25 * pace, ease: 'power4.out', overwrite: true });
    } else {
      gsap.set(list, { visibility: 'visible' });
      gsap.to(links, { yPercent: 0, duration: 0.7 * pace, stagger: 0.05 * pace, ease: 'power4.out', overwrite: true });
      gsap.to(text, {
        yPercent: -110, duration: 0.4 * pace, ease: 'power3.in', overwrite: true,
        onComplete: () => gsap.set(status, { visibility: 'hidden' }),
      });
    }
  };

  // The status rolls: the old value leaves upward, the new one rises in.
  const setLabel = (next) => {
    if (next === label) return;
    label = next;
    if (mode !== 'status' || !pace) {
      text.textContent = next;
      return;
    }
    gsap.to(text, {
      yPercent: -110,
      duration: 0.3,
      ease: 'power3.in',
      overwrite: true,
      onComplete: () => {
        text.textContent = next;
        gsap.fromTo(text, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'power4.out' });
      },
    });
  };

  const update = () => {
    const zone = [...active].sort((a, b) => b.order - a.order)[0];
    const key = zone ? zone.key : '';
    links.forEach((link) => link.classList.toggle('is-active', link.dataset.navLink === key));

    if (!zone || !zone.label) {
      setMode('links');
      return;
    }
    setLabel(zone.label);
    if (!open) setMode('status');
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

  const reveal = () => {
    open = true;
    setMode('links');
  };

  const conceal = () => {
    open = false;
    update();
  };

  const onFocusOut = (event) => {
    if (!right.contains(event.relatedTarget)) conceal();
  };

  const onStatusClick = () => {
    reveal();
    links[0]?.focus();
  };

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const bindings = [
    [right, 'focusin', reveal],
    [right, 'focusout', onFocusOut],
    [status, 'click', onStatusClick],
    ...(finePointer ? [[right, 'pointerenter', reveal], [right, 'pointerleave', conceal]] : []),
  ];
  bindings.forEach(([el, type, fn]) => el.addEventListener(type, fn));

  gsap.set(status, { visibility: 'hidden' });
  right.dataset.mode = mode;
  update();

  // Page progress, drawn along the top edge.
  gsap.to('.progress__bar', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: reduceMotion ? true : 0.3 },
  });

  return () => {
    bindings.forEach(([el, type, fn]) => el.removeEventListener(type, fn));
    gsap.set([list, status], { clearProps: 'visibility' });
    gsap.set([links, text], { clearProps: 'transform' });
    right.dataset.mode = 'links';
  };
}
