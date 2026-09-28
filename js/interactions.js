const { gsap } = window;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const FINE_POINTER = '(hover: hover) and (pointer: fine) and (min-width: 1024px)';
const FINE_POINTER_MOTION = `${FINE_POINTER} and (prefers-reduced-motion: no-preference)`;

const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

/** Registers listeners and returns a disposer, so matchMedia can tear them down. */
function listen(bindings) {
  bindings.forEach(([target, type, handler, options]) => target.addEventListener(type, handler, options));
  return () => bindings.forEach(([target, type, handler, options]) => target.removeEventListener(type, handler, options));
}

/* --------------------------------------------------------------------------
   Cursor
   -------------------------------------------------------------------------- */

export function initCursor() {
  const cursor = $('.cursor');
  if (!cursor) return;

  gsap.matchMedia().add(FINE_POINTER, () => {
    const root = document.documentElement;
    const circle = $('.cursor__circle', cursor);
    const label = $('.cursor__label', cursor);
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3' });
    let visible = false;
    let state = 'default';

    root.classList.add('has-cursor');
    gsap.set(cursor, { autoAlpha: 0 });

    const setState = (next, text = '') => {
      if (next === state && (next !== 'label' || label.textContent === text)) return;
      state = next;
      cursor.classList.toggle('is-hover', next === 'hover');
      cursor.classList.toggle('is-label', next === 'label');
      if (text) label.textContent = text;

      const scale = { default: 0.1, hover: 0.5, label: 1 }[next];
      gsap.to(circle, { scale, duration: 0.6, ease: 'expo.out', overwrite: true });
      gsap.to(label, { autoAlpha: next === 'label' ? 1 : 0, duration: 0.3, overwrite: true });
    };

    const onMove = (event) => {
      if (!visible) {
        visible = true;
        gsap.set(cursor, { x: event.clientX, y: event.clientY });
        gsap.to(cursor, { autoAlpha: 1, duration: 0.4 });
      }
      xTo(event.clientX);
      yTo(event.clientY);
    };

    const onOver = (event) => {
      const labelled = event.target.closest('[data-cursor]');
      if (labelled) return setState('label', labelled.dataset.cursor);
      if (event.target.closest('a, button')) return setState('hover');
      return setState('default');
    };

    const onLeave = () => {
      visible = false;
      gsap.to(cursor, { autoAlpha: 0, duration: 0.3 });
    };

    const dispose = listen([
      [window, 'pointermove', onMove, { passive: true }],
      [document, 'pointerover', onOver],
      [root, 'pointerleave', onLeave],
    ]);

    return () => {
      dispose();
      root.classList.remove('has-cursor');
    };
  });
}

/* --------------------------------------------------------------------------
   Magnetic elements
   -------------------------------------------------------------------------- */

export function initMagnetic() {
  gsap.matchMedia().add(FINE_POINTER_MOTION, () => {
    const disposers = $$('[data-magnetic]').map((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.3;
      const inner = $('[data-magnetic-inner]', el);
      const xTo = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' });
      const innerX = inner && gsap.quickTo(inner, 'x', { duration: 0.9, ease: 'power3' });
      const innerY = inner && gsap.quickTo(inner, 'y', { duration: 0.9, ease: 'power3' });
      let bounds = null;

      const onEnter = () => {
        const rect = el.getBoundingClientRect();
        const x = gsap.getProperty(el, 'x');
        const y = gsap.getProperty(el, 'y');
        bounds = { cx: rect.left - x + rect.width / 2, cy: rect.top - y + rect.height / 2 };
      };

      const onMove = (event) => {
        if (!bounds) onEnter();
        const dx = event.clientX - bounds.cx;
        const dy = event.clientY - bounds.cy;
        xTo(dx * strength);
        yTo(dy * strength);
        innerX?.(dx * strength * 0.4);
        innerY?.(dy * strength * 0.4);
      };

      const onLeave = () => {
        bounds = null;
        xTo(0);
        yTo(0);
        innerX?.(0);
        innerY?.(0);
      };

      return listen([
        [el, 'pointerenter', onEnter],
        [el, 'pointermove', onMove],
        [el, 'pointerleave', onLeave],
      ]);
    });

    return () => disposers.forEach((dispose) => dispose());
  });
}

/* --------------------------------------------------------------------------
   Hover choreography: CTA fill, project panels, capabilities
   -------------------------------------------------------------------------- */

