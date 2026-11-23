/*
 * The Other Side (/other-side/).
 *
 * Desktop (≥ 900px): a bounded board. Native scroll drives a camera along a route through five stops
 * (welcome + four exhibits); between stops it eases and pulls back a little so you see where you are.
 * Drag the board to travel along the route, ← → / number keys jump between stops, the ticks and the
 * mini-map show position. Phones: the exhibits are stacked and scroll normally.
 *
 * Entry: the head script clips the world to the square clicked on the homepage; it opens to the full
 * screen while the world inside settles from a little closer (a space, not a flat colour). Return
 * ("← Back to reality", Esc) folds the world back into the button's square, then goes home, where that
 * square flies back into the full stop. Reduced motion: no camera easing, no entry or exit animation.
 *
 * Exhibits run only while the camera is near them (desktop) or while on screen (phones).
 */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  addEventListener('DOMContentLoaded', () => {
    const g = window.gsap;
    const world = $('[data-world]'), board = $('[data-board]'), track = $('[data-track]');
    const exs = $$('[data-ex]'), N = exs.length;
    const nowN = $('[data-now-n]'), nowName = $('[data-now-name]'), ticks = $$('[data-goto]').filter((b) => b.closest('.os-nav'));
    const wide = matchMedia('(min-width: 900px)');
    let BOARD = wide.matches; // desktop board vs stacked phones

    /* ---------- Exhibits ---------- */
    const EX = { stretch: Stretch($('[data-stretch]')), pressure: Pressure($('[data-pressure]')), helix: Helix($('[data-helix]')), pile: Pile($('[data-pile]')) };
    const setLive = (i, on) => { const e = EX[exs[i].dataset.ex]; if (e) (on ? e.on : e.off)(); };

    /* ---------- Position UI ---------- */
    let current = -1;
    const setCurrent = (i) => {
      if (i === current) return; current = i;
      nowN.textContent = `${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
      nowName.textContent = exs[i].dataset.name;
      ticks.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
    };

    /* ---------- Board layout (desktop) ---------- */
    // Stops in viewport units: a zig-zag route, every exhibit about one screen from the next.
    const STOPS = [[.5, .5], [1.62, .92], [.72, 1.92], [1.78, 2.42], [.82, 3.3]];
    const BW = 2.42, BH = 3.82;
    let W = innerWidth, H = innerHeight, pts = [], seg = 0, lenis = null, cam = { x: 0, y: 0, s: 1 };
    const map = $('[data-map]');

    const layout = () => {
      W = innerWidth; H = innerHeight; BOARD = wide.matches;
      if (!BOARD) { board.style.transform = ''; return; }
      board.style.width = BW * W + 'px'; board.style.height = BH * H + 'px';
      pts = STOPS.map(([x, y]) => ({ x: x * W, y: y * H }));
      const pw = Math.min(W * .84, 1500), ph = Math.min(H * .8, 980);
      exs.forEach((el, i) => {
        const w = i === 0 ? Math.min(W * .86, 1500) : pw, h = i === 0 ? H * .82 : ph;
        Object.assign(el.style, { width: w + 'px', height: h + 'px', left: pts[i].x - w / 2 + 'px', top: pts[i].y - h / 2 + 'px' });
      });
      // Route: a soft curve through the stops.
      const d = pts.map((p, i) => {
        if (!i) return `M${p.x},${p.y}`;
        const a = pts[i - 1], mx = (a.x + p.x) / 2;
        return `C${mx},${a.y} ${mx},${p.y} ${p.x},${p.y}`;
      }).join(' ');
      $('[data-route] path').setAttribute('d', d);
      track.style.height = (N - 1) * 100 + 100 + 'vh';
      // Mini-map
      const sx = 100 / (BW * W), sy = 100 / (BH * H) * (88 / 100) * (100 / 88);
      map.setAttribute('viewBox', `0 0 ${BW * 40} ${BH * 40}`);
      map.innerHTML = `<rect class="m-board" x="1" y="1" width="${BW * 40 - 2}" height="${BH * 40 - 2}"/>` +
        pts.map((p, i) => `<rect class="m-stop" data-m="${i}" x="${p.x / W * 40 - 5}" y="${p.y / H * 40 - 5}" width="10" height="10"/>`).join('') +
        `<rect class="m-cam" data-mcam x="0" y="0" width="40" height="40"/>`;
      exs.forEach((_, i) => EX[exs[i].dataset.ex]?.resize?.());
      render(true);
    };

    // Scroll progress → camera. Each segment eases in and out (smootherstep), so the camera settles on
    // every exhibit; mid-way it pulls back a little so the neighbouring exhibits show.
    const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    let lastLive = [];
    const render = (force) => {
      if (!BOARD) return;
      const max = Math.max(1, document.documentElement.scrollHeight - H);
      const y = lenis ? lenis.scroll : scrollY;
      const p = clamp(y / max, 0, 1) * (N - 1);
      seg = Math.min(N - 2, Math.floor(p));
      const t = p - seg, e = REDUCE ? t : smoother(t);
      const a = pts[seg], b = pts[seg + 1];
      const s = 1 - (REDUCE ? 0 : Math.sin(Math.PI * e) * .16);
      cam = { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), s };
      board.style.transform = `translate3d(${W / 2 - cam.x * s}px, ${H / 2 - cam.y * s}px, 0) scale(${s})`;
      setCurrent(Math.round(p));
      // Mini-map camera
      const mc = $('[data-mcam]', map);
      if (mc) { const vw = W / s / W * 40, vh = H / s / H * 40; mc.setAttribute('x', cam.x / W * 40 - vw / 2); mc.setAttribute('y', cam.y / H * 40 - vh / 2); mc.setAttribute('width', vw); mc.setAttribute('height', vh); }
      $$('.m-stop', map).forEach((r, i) => r.classList.toggle('is-on', i === Math.round(p)));
      // Only the exhibits near the camera run.
      const live = exs.map((_, i) => Math.abs(i - p) < .85);
      live.forEach((on, i) => { if (force || on !== lastLive[i]) setLive(i, on); });
      lastLive = live;
    };

    const stopY = (i) => (Math.max(1, document.documentElement.scrollHeight - H)) * (i / (N - 1));
    const goTo = (i) => {
      i = clamp(i, 0, N - 1);
      if (!BOARD) { exs[i].scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }); return; }
      if (lenis) lenis.scrollTo(stopY(i), { duration: REDUCE ? 0 : 1.3, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else scrollTo({ top: stopY(i), behavior: REDUCE ? 'auto' : 'smooth' });
    };
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => goTo(+b.dataset.goto)));

    addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, [data-stretch-word], [data-pressure], .hx, .print')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
      else if (/^[1-5]$/.test(e.key)) goTo(+e.key - 1);
      else if (e.key === 'Escape') back();
    });

    // Drag the board: movement along the current leg of the route moves you along it; release settles
    // on the nearest exhibit. Drags that start inside an exhibit's play area belong to the exhibit.
    let drag = null;
    world.addEventListener('pointerdown', (e) => {
      if (!BOARD || e.button || e.target.closest('.stretch, .pressure, .helix, .pile, a, button, input, label')) return;
      drag = { x: e.clientX, y: e.clientY, start: lenis ? lenis.scroll : scrollY, moved: false };
      board.classList.add('is-grab');
    });
    addEventListener('pointermove', (e) => {
      if (!drag) return;
      const a = pts[seg], b = pts[seg + 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const along = -((e.clientX - drag.x) * dx + (e.clientY - drag.y) * dy) / len / cam.s;
      const perSeg = Math.max(1, document.documentElement.scrollHeight - H) / (N - 1);
      if (Math.abs(along) > 4) drag.moved = true;
      const to = drag.start + along / len * perSeg;
      if (lenis) lenis.scrollTo(to, { immediate: true }); else scrollTo(0, to);
    });
    addEventListener('pointerup', () => {
      if (!drag) return;
      board.classList.remove('is-grab');
      if (drag.moved) { const p = (lenis ? lenis.scroll : scrollY) / Math.max(1, document.documentElement.scrollHeight - H) * (N - 1); goTo(Math.round(p)); }
      drag = null;
    });

    /* ---------- Phones: on-screen exhibits run, the counter follows ---------- */
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (BOARD) return;
        const i = exs.indexOf(e.target);
        setLive(i, e.isIntersecting);
        if (e.isIntersecting && e.intersectionRatio > .4) setCurrent(i);
      }), { threshold: [0, .4] });
      exs.forEach((el) => io.observe(el));
    }

    /* ---------- Smooth scroll + resize ---------- */
    if (!REDUCE && window.Lenis && BOARD) {
      lenis = new Lenis({ lerp: .085, wheelMultiplier: .9 });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      lenis.on('scroll', () => render());
    } else addEventListener('scroll', () => render(), { passive: true });
    let rz = 0;
    addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { const was = BOARD; layout(); if (was !== BOARD) location.reload(); }, 150); });
    layout();
    if (!BOARD) setCurrent(0);
    scrollTo(0, 0);

    /* ---------- Entry: the square opens into the world ---------- */
    const ui = ['.os-back', '.os-mark', '.os-nav'].map((q) => $(q));
    if (root.classList.contains('os-enter') && g) {
      const s = getComputedStyle(root), at = s.getPropertyValue('--at'), al = s.getPropertyValue('--al'), ar = s.getPropertyValue('--ar'), ab = s.getPropertyValue('--ab');
      const wl = $('.welcome'), wf = $('.welcome__foot');
      g.set(ui, { autoAlpha: 0 });
      g.timeline({ onComplete: () => { root.classList.remove('os-enter'); g.set(world, { clearProps: 'clipPath' }); } })
        .fromTo(world, { clipPath: `inset(${at} ${ar} ${ab} ${al})` }, { clipPath: 'inset(0px 0px 0px 0px)', duration: .7, ease: 'expo.inOut' }, 0)
        .fromTo(board, { scale: 1.22 }, { scale: 1, duration: 1, ease: 'expo.out', onComplete: () => { g.set(board, { clearProps: 'transform' }); render(true); } }, .05)
        .add(() => root.classList.remove('os-enter'), .7)
        .fromTo($$('.welcome__l', wl), { yPercent: 60, autoAlpha: 0, rotation: (i) => [-4, 3, -2][i] }, { yPercent: 0, autoAlpha: 1, rotation: 0, duration: .9, stagger: .08, ease: 'back.out(1.6)' }, .12)
        .fromTo(wf, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6, ease: 'power3.out' }, .6)
        .to(ui, { autoAlpha: 1, duration: .5, stagger: .06 }, .8);
    } else root.classList.remove('os-enter');

    /* ---------- Back to reality ---------- */
    const backLink = $('[data-back]'), backSq = $('.os-back__sq');
    let leaving = false, curtain = null;
    function back(e) {
      if (e && (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
      if (e) e.preventDefault();
      if (leaving) return; leaving = true;
      const r = backSq.getBoundingClientRect();
      try { sessionStorage.setItem('os-return', JSON.stringify({ x: r.left, y: r.top, w: r.width, h: r.height })); } catch (err) {}
      const cameFromHome = document.referrer && new URL(document.referrer).origin === location.origin && new URL(document.referrer).pathname === '/' && history.length > 1;
      const go = () => { if (cameFromHome) history.back(); else location.href = '/'; };
      if (REDUCE || !g) return go();
      lenis?.stop();
      // The old ground closes in around the world, leaving it only inside the button's square.
      const hole = (l, t, rr, b) => `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${l}px ${t}px, ${l}px ${b}px, ${rr}px ${b}px, ${rr}px ${t}px, ${l}px ${t}px)`;
      curtain = document.createElement('div'); curtain.className = 'os-curtain'; curtain.setAttribute('aria-hidden', 'true');
      document.body.append(curtain);
      const tl = g.timeline({ onComplete: go })
        .to(ui, { autoAlpha: 0, duration: .2 }, 0)
        .fromTo(curtain, { clipPath: hole(0, 0, innerWidth, innerHeight) }, { clipPath: hole(r.left, r.top, r.right, r.bottom), duration: .6, ease: 'expo.inOut' }, 0);
      if (BOARD) tl.to(board, { scale: cam.s * 1.12, duration: .6, ease: 'power3.in' }, 0);
    }
    backLink.addEventListener('click', back);
    // Back from the browser's cache: undo the exit state.
    addEventListener('pageshow', (e) => {
      if (!e.persisted || !leaving) return;
      leaving = false; lenis?.start();
      curtain?.remove(); curtain = null;
      if (g) g.set(ui, { clearProps: 'opacity,visibility' });
      render(true);
    });
  });

  /* ================= Exhibits ================= */

  /* 01 · Stretch: grab and pull. Letters near the grab point take most of the pull; release springs back. */
  function Stretch(box) {
    const word = $('[data-stretch-word]', box), sec = box.closest('.ex');
    const txt = word.textContent.trim(); word.textContent = '';
    word.setAttribute('aria-label', `The word ${txt.toUpperCase()}. Use the arrow keys to change width and weight.`);
    const L = [...txt].map((c) => { const s = document.createElement('span'); s.textContent = c; s.setAttribute('aria-hidden', 'true'); word.append(s); return { el: s, w: 100, g: 800, x: 0 }; });
    const base = { w: 100, g: 800 };
    const out = { w: $('[data-out="w"]', sec), g: $('[data-out="g"]', sec) }, inp = { w: $('[data-axis="w"]', sec), g: $('[data-axis="g"]', sec) };
    const paint = () => L.forEach((l) => { l.el.style.setProperty('--w', l.w.toFixed(1)); l.el.style.setProperty('--g', l.g.toFixed(0)); l.el.style.transform = l.x ? `translateX(${l.x.toFixed(1)}px)` : ''; });
    const readout = () => { out.w.textContent = Math.round(base.w); out.g.textContent = Math.round(base.g); inp.w.value = base.w; inp.g.value = base.g; };
    const toBase = (springy) => {
      if (REDUCE || !window.gsap) { L.forEach((l) => Object.assign(l, { w: base.w, g: base.g, x: 0 })); return paint(); }
      gsap.to(L, { w: base.w, g: base.g, x: 0, duration: springy ? 1.1 : .45, ease: springy ? 'elastic.out(1, .32)' : 'power3.out', stagger: springy ? { each: .025, from: 'center' } : 0, onUpdate: paint, overwrite: true });
    };
    ['w', 'g'].forEach((k) => inp[k].addEventListener('input', () => { base[k] = +inp[k].value; readout(); toBase(false); }));
    let drag = null;
    word.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      const r = word.getBoundingClientRect();
      const centres = L.map((l) => { const b = l.el.getBoundingClientRect(); return b.left + b.width / 2; });
      let gi = 0, best = Infinity; centres.forEach((c, i) => { const d = Math.abs(c - e.clientX); if (d < best) { best = d; gi = i; } });
      drag = { x: e.clientX, y: e.clientY, gi, W: r.width, H: r.height, touch: e.pointerType !== 'mouse' };
      word.setPointerCapture(e.pointerId);
      window.gsap?.killTweensOf(L);
    });
    word.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = drag.touch ? 0 : e.clientY - drag.y;
      L.forEach((l, i) => {
        const f = Math.exp(-((i - drag.gi) ** 2) / 3.2), side = i === drag.gi ? 1 : Math.sign(i - drag.gi) * Math.sign(dx || 1);
        l.w = clamp(base.w + (Math.abs(dx) / drag.W) * 220 * f * (side >= 0 ? 1 : .35), 62, 125);
        l.g = clamp(base.g - (dy / drag.H) * 900 * f, 100, 900);
        l.x = dx * f * .18;
      });
      paint();
    });
    const up = () => { if (!drag) return; drag = null; toBase(true); };
    word.addEventListener('pointerup', up); word.addEventListener('pointercancel', up);
    word.addEventListener('keydown', (e) => {
      const k = { ArrowLeft: ['w', -4], ArrowRight: ['w', 4], ArrowUp: ['g', 50], ArrowDown: ['g', -50] }[e.key];
      if (!k) return; e.preventDefault();
      base[k[0]] = clamp(base[k[0]] + k[1], k[0] === 'w' ? 62 : 100, k[0] === 'w' ? 125 : 900); readout(); toBase(false);
    });
    paint(); readout();
    // Idle tease: while visible and untouched, one letter breathes now and then.
    let live = false, teaseT = 0;
    const tease = () => {
      clearTimeout(teaseT); if (!live || REDUCE || !window.gsap) return;
      teaseT = setTimeout(() => {
        if (!live || drag) return tease();
        const l = L[Math.floor(Math.random() * L.length)];
        gsap.timeline({ onComplete: tease }).to(l, { w: 125, g: 300, duration: .5, ease: 'power3.out', onUpdate: paint }).to(l, { w: base.w, g: base.g, duration: 1, ease: 'elastic.out(1, .35)', onUpdate: paint });
      }, 2200);
    };
    return { on: () => { live = true; tease(); }, off: () => { live = false; clearTimeout(teaseT); } };
  }

  /* 02 · Pressure: a field that keeps a fading memory of where you've been. Letters sit in fixed-width
     boxes, so changing a letter's axes never reflows the field; only letters with pressure are touched. */
  function Pressure(box) {
    const WORD = 'PRESSURE·';
    let cells = [], rows = 0, cols = 0, pos = [], P, active = new Set(), live = false, raf = 0;
    const cur = document.createElement('span'); cur.className = 'pressure__cursor'; cur.setAttribute('aria-hidden', 'true');
    const build = () => {
      box.innerHTML = ''; box.append(cur);
      const r = box.getBoundingClientRect(); if (!r.width) return;
      const fs = clamp(r.width / 22, 22, 72); box.style.fontSize = fs + 'px';
      cols = Math.max(8, Math.floor(r.width / (fs * .62))); rows = Math.max(5, Math.floor(r.height / (fs * 1.02)));
      const frag = document.createDocumentFragment(); cells = [];
      for (let y = 0; y < rows; y++) {
        const row = document.createElement('div'); row.className = 'pressure__row'; row.setAttribute('aria-hidden', 'true');
        for (let x = 0; x < cols; x++) { const s = document.createElement('span'); s.textContent = WORD[(x + y * 3) % WORD.length]; row.append(s); cells.push(s); }
        frag.append(row);
      }
      box.append(frag);
      P = new Float32Array(cells.length); active.clear();
      // Positions in the field's own (unscaled) pixels: the board may be zoomed while this runs.
      const b0 = box.getBoundingClientRect(), k = box.offsetWidth / b0.width;
      pos = cells.map((c) => { const b = c.getBoundingClientRect(); return [(b.left - b0.left + b.width / 2) * k, (b.top - b0.top + b.height / 2) * k]; });
    };
    const press = (x, y, R, amt = 1) => {
      for (let i = 0; i < cells.length; i++) {
        const d = Math.hypot(pos[i][0] - x, pos[i][1] - y); if (d > R) continue;
        const v = (1 - d / R) * amt; if (v > P[i]) { P[i] = v; active.add(i); }
      }
      kick();
    };
    const ripples = [];
    const draw = () => {
      raf = 0;
      ripples.forEach((rp) => { rp.r += rp.v; for (let i = 0; i < cells.length; i++) { const d = Math.abs(Math.hypot(pos[i][0] - rp.x, pos[i][1] - rp.y) - rp.r); if (d < 26) { const v = (1 - d / 26) * rp.a; if (v > P[i]) { P[i] = v; active.add(i); } } } rp.a *= .975; });
      for (let k = ripples.length - 1; k >= 0; k--) if (ripples[k].a < .05) ripples.splice(k, 1);
      active.forEach((i) => {
        P[i] *= .955; const p = P[i], s = cells[i].style;
        if (p < .01) { P[i] = 0; active.delete(i); s.fontVariationSettings = ''; s.color = ''; return; }
        s.fontVariationSettings = `'wdth' ${(62 + 63 * p).toFixed(0)}, 'wght' ${(200 + 700 * p).toFixed(0)}`;
        s.color = p > .55 ? `rgba(214,255,61,${(.4 + p * .6).toFixed(2)})` : `rgba(244,241,232,${(.32 + p * 1.1).toFixed(2)})`;
      });
      if (live && (active.size || ripples.length)) kick();
    };
    const kick = () => { if (!raf && live) raf = requestAnimationFrame(draw); };
    const local = (e) => { const b = box.getBoundingClientRect(), k = box.offsetWidth / b.width; return [(e.clientX - b.left) * k, (e.clientY - b.top) * k]; };
    box.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' || REDUCE) return; const [x, y] = local(e); press(x, y, parseFloat(box.style.fontSize) * 2.6); });
    box.addEventListener('pointerdown', (e) => { const [x, y] = local(e); ripples.push({ x, y, r: 0, v: parseFloat(box.style.fontSize) * .45, a: 1 }); press(x, y, parseFloat(box.style.fontSize) * 1.6); });
    // Keyboard: a pressure point you steer with the arrows; Enter sends a ripple.
    let kx = 0, ky = 0;
    const moveCur = () => { cur.style.left = kx + 'px'; cur.style.top = ky + 'px'; };
    box.addEventListener('focus', () => { if (!kx) { const b = box.getBoundingClientRect(); kx = b.width / 2; ky = b.height / 2; } moveCur(); });
    box.addEventListener('keydown', (e) => {
      const fs = parseFloat(box.style.fontSize), step = fs * 1.1;
      const m = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (m) { e.preventDefault(); const b = box.getBoundingClientRect(); kx = clamp(kx + m[0], 0, b.width); ky = clamp(ky + m[1], 0, b.height); moveCur(); press(kx, ky, fs * 2.6); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ripples.push({ x: kx, y: ky, r: 0, v: fs * .45, a: 1 }); kick(); }
    });
    let built = false;
    return {
      on: () => { live = true; if (!built) { build(); built = true; } kick(); },
      off: () => { live = false; },
      resize: () => { if (built) build(); },
    };
  }

  /* 03 · Helix: the cards hang on a helix; the whole spiral turns and screws along its axis, so the card
     in front stays centred. Unwind lays them out flat as a wall; wind puts them back. */
  function Helix(box) {
    const spin = $('[data-helix-spin]', box), now = $('[data-helix-now]', box.closest('.ex')), btn = $('[data-unwind]', box.closest('.ex'));
    const A = '/other-side/assets/';
    const ITEMS = [
      ['h-ganko-home.webp', 'Ganko.sg', 'Homepage', '/work/ganko/'], ['h-luumens-hero.webp', 'Luumens', 'Homepage', '/work/luumens/'],
      ['h-voyagaer-hero.webp', 'Voyagaer', 'Homepage', '/work/voyagaer/'], ['h-industmarine-hero.webp', 'Industmarine', 'Homepage', '/work/industmarine/'],
      ['h-pixel-pull.webp', 'Pixel Pull', 'Concept', '/concepts/pixel-pull/'], ['h-little-rosti.webp', 'Little Rösti', 'Concept', '/concepts/little-rosti/'],
      ['h-ganko-dishes.webp', 'Ganko.sg', 'Signature dishes', '/work/ganko/'], ['h-luumens-pv.webp', 'Luumens', 'PV panel', '/work/luumens/'],
      ['h-voyagaer-product.webp', 'Voyagaer', 'Product page', '/work/voyagaer/'], ['h-industmarine-lifecycle.webp', 'Industmarine', 'Services', '/work/industmarine/'],
      ['h-common-table.webp', 'Common Table', 'Concept', '/concepts/common-table/'], ['h-crumb-and-kin.webp', 'Crumb & Kin', 'Concept', '/concepts/crumb-and-kin/'],
    ];
    const n = ITEMS.length, STEP = 30; // degrees between cards
    const cards = ITEMS.map(([f, t, s, href], i) => {
      const a = document.createElement('a');
      a.className = 'hx'; a.href = href; a.setAttribute('aria-label', `${t}, ${s}. Open`);
      a.innerHTML = `<img src="${A}${f}" alt="" width="480" height="300" loading="lazy" decoding="async">`;
      spin.append(a); return a;
    });
    let R = 300, CW = 260, rise = 40, theta = 0, vel = 0, target = null, wall = 0, live = false, raf = 0, last = 0, front = -1;
    const size = () => { const w = box.offsetWidth, h = box.offsetHeight; CW = clamp(Math.min(w * .36, h * .62), 150, 360); R = CW * 1.1; rise = CW * .2; box.style.setProperty('--cw', CW + 'px'); };
    // Every frame each card is placed by its angle relative to the front (wrapped to ±180°), so the helix
    // always stays centred on the card in front however far it has turned. Unwound, they form a wall.
    const wrap = (a) => ((a % 360) + 540) % 360 - 180;
    const place = () => {
      const cols = innerWidth < 900 ? 3 : 4, gap = CW * .1, rowsN = Math.ceil(n / cols), k = 1 - wall, ws = lerp(1, .7, wall);
      cards.forEach((c, i) => {
        const rel = wrap(i * STEP - theta);
        const col = i % cols, row = Math.floor(i / cols);
        const gx = (col - (cols - 1) / 2) * (CW * .72 + gap), gy = (row - (rowsN - 1) / 2) * (CW * .45 + gap);
        c.style.transform = `translate3d(${lerp(0, gx, wall).toFixed(1)}px, ${lerp(rel / STEP * rise, gy, wall).toFixed(1)}px, ${(-R * k).toFixed(1)}px) rotateY(${(rel * k).toFixed(2)}deg) translateZ(${(R * k).toFixed(1)}px) scale(${ws})`;
        c.style.setProperty('--shade', (k * clamp(Math.abs(rel) / 140, 0, .75)).toFixed(2));
        c.style.zIndex = String(200 - Math.round(Math.abs(rel)));
      });
    };
    const pose = place;
    const frame = (t) => {
      raf = 0; const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
      if (target !== null) { const d = target - theta; theta += d * Math.min(1, dt * 7); vel = 0; if (Math.abs(d) < .05) { theta = target; target = null; } }
      else if (!dragging) { vel *= Math.pow(.05, dt); theta += (vel + (REDUCE ? 0 : 6 * (1 - wall))) * dt; }
      place();
      const f = ((Math.round(theta / STEP) % n) + n) % n;
      if (f !== front) { front = f; const [, t2, s2, h2] = ITEMS[f]; now.innerHTML = `<b>${t2}</b>${s2} · <a href="${h2}">Open ↗</a>`; }
      if (live) raf = requestAnimationFrame(frame);
    };
    let dragging = false, px = 0, pt = 0, moved = 0;
    box.addEventListener('pointerdown', (e) => { if (e.button) return; dragging = true; moved = 0; px = e.clientX; pt = performance.now(); target = null; box.setPointerCapture(e.pointerId); });
    box.addEventListener('pointermove', (e) => {
      if (!dragging) return; const dx = e.clientX - px, now2 = performance.now(); moved += Math.abs(dx);
      theta -= dx * .25; vel = -dx * .25 / Math.max(.008, (now2 - pt) / 1000); px = e.clientX; pt = now2;
    });
    const up = () => { dragging = false; };
    box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
    box.addEventListener('click', (e) => {
      const c = e.target.closest('.hx'); if (!c) return;
      if (moved > 6) { e.preventDefault(); return; }
      const i = cards.indexOf(c);
      if (wall < .5 && i !== front) { e.preventDefault(); target = theta + ((((i * STEP - theta) % 360) + 540) % 360 - 180); }
    }, true);
    cards.forEach((c, i) => c.addEventListener('focus', () => { if (wall < .5) target = theta + ((((i * STEP - theta) % 360) + 540) % 360 - 180); }));
    btn.addEventListener('click', () => {
      const to = wall < .5 ? 1 : 0;
      btn.setAttribute('aria-pressed', to ? 'true' : 'false'); btn.textContent = to ? 'Wind' : 'Unwind';
      if (REDUCE || !window.gsap) { wall = to; pose(); return; }
      gsap.to({ v: wall }, { v: to, duration: 1.2, ease: 'expo.inOut', onUpdate() { wall = this.targets()[0].v; if (!live) pose(); } });
    });
    size(); pose();
    return {
      on: () => { if (live) return; live = true; last = 0; raf = requestAnimationFrame(frame); },
      off: () => { live = false; cancelAnimationFrame(raf); raf = 0; },
      resize: () => { size(); pose(); },
    };
  }

  /* 04 · Concepts pile: prints you can throw. Inertia and soft walls; double-click or Enter opens one. */
  function Pile(box) {
    const A = '/other-side/assets/';
    const ITEMS = [
      ['p-pixel-pull.webp', 'Pixel Pull', 'C1 · Card shop', '/concepts/pixel-pull/'],
      ['p-little-rosti.webp', 'Little Rösti', 'C2 · Café', '/concepts/little-rosti/'],
      ['p-common-table.webp', 'Common Table', 'C3 · Restaurant', '/concepts/common-table/'],
      ['p-crumb-and-kin.webp', 'Crumb & Kin', 'C4 · Bakery', '/concepts/crumb-and-kin/'],
    ];
    const sec = box.closest('.ex');
    let z = 10, PW = 300, BW = 0, BH = 0, live = false, raf = 0;
    const P = ITEMS.map(([f, t, s, href]) => {
      const el = document.createElement('figure');
      el.className = 'print'; el.tabIndex = 0; el.setAttribute('role', 'link');
      el.setAttribute('aria-label', `${t}, ${s}. Press Enter to open; arrow keys move it.`);
      el.innerHTML = `<img src="${A}${f}" alt="" width="760" height="475" loading="lazy" decoding="async"><figcaption><b>${t}</b><span>${s} · Open ↗</span></figcaption>`;
      box.append(el);
      return { el, href, x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, h: 0 };
    });
    const apply = (p) => { p.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotate(${p.r.toFixed(2)}deg)`; };
    const size = () => { const r = box.getBoundingClientRect(); BW = r.width; BH = r.height; PW = clamp(BW * .34, 170, 360); box.style.setProperty('--pw', PW + 'px'); P.forEach((p) => { p.h = p.el.offsetHeight || PW * .72; }); };
    const scatter = (anim) => {
      P.forEach((p, i) => {
        const to = { x: clamp((BW - PW) * (.08 + .28 * i + (Math.random() - .5) * .12), 0, BW - PW), y: clamp((BH - p.h) * (.15 + Math.random() * .6), 0, Math.max(0, BH - p.h)), r: (Math.random() - .5) * 22 };
        if (anim && window.gsap && !REDUCE) gsap.to(p, { ...to, duration: .9, ease: 'back.out(1.4)', delay: i * .05, onUpdate: () => apply(p) }); else { Object.assign(p, to); apply(p); }
      });
    };
    const tidy = () => {
      const cols = BW < 560 ? 2 : 4, gx = (BW - cols * PW) / (cols + 1);
      P.forEach((p, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const to = { x: gx + col * (PW + gx), y: cols === 4 ? (BH - p.h) / 2 : 20 + row * (p.h + 20), r: 0 };
        if (window.gsap && !REDUCE) gsap.to(p, { ...to, duration: .8, ease: 'expo.out', delay: i * .04, onUpdate: () => apply(p) }); else { Object.assign(p, to); apply(p); }
      });
    };
    $('[data-shuffle]', sec).addEventListener('click', () => scatter(true));
    $('[data-tidy]', sec).addEventListener('click', tidy);
    // Throw physics: one rAF loop while anything is still moving.
    const step = () => {
      raf = 0; let moving = false;
      P.forEach((p) => {
        if (p.held) return;
        if (Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.vr) < .05) return;
        moving = true;
        p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= .93; p.vy *= .93; p.vr *= .9;
        if (p.x < 0) { p.x = 0; p.vx *= -.5; } if (p.x > BW - PW) { p.x = BW - PW; p.vx *= -.5; }
        if (p.y < 0) { p.y = 0; p.vy *= -.5; } if (p.y > BH - p.h) { p.y = Math.max(0, BH - p.h); p.vy *= -.5; }
        apply(p);
      });
      if (moving && live) raf = requestAnimationFrame(step);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    P.forEach((p) => {
      let last = null;
      p.el.addEventListener('pointerdown', (e) => {
        if (e.button) return;
        window.gsap?.killTweensOf(p);
        p.held = true; p.el.style.zIndex = ++z; p.el.setPointerCapture(e.pointerId);
        last = { x: e.clientX, y: e.clientY, t: performance.now(), ox: e.clientX - p.x, oy: e.clientY - p.y };
        p.vx = p.vy = 0;
      });
      p.el.addEventListener('pointermove', (e) => {
        if (!p.held || !last) return;
        const t = performance.now(), dt = Math.max(8, t - last.t);
        const nx = clamp(e.clientX - last.ox, -PW * .3, BW - PW * .7), ny = clamp(e.clientY - last.oy, -p.h * .3, BH - p.h * .7);
        p.vx = (nx - p.x) / dt * 16; p.vy = (ny - p.y) / dt * 16; p.vr = p.vx * .08;
        p.x = nx; p.y = ny; p.r = lerp(p.r, clamp(p.vx * .6, -18, 18), .2); apply(p);
        last.t = t;
      });
      const up = () => { if (!p.held) return; p.held = false; if (REDUCE) { p.vx = p.vy = p.vr = 0; } kick(); };
      p.el.addEventListener('pointerup', up); p.el.addEventListener('pointercancel', up);
      p.el.addEventListener('dblclick', () => { location.href = p.href; });
      p.el.addEventListener('keydown', (e) => {
        const m = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[e.key];
        if (m) { e.preventDefault(); p.x = clamp(p.x + m[0], 0, BW - PW); p.y = clamp(p.y + m[1], 0, Math.max(0, BH - p.h)); p.el.style.zIndex = ++z; apply(p); }
        else if (e.key === 'Enter') location.href = p.href;
      });
    });
    let first = true;
    return {
      on: () => { live = true; if (first) { first = false; size(); scatter(true); } },
      off: () => { live = false; },
      resize: () => { size(); if (!first) tidy(); },
    };
  }
})();
