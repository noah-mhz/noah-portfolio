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

/*
 * States: default (small dot) · hover (ring) · label (mint disc + text, on
 * [data-cursor] media) · frame (viewfinder corners lock onto a link or button).
 * Elements that already carry their own .marks frame keep them; the cursor
 * just steps aside to a dot there. The frame follows its target every tick,
 * so magnetic movement and scrolling never leave the corners behind.
 */
const FRAME_PAD = { x: 10, y: 7 };
const FRAME_MAX_HEIGHT = 140; // big block links fall back to the ring

function frameable(el) {
  if (!el || el.matches('[data-cursor], input, select, textarea')) return false;
  if (el.querySelector(':scope > .marks')) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.height <= FRAME_MAX_HEIGHT;
}

export function initCursor() {
  const cursor = $('.cursor');
  if (!cursor) return;

  gsap.matchMedia().add(FINE_POINTER, () => {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const circle = $('.cursor__circle', cursor);
    const label = $('.cursor__label', cursor);
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3' });

    root.classList.add('has-cursor');
    gsap.set(cursor, { autoAlpha: 0 });

    const frame = document.createElement('div');
    frame.className = 'cursor-frame';
    frame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(frame);
    const follow = reduce ? 0.01 : 0.38;
    const fx = gsap.quickTo(frame, 'x', { duration: follow, ease: 'power3' });
    const fy = gsap.quickTo(frame, 'y', { duration: follow, ease: 'power3' });
    const fw = gsap.quickTo(frame, 'width', { duration: follow, ease: 'power3' });
    const fh = gsap.quickTo(frame, 'height', { duration: follow, ease: 'power3' });
    gsap.set(frame, { autoAlpha: 0, x: 0, y: 0, width: 0, height: 0 });

    let visible = false;
    let state = 'default';
    let target = null;
    const pointer = { x: -100, y: -100 };

    const setState = (next, text = '') => {
      if (next === state && (next !== 'label' || label.textContent === text)) return;
      state = next;
      cursor.classList.toggle('is-hover', next === 'hover');
      cursor.classList.toggle('is-label', next === 'label');
      if (text) label.textContent = text;

      const scale = { default: 0.1, hover: 0.5, label: 1, frame: 0, marked: 0.06 }[next];
      gsap.to(circle, { scale, duration: 0.6, ease: 'expo.out', overwrite: true });
      gsap.to(label, { autoAlpha: next === 'label' ? 1 : 0, duration: 0.3, overwrite: true });
    };

    // Each tick: keep the corners on the target, and let go if it moved out from under the pointer.
    const track = () => {
      if (!target) return;
      const r = target.getBoundingClientRect();
      const inside = r.width > 0
        && pointer.x >= r.left - FRAME_PAD.x && pointer.x <= r.right + FRAME_PAD.x
        && pointer.y >= r.top - FRAME_PAD.y && pointer.y <= r.bottom + FRAME_PAD.y;
      if (!inside || !target.isConnected) {
        release();
        setState('default');
        return;
      }
      fx(r.left - FRAME_PAD.x);
      fy(r.top - FRAME_PAD.y);
      fw(r.width + FRAME_PAD.x * 2);
      fh(r.height + FRAME_PAD.y * 2);
    };

    function release() {
      if (!target) return;
      target = null;
      gsap.ticker.remove(track);
      // Corners close back in on the pointer and fade.
      fx(pointer.x);
      fy(pointer.y);
      fw(0);
      fh(0);
      gsap.to(frame, { autoAlpha: 0, duration: 0.25, overwrite: 'auto' });
    }

    const lock = (el) => {
      if (target === el) return;
      const fresh = !target;
      target = el;
      if (fresh) {
        // Open from the pointer so the corners visibly spread out to the edges.
        gsap.set(frame, { x: pointer.x, y: pointer.y, width: 0, height: 0 });
        fx(pointer.x);
        fy(pointer.y);
        fw(0);
        fh(0);
      }
      gsap.to(frame, { autoAlpha: 1, duration: 0.2, overwrite: 'auto' });
      setState('frame');
      gsap.ticker.remove(track);
      gsap.ticker.add(track);
      track();
    };

    const onMove = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
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
      if (labelled) { release(); return setState('label', labelled.dataset.cursor); }
      const link = event.target.closest('a, button');
      if (link) {
        if (frameable(link)) return lock(link);
        release();
        return setState(link.querySelector(':scope > .marks') ? 'marked' : 'hover');
      }
      release();
      return setState('default');
    };

    // A click that opens the form or leaves the page lets go, so corners never hang on a covered link.
    // In-page anchors keep the frame — the link is still under the pointer.
    const onDown = () => {
      if (!target) return;
      const href = target.getAttribute('href') || '';
      if (target.matches('[data-pf-open], [data-pf-close]') || (href && !href.startsWith('#'))) {
        release();
        setState('default');
      }
    };

    const onLeave = () => {
      visible = false;
      release();
      gsap.to(cursor, { autoAlpha: 0, duration: 0.3 });
    };

    const dispose = listen([
      [window, 'pointermove', onMove, { passive: true }],
      [document, 'pointerover', onOver],
      [document, 'pointerdown', onDown],
      [root, 'pointerleave', onLeave],
    ]);

    return () => {
      dispose();
      gsap.ticker.remove(track);
      frame.remove();
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
    // Mouse hover and keyboard focus only — touch presses are handled in touch.js.
    listen([
      [cta, 'pointerenter', (event) => { if (event.pointerType === 'mouse') enter(); }],
      [cta, 'pointerleave', (event) => { if (event.pointerType === 'mouse') leave(); }],
      [cta, 'focus', () => { if (cta.matches(':focus-visible')) enter(); }],
      [cta, 'blur', () => { if (cta.classList.contains('is-hover')) leave(); }],
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
   Variable weight: characters near the pointer grow heavier, then ease back.
   Used on the hero headline and the contact line. On touch screens the
   contact line plays one weight wave as it comes into view instead.
   -------------------------------------------------------------------------- */

const WEIGHT = { base: 500, peak: 850, radius: 280 };

export function initHeroWeight() {
  const titles = $$('[data-weight]');
  if (!titles.length) return;

  gsap.matchMedia().add(FINE_POINTER_MOTION, () => {
    const disposers = titles.map((title) => {
      const chars = $$('.hero__ch', title);
      const region = title.closest('section') || title;
      const setters = chars.map((ch) => gsap.quickTo(ch, 'fontWeight', { duration: 0.7, ease: 'power3' }));
      let centres = [];
      let measuredAt = 0;

      // Positions shift slightly as weights change, so re-measure at most twice a second.
      const measure = () => {
        centres = chars.map((ch) => {
          const r = ch.getBoundingClientRect();
          return [r.left + r.width / 2, r.top + r.height / 2];
        });
        measuredAt = performance.now();
      };

      const onMove = (event) => {
        if (performance.now() - measuredAt > 500) measure();
        centres.forEach(([x, y], i) => {
          const d = Math.hypot(event.clientX - x, event.clientY - y);
          const t = Math.max(0, 1 - d / WEIGHT.radius);
          setters[i](WEIGHT.base + (WEIGHT.peak - WEIGHT.base) * t * t * (3 - 2 * t));
        });
      };

      const onLeave = () => setters.forEach((set) => set(WEIGHT.base));
      // Scrolling moves the text under a still pointer, so positions go stale.
      const onScroll = () => { measuredAt = 0; };

      const dispose = listen([
        [region, 'pointermove', onMove, { passive: true }],
        [region, 'pointerleave', onLeave],
        [window, 'scroll', onScroll, { passive: true }],
      ]);

      return () => {
        dispose();
        gsap.set(chars, { clearProps: 'fontWeight' });
      };
    });

    return () => disposers.forEach((dispose) => dispose());
  });

  // Touch: one left-to-right wave through the contact line once it has risen into view.
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference) and ((hover: none) or (max-width: 1023px))', () => {
    const triggers = titles.filter((title) => !title.closest('.hero')).map((title) => {
      const chars = $$('.hero__ch', title);
      const wave = gsap.timeline({ paused: true })
        .to(chars, {
          fontWeight: 800,
          duration: 0.45,
          ease: 'sine.inOut',
          stagger: { each: 0.035, yoyo: true, repeat: 1 },
        });
      return window.ScrollTrigger?.create({
        trigger: title,
        start: 'top 60%',
        once: true,
        onEnter: () => gsap.delayedCall(0.9, () => wave.play()),
      });
    });

    return () => {
      triggers.forEach((trigger) => trigger?.kill());
      titles.forEach((title) => gsap.set($$('.hero__ch', title), { clearProps: 'fontWeight' }));
    };
  });
}

/* --------------------------------------------------------------------------
   In-view video: plays only while visible, never for reduced-motion users
   -------------------------------------------------------------------------- */

export function initInViewVideo() {
  const videos = $$('[data-inview-video]');
  if (!videos.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        target.preload = 'auto';
        target.play().catch(() => {});
      } else {
        target.pause();
      }
    });
  }, { threshold: 0 }); // start as soon as any part of the frame is on screen

  videos.forEach((video) => observer.observe(video));
}