export function initHoverAnimations() {
  // CTA fill enters from below and exits through the top — a directional wipe.
  $$('.cta').forEach((cta) => {
    const fill = $('.cta__fill', cta);
    // Take over the CSS resting offset so GSAP owns a single transform.
    gsap.set(fill, { y: 0, yPercent: 101 });
    const enter = () => {
      cta.classList.add('is-hover');
      gsap.fromTo(fill, { yPercent: 101 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', overwrite: true });
    };
    const leave = () => {
      cta.classList.remove('is-hover');
      gsap.to(fill, { yPercent: -101, duration: 0.7, ease: 'expo.out', overwrite: true });
    };
    listen([
      [cta, 'pointerenter', enter],
      [cta, 'pointerleave', leave],
      [cta, 'focus', enter],
      [cta, 'blur', leave],
    ]);
  });

  gsap.matchMedia().add(FINE_POINTER_MOTION, () => {
    const disposers = $$('[data-project]').map((project) => {
      const media = $('.project__media', project);
      const img = $('.project__img', project);
      const meta = $('.project__meta', project);
      const shift = project.classList.contains('project--alt') ? 10 : -10;
      const imgX = gsap.quickTo(img, 'xPercent', { duration: 1.2, ease: 'power3' });
      const imgY = gsap.quickTo(img, 'yPercent', { duration: 1.2, ease: 'power3' });
      let rect = null;

      // The image leans a fraction toward the pointer inside its frame.
      const onMove = (event) => {
        rect = rect || media.getBoundingClientRect();
        imgX(((event.clientX - rect.left) / rect.width - 0.5) * -3);
        imgY(((event.clientY - rect.top) / rect.height - 0.5) * -3);
      };

      return listen([
        [media, 'pointerenter', () => {
          rect = null;
          media.classList.add('is-hover');
          gsap.to(img, { scale: 1.03, duration: 1.4, ease: 'expo.out', overwrite: 'auto' });
          gsap.to(meta, { x: shift, duration: 1, ease: 'expo.out', overwrite: 'auto' });
        }],
        [media, 'pointermove', onMove],
        [media, 'pointerleave', () => {
          media.classList.remove('is-hover');
          imgX(0);
          imgY(0);
          gsap.to(img, { scale: 1, duration: 1.4, ease: 'expo.out', overwrite: 'auto' });
          gsap.to(meta, { x: 0, duration: 1, ease: 'expo.out', overwrite: 'auto' });
        }],
      ]);
    });

    return () => disposers.forEach((dispose) => dispose());
  });

  initCapabilities();
}

function initCapabilities() {
  const list = $('[data-caps]');
  const preview = $('.cap-preview');
  if (!list || !preview) return;

  gsap.matchMedia().add(FINE_POINTER_MOTION, () => {
    const rows = $$('[data-cap]', list);
    const images = $$('img', preview);
    const rail = $('.grid-lines span:nth-child(3)');
    const yTo = gsap.quickTo(preview, 'y', { duration: 0.8, ease: 'power3' });
    let previewHeight = 0;
    let active = -1;
    let layer = 1;

    const timelines = rows.map((row) => gsap.timeline({ paused: true, defaults: { duration: 0.8, ease: 'expo.out' } })
      .to($('.cap__title-inner', row), { x: 28 }, 0)
      .to($('.cap__num', row), { x: 14, color: accent() }, 0)
      .to($('.cap__line', row), { scaleX: 1, duration: 1 }, 0)
      .to($('.cap__arrow', row), { x: 10, color: accent() }, 0)
      .fromTo($('.cap__meta', row), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, 0.08));

    const showImage = (index) => {
      if (index === active) return;
      active = index;
      layer += 1;
      gsap.set(images[index], { zIndex: layer });
      gsap.fromTo(images[index],
        { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.2 },
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.9, ease: 'expo.out', overwrite: true });
    };

    // The preview rides the third grid line: it only travels vertically with the pointer.
    const onListEnter = (event) => {
      previewHeight = preview.offsetHeight;
      gsap.set(preview, { x: rail.getBoundingClientRect().left, y: event.clientY - previewHeight / 2 });
      list.classList.add('is-hovering');
      gsap.fromTo(preview,
        { autoAlpha: 1, clipPath: 'inset(50% 0% 50% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
    };

    const onListLeave = () => {
      list.classList.remove('is-hovering');
      active = -1;
      gsap.to(preview, {
        clipPath: 'inset(50% 0% 50% 0%)', duration: 0.5, ease: 'power3.in', overwrite: 'auto',
        onComplete: () => gsap.set(preview, { autoAlpha: 0 }),
      });
    };

    const onListMove = (event) => yTo(event.clientY - previewHeight / 2);

    const rowDisposers = rows.map((row, index) => {
      const enter = () => {
        row.classList.add('is-active');
        timelines[index].timeScale(1).play();
        showImage(index);
      };
      const leave = () => {
        row.classList.remove('is-active');
        timelines[index].timeScale(1.5).reverse();
      };
      return listen([
        [row, 'pointerenter', enter],
        [row, 'pointerleave', leave],
        [row, 'focusin', enter],
        [row, 'focusout', leave],
      ]);
    });

    const disposeList = listen([
      [list, 'pointerenter', onListEnter],
      [list, 'pointerleave', onListLeave],
      [list, 'pointermove', onListMove],
    ]);

    return () => {
      disposeList();
      rowDisposers.forEach((dispose) => dispose());
      list.classList.remove('is-hovering');
    };
  });
}

/* --------------------------------------------------------------------------
   Local time
   -------------------------------------------------------------------------- */

export function initClock() {
  const el = $('[data-clock]');
  if (!el) return;

  const format = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
  });

  const tick = () => { el.textContent = `${format.format(new Date())} SGT`; };
  tick();
  setInterval(tick, 30000);
}
