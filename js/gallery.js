/*
 * Gallery engine (after Motion's Gallery: arrangements, index, detail view).
 *
 *   const g = Gallery(stageEl, { items, arrange: 'coverflow', onActive, loop })
 *   g.arrange('fan')   // every item blends from where it is into the new shape
 *   g.go(i)            // bring item i to the front
 *   g.open(i)          // detail view: the image grows into a panel with a thumbnail strip
 *
 * items: [{ src, title, sub, text, rows: [[label, value]], href, cta, thumbs: [src] }]
 * Drag / swipe, wheel and arrow keys move through it. Reduced motion: no tweening.
 */
(() => {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (t = '') => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  /* Each arrangement maps an item's distance from the front (d) to a pose. W/H: stage size. */
  const ARR = {
    coverflow: (d, i, n, W) => {
      const a = Math.abs(d), s = Math.sign(d);
      return { x: s * (a < 1 ? a * W * .3 : W * .3 + (a - 1) * W * .1), y: 0, z: -Math.min(a, 1) * 220 - Math.max(0, a - 1) * 60, ry: -clamp(d, -1, 1) * 48, rz: 0, s: 1, o: a > 4.5 ? 0 : 1 };
    },
    fan: (d, i, n, W, H) => {
      const a = d * 11, r = a * Math.PI / 180, R = H * 1.9;
      return { x: Math.sin(r) * R, y: (1 - Math.cos(r)) * R + H * .02, z: -Math.abs(d) * 4, ry: 0, rz: a, s: .78, o: Math.abs(d) > 6.5 ? 0 : 1 };
    },
    stack: (d, i, n) => {
      const k = ((Math.round(d * 1000) / 1000) % n + n) % n; // cards after the front one, looping
      const dd = k > n - .5 ? k - n : k;
      return { x: dd * 30, y: -dd * 22, z: -dd * 40, ry: 0, rz: dd <= 0 ? dd * 8 : (Math.round(dd) % 2 ? 2.4 : -1.8) * Math.min(dd, 3) / 1.5, s: 1 - Math.max(0, dd) * .045, o: dd < -.95 || dd > 3.6 ? 0 : 1 };
    },
    helix: (d, i, n, W, H) => {
      const a = d * 34 * Math.PI / 180, R = W * .3;
      return { x: Math.sin(a) * R, y: d * H * .12, z: Math.cos(a) * R - R, ry: d * 34, rz: 0, s: .82, o: Math.abs(d) > 4.5 ? 0 : 1 };
    },
    grid: (d, i, n, W, H) => {
      const cols = W < 700 ? 2 : 3, rows = Math.ceil(n / cols), col = i % cols, row = Math.floor(i / cols);
      const cw = W / cols, ch = Math.min(H / rows, cw * .7);
      return { x: (col - (cols - 1) / 2) * cw, y: (row - (rows - 1) / 2) * ch, z: 0, ry: 0, rz: 0, s: Math.min(.92 / cols * (W / (W * .62)), (ch / (W * .62 * .625)) * .88), o: 1 };
    },
    staircase: (d, i, n, W, H) => ({ x: d * W * .17, y: d * H * .12, z: -d * 170, ry: -16, rz: 0, s: 1, o: d < -1.2 || d > 5 ? 0 : clamp(1 + d, 0, 1) }),
    list: (d, i, n, W, H) => ({ x: W * .29, y: d * H * .34, z: 0, ry: 0, rz: 0, s: .36, o: Math.abs(d) > 2.6 ? 0 : 1 - Math.abs(d) * .25 }),
  };

  window.Gallery = (stage, opts) => {
    const { items, onActive = () => {}, loop = false } = opts;
    let mode = opts.arrange || 'coverflow';
    const n = items.length;
    stage.classList.add('g-stage');
    stage.innerHTML = items.map((it, i) => `<button type="button" class="g-item" data-i="${i}" aria-label="${esc(it.title)}${it.sub ? ', ' + esc(it.sub) : ''}"><img src="${it.src}" alt="" draggable="false" loading="${i < 4 ? 'eager' : 'lazy'}"></button>`).join('');
    const els = [...stage.querySelectorAll('.g-item')];
    const state = { pos: 0, mix: 1 };
    let from = null, active = 0;

    const size = () => [stage.clientWidth, stage.clientHeight];
    const pose = (m, i, pos) => { const [W, H] = size(); let d = i - pos; if (loop && m !== 'stack' && m !== 'grid') { d = ((d % n) + n * 1.5) % n - n / 2; } return ARR[m](d, i, n, W, H); };
    const render = () => {
      els.forEach((el, i) => {
        let p = pose(mode, i, state.pos);
        if (from && state.mix < 1) {
          const t = clamp((state.mix - i * .035) / (1 - Math.min(.5, n * .035)), 0, 1);
          const e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const q = from[i];
          p = Object.fromEntries(Object.keys(p).map((k) => [k, lerp(q[k], p[k], e)]));
        }
        const front = Math.abs(i - state.pos) < .5 || (mode === 'stack' && Math.abs(((i - state.pos) % n + n) % n) < .5);
        el.style.transform = `translate(-50%, -50%) translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, ${p.z.toFixed(1)}px) rotateY(${p.ry.toFixed(2)}deg) rotateZ(${p.rz.toFixed(2)}deg) scale(${p.s.toFixed(3)})`;
        el.style.opacity = p.o.toFixed(3);
        el.style.zIndex = String(1000 - Math.round(Math.abs(p.z) + (front ? -50 : 0) + Math.abs(i - state.pos) * 3));
        el.style.pointerEvents = p.o < .2 ? 'none' : '';
        el.classList.toggle('is-front', front);
        el._pose = p;
      });
    };
    const setActive = (i) => { if (i === active) return; active = i; onActive(i); };
    const norm = (v) => (loop || mode === 'stack' ? ((Math.round(v) % n) + n) % n : clamp(Math.round(v), 0, n - 1));

    const go = (i, instant) => {
      let target = i;
      if (loop || mode === 'stack') { const cur = state.pos; let delta = ((i - cur) % n + n) % n; if (delta > n / 2) delta -= n; target = cur + delta; }
      setActive(norm(target));
      if (reduce || instant || !window.gsap) { state.pos = target; render(); return; }
      gsap.to(state, { pos: target, duration: .9, ease: 'expo.out', onUpdate: render, overwrite: 'auto' });
    };
    const arrange = (m) => {
      if (!ARR[m] || m === mode) return;
      from = els.map((el) => ({ ...el._pose }));
      mode = m; stage.dataset.arrange = m;
      if (!loop && m !== 'stack') state.pos = clamp(Math.round(state.pos), 0, n - 1);
      if (reduce || !window.gsap) { state.mix = 1; from = null; render(); return; }
      state.mix = 0;
      gsap.to(state, { mix: 1, duration: 1.1, ease: 'none', onUpdate: render, onComplete: () => { from = null; render(); } });
    };

    /* Input: drag with momentum, wheel, keys. A click on the front item opens it. */
    let drag = null, moved = false;
    stage.addEventListener('pointerdown', (e) => { if (e.button) return; drag = { x: e.clientX, y: e.clientY, p: state.pos, t: performance.now(), v: 0, lx: e.clientX, lt: performance.now() }; moved = false; });
    addEventListener('pointermove', (e) => {
      if (!drag) return;
      const vertical = mode === 'list' || mode === 'grid';
      const delta = vertical ? e.clientY - drag.y : e.clientX - drag.x;
      if (Math.abs(delta) > 6) moved = true;
      if (!moved || mode === 'grid') return;
      const [W, H] = size(); const unit = vertical ? H * .34 : (mode === 'fan' ? W * .16 : W * .22);
      const now = performance.now(); drag.v = (e.clientX - drag.lx) / Math.max(1, now - drag.lt); drag.lx = e.clientX; drag.lt = now;
      state.pos = drag.p - delta / unit; if (!loop && mode !== 'stack') state.pos = clamp(state.pos, -.4, n - .6);
      if (window.gsap) gsap.killTweensOf(state, 'pos');
      render(); setActive(norm(state.pos));
    });
    addEventListener('pointerup', () => {
      if (!drag) return;
      if (moved && mode !== 'grid') go(Math.round(state.pos - clamp(drag.v * 2.2, -2, 2)));
      drag = null;
    });
    stage.addEventListener('click', (e) => {
      const b = e.target.closest('.g-item'); if (!b) return;
      if (moved) { e.preventDefault(); moved = false; return; }
      const i = +b.dataset.i;
      if (i === active || mode === 'grid') open(i); else go(i);
    });
    let wheelLock = 0;
    stage.addEventListener('wheel', (e) => {
      if (mode === 'grid') return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
      if (!d) return; // vertical wheel keeps scrolling the page
      e.preventDefault();
      const now = performance.now(); if (now - wheelLock < 320) return; wheelLock = now;
      go(active + Math.sign(d));
    }, { passive: false });
    stage.tabIndex = 0;
    stage.setAttribute('role', 'region');
    stage.addEventListener('keydown', (e) => {
      if (e.target !== stage && !e.target.closest('.g-item')) return;
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); go(active + 1); }
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); go(active - 1); }
    });
    addEventListener('resize', render);

    /* Detail view: the picture grows from its spot into a panel with a thumbnail strip. */
    if (window.gsap && window.Flip) gsap.registerPlugin(Flip);
    const dlg = document.createElement('div');
    dlg.className = 'g-detail'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.hidden = true;
    document.body.append(dlg);
    let openIdx = -1, lastFocus = null;
    const close = () => {
      if (openIdx < 0) return;
      const el = els[openIdx], fig = dlg.querySelector('.g-detail__fig');
      const done = () => { dlg.hidden = true; dlg.innerHTML = ''; document.documentElement.classList.remove('g-locked'); window.lenis?.start(); lastFocus?.focus({ preventScroll: true }); openIdx = -1; };
      if (reduce || !window.gsap) return done();
      const tl = gsap.timeline({ onComplete: done })
        .to(dlg.querySelectorAll('.g-detail__side > *, .g-detail__strip, .g-detail__close'), { opacity: 0, y: 12, duration: .25, stagger: .02 }, 0)
        .to(dlg, { backgroundColor: 'transparent', duration: .4 }, .2);
      // GSAP Flip fits the panel back onto the card it came from, rotation and all (fan, helix and stack tilt their cards)
      if (window.Flip) tl.add(Flip.fit(fig, el, { scale: true, duration: .6, ease: 'expo.inOut' }), .05);
      else {
        const a = el.getBoundingClientRect(), b = fig.getBoundingClientRect();
        tl.to(fig, { x: a.left - b.left, y: a.top - b.top, scaleX: a.width / b.width, scaleY: a.height / b.height, duration: .6, ease: 'expo.inOut' }, .05);
      }
    };
    const open = (i) => {
      const it = items[i]; openIdx = i; lastFocus = document.activeElement;
      const thumbs = it.thumbs && it.thumbs.length ? it.thumbs : [it.src];
      dlg.setAttribute('aria-label', it.title);
      dlg.innerHTML = `<button type="button" class="g-detail__close mono">Close <b aria-hidden="true">×</b></button>
        <figure class="g-detail__fig"><img src="${thumbs[0]}" alt="${esc(it.title)}"></figure>
        <div class="g-detail__side">
          ${it.sub ? `<p class="mono g-detail__sub">${esc(it.sub)}</p>` : ''}<h3>${esc(it.title)}</h3>
          ${it.text ? `<p class="g-detail__text">${esc(it.text)}</p>` : ''}
          ${it.rows ? `<dl class="mono">${it.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
          ${it.href ? `<a class="g-detail__cta" href="${it.href}"${/^https?:/.test(it.href) ? ' target="_blank" rel="noopener"' : ''}><span class="ulink">${esc(it.cta || 'Open')}</span> <span class="arr" aria-hidden="true">→</span></a>` : ''}
        </div>
        <div class="g-detail__strip" role="list">${thumbs.map((t, k) => `<button type="button" role="listitem" class="g-thumb${k ? '' : ' is-on'}" data-k="${k}" aria-label="Image ${k + 1} of ${thumbs.length}"><img src="${t}" alt="" loading="lazy"></button>`).join('')}</div>`;
      dlg.hidden = false; document.documentElement.classList.add('g-locked'); window.lenis?.stop();
      const fig = dlg.querySelector('.g-detail__fig'), big = fig.querySelector('img');
      dlg.querySelector('.g-detail__close').addEventListener('click', close);
      dlg.querySelectorAll('.g-thumb').forEach((t) => t.addEventListener('click', () => {
        dlg.querySelectorAll('.g-thumb').forEach((x) => x.classList.toggle('is-on', x === t));
        const src = thumbs[+t.dataset.k];
        if (reduce || !window.gsap) { big.src = src; return; }
        gsap.timeline().to(big, { opacity: 0, scale: 1.03, duration: .2 }).add(() => { big.src = src; }).to(big, { opacity: 1, scale: 1, duration: .45, ease: 'power3.out' });
      }));
      dlg.querySelector('.g-detail__close').focus({ preventScroll: true });
      if (reduce || !window.gsap) return;
      const tl = gsap.timeline()
        .fromTo(dlg, { backgroundColor: 'transparent' }, { backgroundColor: getComputedStyle(document.body).backgroundColor, duration: .45 }, 0);
      if (window.Flip) {
        // GSAP Flip: work out where the panel would sit fitted onto the clicked card (its tilt included), start there, fly home
        const from = Flip.fit(fig, els[i], { scale: true, getVars: true });
        tl.fromTo(fig, from, { x: 0, y: 0, rotation: 0, skewX: 0, scaleX: 1, scaleY: 1, duration: .8, ease: 'expo.inOut', clearProps: 'transform' }, 0);
      } else {
        const a = els[i].getBoundingClientRect(), b = fig.getBoundingClientRect();
        tl.fromTo(fig, { x: a.left - b.left, y: a.top - b.top, scaleX: a.width / b.width, scaleY: a.height / b.height, transformOrigin: '0 0' }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .8, ease: 'expo.inOut' }, 0);
      }
      tl
        .from(dlg.querySelectorAll('.g-detail__side > *'), { opacity: 0, y: 24, duration: .6, stagger: .05, ease: 'power3.out' }, .45)
        .from(dlg.querySelectorAll('.g-thumb, .g-detail__close'), { y: 24, duration: .6, stagger: .03, ease: 'power3.out', clearProps: 'transform' }, .5);
    };
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && openIdx >= 0) close(); });

    stage.dataset.arrange = mode;
    render(); onActive(0);
    return { go, arrange, open, close, get active() { return active; }, get mode() { return mode; } };
  };
})();