/* --------------------------------------------------------------------------
   Local time
   -------------------------------------------------------------------------- */

export function initClock() {
  const clocks = $$('[data-clock]');
  if (!clocks.length) return;

  const format = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const tick = () => {
    const text = `${format.format(new Date())} SGT`;
    clocks.forEach((el) => { el.textContent = text; });
    // Re-align to the next whole second so the digits change with the real clock.
    setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  };
  tick();
}

/* --------------------------------------------------------------------------
   Timeline details (phones): each role shows its summary; the bullet points
   open behind a "Details +" toggle so the timeline isn't three screens long.
   -------------------------------------------------------------------------- */

export function initTimelineDetails() {
  const lists = $$('.tl__points');
  if (!lists.length) return;
  const phone = window.matchMedia('(max-width: 767px)');
  const refresh = () => window.ScrollTrigger?.refresh();

  const setup = () => {
    lists.forEach((list, index) => {
      let button = list.previousElementSibling?.classList.contains('tl__more') ? list.previousElementSibling : null;
      if (!phone.matches) {
        button?.remove();
        list.classList.remove('is-collapsed');
        list.style.height = '';
        list.removeAttribute('id');
        return;
      }
      if (button) return;
      list.id = list.id || `tl-points-${index}`;
      list.classList.add('is-collapsed');
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'tl__more label';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', list.id);
      button.innerHTML = 'Details <span aria-hidden="true">+</span>';
      list.before(button);

      button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(open));
        button.innerHTML = `${open ? 'Less' : 'Details'} <span aria-hidden="true">${open ? '−' : '+'}</span>`;
        const { gsap: g } = window;
        if (!g || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          list.classList.toggle('is-collapsed', !open);
          refresh();
          return;
        }
        if (open) {
          list.classList.remove('is-collapsed');
          g.fromTo(list, { height: 0 }, { height: 'auto', duration: 0.6, ease: 'expo.out', onComplete: refresh });
        } else {
          g.to(list, { height: 0, duration: 0.45, ease: 'power2.inOut', onComplete: () => { list.classList.add('is-collapsed'); list.style.height = ''; refresh(); } });
        }
      });
    });
    refresh();
  };

  setup();
  phone.addEventListener('change', setup);
}
