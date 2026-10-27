/*
 * Touch counterparts to the desktop pointer effects. Everything here runs only
 * where there's no fine hover pointer (phones, tablets, narrow windows) and
 * motion is allowed, so it never overlaps the desktop versions.
 *
 *   focusProjects   — the project nearest the centre of the screen comes into focus
 *   activateCaps    — capability rows light up as they pass the centre, image behind
 *   tapFrame        — viewfinder corners snap around whatever was tapped
 *   pressFill       — the mint fill wipe runs while a finger holds a CTA
 *   dragWeight      — sliding a finger across the hero headline bolds the letters under it
 */

const { gsap, ScrollTrigger } = window;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const TOUCH_MOTION = '(prefers-reduced-motion: no-preference) and ((hover: none) or (max-width: 1023px))';

/* -------------------------------------------------------------------------- */

function focusProjects() {
  const cleanups = $$('[data-project] .project__media').map((media) => {
    const img = $('.project__img', media);
    const clip = $('.project__clip', media);
    const external = /^https?:/.test(media.getAttribute('href') || '');

    const label = document.createElement('span');
    label.className = 'project__focus label';
    label.setAttribute('aria-hidden', 'true');
    label.innerHTML = external ? 'Visit site <span class="arrow arrow--diag">↗</span>' : 'View case <span class="arrow">→</span>';
    clip.appendChild(label);
    gsap.set(label, { autoAlpha: 0, y: 10 });

    const focus = (on) => {
      media.classList.toggle('is-focus', on);
      gsap.to(img, { scale: on ? 1.04 : 1, duration: 1.2, ease: 'expo.out', overwrite: 'auto' });
      gsap.to(label, { autoAlpha: on ? 1 : 0, y: on ? 0 : 10, duration: on ? 0.7 : 0.4, ease: on ? 'expo.out' : 'power2.in', overwrite: true });
    };

    const trigger = ScrollTrigger.create({
      trigger: media,
      start: 'top 62%',
      end: 'bottom 38%',
      onToggle: (self) => focus(self.isActive),
    });

    return () => {
      trigger.kill();
      label.remove();
      media.classList.remove('is-focus');
      gsap.set(img, { clearProps: 'scale' });
    };
  });
  return () => cleanups.forEach((fn) => fn());
}

/* -------------------------------------------------------------------------- */

function activateCaps() {
  const list = $('[data-caps]');
  if (!list) return () => {};
  const sources = $$('.cap-preview img').map((img) => img.getAttribute('src'));

  const cleanups = $$('[data-cap]', list).map((row, index) => {
    const link = $('.cap__link', row);
    // The image sits behind the row's own box, so lighting a row never moves the layout.
    const peek = document.createElement('span');
    peek.className = 'cap__peek';
    peek.setAttribute('aria-hidden', 'true');
    if (sources[index]) {
      const img = document.createElement('img');
      img.src = sources[index];
      img.alt = '';
      img.decoding = 'async';
      peek.appendChild(img);
    }
    link.prepend(peek);
    link.classList.add('has-peek');

    // The title nudges right, but never past the row's edge (long titles nearly fill a phone).
    const inner = $('.cap__title-inner', row);
    const nudge = () => Math.max(0, Math.min(12, link.clientWidth - inner.offsetLeft - inner.offsetWidth - 2));
    const tl = gsap.timeline({ paused: true, defaults: { duration: 0.8, ease: 'expo.out' } })
      .to(inner, { x: nudge }, 0)
      .to($('.cap__line', row), { scaleX: 1, duration: 1 }, 0)
      .fromTo(peek, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 }, 0)
      .fromTo($('img', peek), { scale: 1.15 }, { scale: 1, duration: 1.2 }, 0);

    const trigger = ScrollTrigger.create({
      trigger: row,
      // Rows are contiguous, so exactly one holds the centre line at a time.
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        row.classList.toggle('is-active', self.isActive);
        if (self.isActive) tl.timeScale(1).play();
        else tl.timeScale(1.6).reverse();
      },
    });

    return () => {
      trigger.kill();
      tl.progress(0).kill();
      peek.remove();
      link.classList.remove('has-peek');
      row.classList.remove('is-active');
    };
  });
  return () => cleanups.forEach((fn) => fn());
}

/* -------------------------------------------------------------------------- */

const FRAME_PAD = { x: 10, y: 7 };

function tapFrame() {
  const frame = document.createElement('div');
  frame.className = 'cursor-frame tap-frame';
  frame.setAttribute('aria-hidden', 'true');
  document.body.appendChild(frame);
  gsap.set(frame, { autoAlpha: 0 });
  let down = null;

  const onDown = (event) => {
    if (event.pointerType === 'mouse') return;
    down = { x: event.clientX, y: event.clientY, t: performance.now(), target: event.target };
  };

  // A tap, not the start of a scroll: little movement, short press.
  const onUp = (event) => {
    if (!down || event.pointerType === 'mouse') return;
    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    const quick = performance.now() - down.t < 700;
    const el = down.target.closest?.('a, button');
    down = null;
    if (!el || moved > 10 || !quick) return;
    // Elements with their own viewfinder marks (CTAs, project images) already frame themselves.
    if (el.querySelector(':scope > .marks, :scope .project__clip')) return;
    const r = el.getBoundingClientRect();
    if (!r.width || r.height > 140) return;

    gsap.killTweensOf(frame);
    gsap.timeline()
      .fromTo(frame,
        { x: r.left - FRAME_PAD.x * 2, y: r.top - FRAME_PAD.y * 2, width: r.width + FRAME_PAD.x * 4, height: r.height + FRAME_PAD.y * 4, autoAlpha: 0 },
        { x: r.left - FRAME_PAD.x, y: r.top - FRAME_PAD.y, width: r.width + FRAME_PAD.x * 2, height: r.height + FRAME_PAD.y * 2, autoAlpha: 1, duration: 0.3, ease: 'expo.out' })
      .to(frame, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0.45);
  };
  const onCancel = () => { down = null; };

  document.addEventListener('pointerdown', onDown, { passive: true });
  document.addEventListener('pointerup', onUp, { passive: true });
  document.addEventListener('pointercancel', onCancel, { passive: true });

  return () => {
    document.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    frame.remove();
  };
}

/* -------------------------------------------------------------------------- */

function pressFill() {
  const cleanups = $$('.cta').map((cta) => {
    const fill = $('.cta__fill', cta);
    if (!fill) return () => {};
    let held = false;
    let releaseCall = null;

    const press = (event) => {
      if (event.pointerType === 'mouse') return;
      held = true;
      releaseCall?.kill();
      cta.classList.add('is-hover');
      gsap.fromTo(fill, { yPercent: 101 }, { yPercent: 0, duration: 0.45, ease: 'expo.out', overwrite: true });
    };
    // Let the fill finish being seen before it leaves through the top.
    const release = () => {
      if (!held) return;
      held = false;
      releaseCall = gsap.delayedCall(0.25, () => {
        cta.classList.remove('is-hover');
        gsap.to(fill, { yPercent: -101, duration: 0.6, ease: 'expo.out', overwrite: true });
      });
    };

    cta.addEventListener('pointerdown', press, { passive: true });
    cta.addEventListener('pointerup', release, { passive: true });
    cta.addEventListener('pointercancel', release, { passive: true });
    return () => {
      cta.removeEventListener('pointerdown', press);
      cta.removeEventListener('pointerup', release);
      cta.removeEventListener('pointercancel', release);
      releaseCall?.kill();
    };
  });
  return () => cleanups.forEach((fn) => fn());
}

/* -------------------------------------------------------------------------- */

const WEIGHT = { base: 500, peak: 850, radius: 110 };

function dragWeight() {
  const title = $('.hero [data-weight]');
  if (!title) return () => {};
  const chars = $$('.hero__ch', title);
  const setters = chars.map((ch) => gsap.quickTo(ch, 'fontWeight', { duration: 0.5, ease: 'power3' }));
  let centres = [];
  let active = false;

  const measure = () => {
    centres = chars.map((ch) => {
      const r = ch.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    });
  };
  const apply = (x, y) => centres.forEach(([cx, cy], i) => {
    const t = Math.max(0, 1 - Math.hypot(x - cx, (y - cy) * 1.4) / WEIGHT.radius);
    setters[i](WEIGHT.base + (WEIGHT.peak - WEIGHT.base) * t * t * (3 - 2 * t));
  });

  const onDown = (event) => {
    if (event.pointerType === 'mouse') return;
    active = true;
    measure();
    apply(event.clientX, event.clientY);
  };
  const onMove = (event) => {
    if (!active || event.pointerType === 'mouse') return;
    apply(event.clientX, event.clientY);
  };
  const onEnd = () => {
    if (!active) return;
    active = false;
    setters.forEach((set) => set(WEIGHT.base));
  };

  // Horizontal drags stay with the headline; vertical swipes still scroll the page.
  title.classList.add('is-draggable');
  title.addEventListener('pointerdown', onDown, { passive: true });
  title.addEventListener('pointermove', onMove, { passive: true });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => title.addEventListener(type, onEnd, { passive: true }));

  return () => {
    title.classList.remove('is-draggable');
    title.removeEventListener('pointerdown', onDown);
    title.removeEventListener('pointermove', onMove);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => title.removeEventListener(type, onEnd));
    gsap.set(chars, { clearProps: 'fontWeight' });
  };
}

/* -------------------------------------------------------------------------- */

/**
 * Home page gets everything. Case pages only take the tap frame — their CTA
 * fill is CSS-driven, so the press state there comes from :active in CSS.
 */
export function initTouchFx({ home = true } = {}) {
  if (!gsap || !ScrollTrigger) return;
  // iOS only applies :active (used for the case-page CTA press) once a touch listener exists.
  document.addEventListener('touchstart', () => {}, { passive: true });
  gsap.matchMedia().add(TOUCH_MOTION, () => {
    const cleanups = [tapFrame()];
    if (home) cleanups.push(pressFill(), focusProjects(), activateCaps(), dragWeight());
    return () => cleanups.forEach((fn) => fn());
  });
}
