/* The Other Side: routing between the selector and three worlds, the transitions, and each world's behaviour.
   Plain JavaScript and the Web Animations API; no dependencies. Routes are hashes: #fable, #neon, #hollow,
   and #select (or none) for the selector. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const WORLDS = ['fable', 'neon', 'hollow'];
  const NAMES = { select: 'The Other Side', fable: 'The Fable', neon: 'Neon District', hollow: 'The Hollow' };
  const COLOR = { fable: '#3B45DE', neon: '#080B12', hollow: '#090A12' };
  const EASE = 'cubic-bezier(.76,0,.24,1)', OUT = 'cubic-bezier(.16,1,.3,1)';
  const body = document.body, sel = $('#select'), tx = $('.tx'), live = $('[data-live]'), viewer = $('.viewer');
  const roots = { select: sel, fable: $('#fable'), neon: $('#neon'), hollow: $('#hollow') };
  let view = 'select', busy = false, lastRect = null, quiet = false;
  const seen = new Set();
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const routeOf = () => { const h = location.hash.slice(1); return WORLDS.includes(h) ? h : 'select'; };
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const centre = () => { const s = Math.min(innerWidth, innerHeight) * .2; return { x: innerWidth / 2 - s / 2, y: innerHeight / 2 - s / 2, w: s, h: s }; };
  const inset = (r) => `inset(${r.y}px ${innerWidth - r.x - r.w}px ${innerHeight - r.y - r.h}px ${r.x}px)`;
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  $$('main.world h1').forEach((h) => h.setAttribute('tabindex', '-1'));

  function show(name) {
    Object.entries(roots).forEach(([k, el]) => { el.hidden = k !== name; });
    body.dataset.view = name; view = name;
    // every world opens at its start
    scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (name !== 'select') $('h1', roots[name]).focus({ preventScroll: true }); else $('#sel-title').focus({ preventScroll: true });
    live.textContent = name === 'select' ? 'The Other Side, choose a world' : NAMES[name];
    document.title = name === 'select' ? 'The Other Side · Noah Zaw Min Htut' : NAMES[name] + ' · The Other Side';
    if (name === 'select') { delete sel.dataset.hover; delete sel.dataset.chosen; $$('.door').forEach((x) => x.classList.remove('is-hot')); requestAnimationFrame(horizon); }
    worldOn(name);
  }

  /* ---------- Transitions: each about a second; the name card only on a world's first visit ---------- */
  // The Fable: the door grows into the sky, then lifts like a curtain.
  async function enterFable(from, arrived) {
    const sq = document.createElement('div'); tx.append(sq);
    Object.assign(sq.style, { left: from.x + 'px', top: from.y + 'px', width: from.w + 'px', height: from.h + 'px', background: '#3B45DE' });
    const k = Math.hypot(innerWidth, innerHeight) / Math.min(from.w, from.h) * 1.1;
    const cx = innerWidth / 2 - (from.x + from.w / 2), cy = innerHeight / 2 - (from.y + from.h / 2);
    await sq.animate([{ transform: 'none' }, { transform: `translate(${cx}px,${cy}px) scale(${k})` }], { duration: 560, easing: EASE, fill: 'forwards' }).finished;
    await arrived; show('fable');
    await sq.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 440, easing: EASE, fill: 'forwards' }).finished;
  }
  // Neon District: modules tile the screen outward from the door, then retract row by row as the towers rise.
  async function enterNeon(from, arrived) {
    const cols = innerWidth < 700 ? 6 : 12, rows = Math.ceil(cols * innerHeight / innerWidth), w = innerWidth / cols, h = innerHeight / rows;
    const ox = from.x + from.w / 2, oy = from.y + from.h / 2, tiles = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const t = document.createElement('div');
      Object.assign(t.style, { left: c * w + 'px', top: r * h + 'px', width: Math.ceil(w) + 1 + 'px', height: Math.ceil(h) + 1 + 'px', background: '#080B12', boxShadow: 'inset 0 0 0 1px rgba(40,89,255,.35)' });
      t.dataset.d = Math.hypot(c * w + w / 2 - ox, r * h + h / 2 - oy); t.dataset.r = r; tx.append(t); tiles.push(t);
    }
    const max = Math.max(...tiles.map((t) => +t.dataset.d));
    roots.neon.classList.add('is-entering');
    await Promise.all(tiles.map((t) => t.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 260, delay: t.dataset.d / max * 300, easing: OUT, fill: 'both' }).finished));
    await arrived; show('neon');
    await Promise.all(tiles.map((t) => t.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 300, delay: t.dataset.r * 28, easing: EASE, fill: 'forwards' }).finished));
    roots.neon.classList.remove('is-entering');
  }
  // The Hollow: the dark grows out of the door, then the old reality drifts apart in four pieces.
  async function enterHollow(from, arrived) {
    const bg = 'radial-gradient(70% 60% at 60% 40%, #55283A, #20264B 55%, #090A12)';
    const hole = document.createElement('div'); tx.append(hole);
    Object.assign(hole.style, { inset: 0, background: bg });
    await hole.animate([{ clipPath: inset(from) }, { clipPath: 'inset(0 0 0 0)' }], { duration: 480, easing: EASE, fill: 'forwards' }).finished;
    await arrived; show('hollow'); hole.remove();
    const shards = [[0, 0, 55, 0, 40, 46, 0, 60], [55, 0, 100, 0, 100, 40, 62, 52, 40, 46], [0, 60, 40, 46, 62, 52, 48, 100, 0, 100], [62, 52, 100, 40, 100, 100, 48, 100]];
    await Promise.all(shards.map((p, i) => {
      const s = document.createElement('div'); tx.append(s);
      Object.assign(s.style, { inset: 0, background: bg, clipPath: 'polygon(' + p.reduce((a, v, j) => a + (j % 2 ? ` ${v}%` + (j < p.length - 1 ? ',' : '') : `${v}%`), '') + ')' });
      const dx = [-1, 1, -1, 1][i] * 50, dy = [-1, -1, 1, 1][i] * 40;
      return s.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px)`, opacity: 0 }], { duration: 560, delay: i * 40, easing: OUT, fill: 'forwards' }).finished;
    }));
  }
  // Back to the selector: the world folds into its own door.
  async function toSelect(from) {
    const cover = document.createElement('div'); tx.append(cover);
    Object.assign(cover.style, { inset: 0, background: COLOR[from] });
    show('select');
    const r = rectOf($(`.door--${from} .door__sq`));
    await cover.animate([{ clipPath: 'inset(0 0 0 0)', opacity: 1 }, { clipPath: inset(r), opacity: 1, offset: .85 }, { clipPath: inset(r), opacity: 0 }], { duration: 620, easing: EASE, fill: 'forwards' }).finished;
  }

  // The name card: the destination's name in its own type. From another world it starts in the departing
  // world's type and hands over letter by letter. Shown on a world's first visit only.
  function caption(to, from) {
    if (seen.has(to)) return { arrived: Promise.resolve(), done: Promise.resolve() };
    seen.add(to);
    const cap = document.createElement('div'); cap.className = 'txcap'; cap.dataset.to = to;
    const name = NAMES[to], letters = (v) => `<span data-v="${v}">${[...name].map((c) => `<span class="c">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</span>`;
    const src = WORLDS.includes(from) ? from : null;
    cap.innerHTML = `<p class="txcap__from">${src ? 'Leaving ' + NAMES[src] : 'Entering'}</p><p class="txcap__word">${src ? letters(src) : ''}${letters(to)}</p>`;
    tx.append(cap);
    cap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: src ? 0 : 300, fill: 'backwards' });
    const all = [], out = src ? $$(`[data-v="${src}"] .c`, cap) : [], inn = $$(`[data-v="${to}"] .c`, cap);
    out.forEach((c, i) => all.push(c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, delay: 120 + i * 14, easing: OUT, fill: 'both' }).finished));
    const IN = {
      fable: [{ opacity: 0, fontVariationSettings: "'wdth' 110, 'wght' 900" }, { opacity: 1, fontVariationSettings: "'wdth' 62, 'wght' 900" }],
      neon: [{ clipPath: 'inset(100% 0 -10% 0)' }, { clipPath: 'inset(0 0 -10% 0)' }],
      hollow: [{ opacity: 0 }, { opacity: 1 }],
    }[to];
    inn.forEach((c, i) => all.push(c.animate(IN, { duration: 380, delay: (src ? 200 : 340) + i * 16, easing: OUT, fill: 'both' }).finished));
    const arrived = Promise.all(all).then(() => wait(90));
    return { arrived, done: arrived.then(() => cap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).finished) };
  }

  async function go(to) {
    if (to === view || busy) return;
    busy = true;
    const from = view, origin = lastRect || (from === 'select' ? rectOf($(`.door--${to} .door__sq`)) : centre());
    lastRect = null;
    if (viewer.open) viewer.close();
    try {
      if (from === 'select' && to !== 'select') { sel.dataset.hover = to; $$('.door').forEach((x) => x.classList.toggle('is-hot', x.dataset.world === to)); }
      if (REDUCE) show(to);
      else if (to === 'select') await toSelect(from);
      else { const cap = caption(to, from); await Promise.all([({ fable: enterFable, neon: enterNeon, hollow: enterHollow })[to](origin, cap.arrived), cap.done]); }
    } catch (err) { show(to); } finally {
      busy = false; tx.replaceChildren();
      if (view === 'select' && WORLDS.includes(from)) { quiet = true; $(`.door--${from}`).focus({ preventScroll: true }); quiet = false; }
      if (routeOf() !== view) go(routeOf());
    }
  }
  addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const h = a.getAttribute('href').slice(1);
    if (a.hasAttribute('data-scroll')) {
      e.preventDefault(); const t = document.getElementById(h); if (!t) return;
      t.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' });
      const f = t.matches('h1,h2,h3,[tabindex]') ? t : $('h1,h2,h3', t); if (f) { if (!f.hasAttribute('tabindex')) f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); }
      return;
    }
    if (WORLDS.includes(h) || h === 'select') lastRect = rectOf(a.querySelector('.door__sq, .fx__sq') || a);
  });
  addEventListener('hashchange', () => go(routeOf()));
  addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (view === 'select' && ['1', '2', '3'].includes(e.key)) location.hash = WORLDS[+e.key - 1];
    if (view !== 'select' && e.key === 'Escape' && !viewer.open) location.hash = 'select';
    else if (view === 'select' && e.key === 'Escape' && !busy) backHome();
  });

  /* ---------- The title morph (selector) and the Hand-over study (Hollow) ----------
     Three letter layers share one cell; Neon's and the Hollow's are sized so each line is as wide as the
     Archivo line, so letters can hand over in place. CSS (selector.css) does the hand-over. */
  function buildMorph(tt) {
    const lines = tt.dataset.lines.split('|');
    ['base', 'neon', 'hollow'].forEach((layer) => {
      const l = document.createElement('span'); l.className = 'tt__l tt--' + layer; let n = 0;
      lines.forEach((line, li) => {
        const ln = document.createElement('span'); ln.className = 'ln';
        [...line].forEach((c) => { const s = document.createElement('span'); s.className = 'tl'; s.textContent = c === ' ' ? ' ' : c; s.style.setProperty('--i', n++); ln.append(s); });
        if (li === lines.length - 1) { const d = document.createElement('i'); d.className = 'sel__dot'; ln.append(d); }
        l.append(ln);
      });
      tt.append(l);
    });
    const fit = () => ['neon', 'hollow'].forEach((k) => {
      const L = $('.tt--' + k, tt), widest = (el) => Math.max(...$$('.ln', el).map((x) => x.scrollWidth - parseFloat(getComputedStyle(x).paddingLeft)));
      if (!$('.tt--base', tt).offsetWidth) return;
      L.style.setProperty('--fs', '1em'); L.style.setProperty('--fs', (widest($('.tt--base', tt)) / widest(L)).toFixed(3) + 'em');
    });
    fit(); addEventListener('resize', fit); document.fonts?.ready.then(fit);
    return fit;
  }
  const fits = $$('.tt').map(buildMorph);

  // Selector doors: hover (after a short dwell, so sweeping across doesn't flash the page) or focus re-voices the title.
  const sub = $('[data-sel-sub]'), subDefault = sub.textContent;
  let dwell = 0;
  $$('.door').forEach((d) => {
    const on = () => { if (quiet || busy) return; sel.dataset.hover = d.dataset.world; $$('.door').forEach((x) => x.classList.toggle('is-hot', x === d)); sub.textContent = d.dataset.sub; };
    const off = () => { clearTimeout(dwell); if (busy) return; delete sel.dataset.hover; $$('.door').forEach((x) => x.classList.remove('is-hot')); sub.textContent = subDefault; };
    d.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; clearTimeout(dwell); dwell = setTimeout(on, 140); });
    d.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') off(); });
    d.addEventListener('focus', on); d.addEventListener('blur', off);
  });

  // The horizon runs from the title's full stop to the edge; the doors stand on it. Measured at rest only.
  const dot = $('.sel .tt--base .sel__dot'), worldsEl = $('.sel__worlds');
  function horizon() {
    if (view !== 'select' || sel.dataset.hover || innerWidth < 1024) { if (innerWidth < 1024) worldsEl.style.removeProperty('--dy'); return; }
    worldsEl.style.setProperty('--dy', '0px');
    const s = sel.getBoundingClientRect(), d = dot.getBoundingClientRect(), w = worldsEl.getBoundingClientRect();
    sel.style.setProperty('--hx', d.right - s.left + 14 + 'px'); sel.style.setProperty('--hy', d.bottom - s.top + 'px');
    worldsEl.style.setProperty('--dy', d.bottom - w.bottom + 'px');
  }
  addEventListener('resize', horizon); document.fonts?.ready.then(horizon);

  /* ---------- Reveal on scroll ---------- */
  const io = 'IntersectionObserver' in window && !REDUCE ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' }) : null;
  if (io) $$('[data-reveal]').forEach((el) => { el.classList.add('pre'); io.observe(el); });

  /* ---------- The Fable ---------- */
  // Letters of the hero title lean wider toward the pointer.
  const ftitle = $('[data-warp]'), fchars = [];
  $$('.fw', ftitle).forEach((w) => {
    if (w.querySelector('em')) return;
    const txt = w.textContent.trim(); w.textContent = '';
    [...txt].forEach((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c; s.setAttribute('aria-hidden', 'true'); w.append(s); fchars.push(s); });
    const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = txt; w.append(sr);
  });
  let fc = [], fq = 0, fx = -1e4, fy = -1e4;
  const fmeasure = () => { fc = fchars.map((c) => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2 + scrollY]; }); };
  const fwarp = () => { fq = 0; fchars.forEach((c, i) => { const d = Math.hypot(fx - fc[i][0], fy - fc[i][1]); c.style.setProperty('--w', (62 + 40 * Math.max(0, 1 - d / 240)).toFixed(0)); }); };
  const doors = $('[data-doors]'); let dq = 0;
  if (FINE && !REDUCE) ftitle.closest('.fhero').addEventListener('pointermove', (e) => {
    fx = e.clientX; fy = e.clientY + scrollY; if (!fq) fq = requestAnimationFrame(fwarp);
    // looking through the doorways: the views inside shift against the pointer
    if (!dq) dq = requestAnimationFrame(() => { dq = 0; doors.style.setProperty('--px', (e.clientX / innerWidth - .5) * 2); doors.style.setProperty('--py', (e.clientY / innerHeight - .5) * 2); });
  });

  // Common Table: on wide screens the homepage scrolls behind the window as the section passes.
  const ct = $('.pj--table'), ctView = $('.ct__view', ct), ctImg = $('img', ctView);
  const scrubOn = () => !REDUCE && innerWidth > 900;
  let cq = 0;
  const scrub = () => {
    cq = 0; if (view !== 'fable' || !scrubOn()) { ctImg.style.transform = ''; return; }
    const r = ct.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    ctImg.style.transform = `translateY(${-p * Math.max(0, ctImg.offsetHeight - ctView.clientHeight)}px)`;
  };
  addEventListener('scroll', () => { if (!cq) cq = requestAnimationFrame(scrub); }, { passive: true });
  addEventListener('resize', scrub);

  /* ---------- Neon District: Pixel Pull floors as tabs ---------- */
  const HOVER = matchMedia('(hover: hover) and (pointer: fine)');
  const px = $('.nbldg'), tabs = $$('.npx__floors [role="tab"]'), pview = $('#px-view'), pimg = $('img', pview), pnote = $('q', pview);
  let chosen = 'hero';
  const pick = (t, focus) => {
    chosen = t.dataset.s;
    tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
    px.dataset.on = t.dataset.s; pview.setAttribute('aria-labelledby', t.id);
    pimg.src = t.dataset.src; pimg.alt = t.dataset.alt; pimg.height = t.dataset.h; pnote.textContent = t.dataset.note;
    if (!REDUCE) { pview.classList.remove('is-swap'); void pview.offsetWidth; pview.classList.add('is-swap'); }
    if (focus) t.focus();
  };
  // The building: a floor lights up under the pointer (desktop) or as you scroll past it (touch).
  // Clicking or tapping a floor, or its tag, opens that floor at street level below.
  const light = (s) => { px.dataset.on = s; };
  const openFloor = (s) => {
    const t = tabs.find((x) => x.dataset.s === s); pick(t);
    $('#neon-pixel').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' }); t.focus({ preventScroll: true });
  };
  $$('[data-floor]').forEach((b) => {
    b.addEventListener('click', () => openFloor(b.dataset.floor));
    b.addEventListener('pointerenter', () => { if (HOVER.matches) light(b.dataset.floor); });
    b.addEventListener('focus', () => light(b.dataset.floor));
    b.addEventListener('blur', () => { if (!px.matches(':hover')) light(chosen); });
  });
  $$('.px__slab', px).forEach((sl) => {
    sl.addEventListener('pointerenter', () => { if (HOVER.matches) light(sl.dataset.s); });
    sl.addEventListener('click', () => openFloor(sl.dataset.s));
  });
  px.addEventListener('pointerleave', () => { if (HOVER.matches) light(chosen); });
  // touch: the floors light top to bottom as the building moves up the screen
  const FLOORS = ['hero', 'cats', 'prod', 'camp'];
  let flq = 0;
  const floorScroll = () => {
    flq = 0;
    if (HOVER.matches || view !== 'neon') return;
    const r = px.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = (innerHeight * .55 - r.top) / (innerHeight * .25 + r.height); // top at 55% of the screen → bottom at 30%
    light(FLOORS[Math.max(0, Math.min(3, Math.floor(p * 4)))]);
  };
  addEventListener('scroll', () => { if (!flq) flq = requestAnimationFrame(floorScroll); }, { passive: true });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (k) { e.preventDefault(); pick(tabs[(i + k + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); pick(tabs[0], true); } if (e.key === 'End') { e.preventDefault(); pick(tabs[tabs.length - 1], true); }
    });
  });

  /* ---------- The Hollow ---------- */
  const hh = roots.hollow, lens = $('[data-lens]');
  let lq = 0, lx = 0, ly = 0, lastRupture = 0;
  if (FINE && !REDUCE) lens.addEventListener('pointermove', (e) => {
    const r = lens.getBoundingClientRect(); lx = e.clientX - r.left; ly = e.clientY - r.top;
    if (!lq) lq = requestAnimationFrame(() => { lq = 0; lens.style.setProperty('--mx', lx + 'px'); lens.style.setProperty('--my', ly + 'px'); });
  });
  const unsettle = (v) => { if (hh.dataset.state !== 'rupture') hh.dataset.state = v ? 'unstable' : 'stable'; };
  $$('.hhole, .hhero__title', hh).forEach((el) => { el.addEventListener('pointerenter', () => unsettle(true)); el.addEventListener('pointerleave', () => unsettle(false)); });
  function rupture() {
    if (REDUCE) return;
    const now = performance.now(); if (now - lastRupture < 8000) return; lastRupture = now;
    const layer = $('.hrupture', hh); layer.replaceChildren();
    for (let i = 0; i < 6; i++) { const s = document.createElement('i'); s.style.top = Math.random() * 92 + '%'; s.style.height = 1 + Math.random() * 5 + '%'; s.style.transform = `translateX(${(Math.random() - .5) * 30}%)`; layer.append(s); }
    hh.dataset.state = 'rupture';
    setTimeout(() => { hh.dataset.state = 'stable'; layer.replaceChildren(); }, 480);
  }
  // Study 1: pick a voice; the CSS hand-over does the rest.
  const stStage = $('.hst__stage--type');
  $$('[data-voice-btn]').forEach((b, i, all) => b.addEventListener('click', () => {
    all.forEach((x) => x.setAttribute('aria-pressed', x === b));
    if (b.dataset.voiceBtn === 'base') delete stStage.dataset.voice; else stStage.dataset.voice = b.dataset.voiceBtn;
    $('[data-face]').textContent = { base: 'Archivo · condensed, weight 800', fable: 'Archivo · condensed, weight 900', neon: 'Space Grotesk · weight 500', hollow: 'Cormorant Garamond · weight 300' }[b.dataset.voiceBtn];
  }));
  // Study 2: the light follows a pointer or a finger; arrow keys move it too.
  const st2 = $('[data-light]'); let L = { x: 30, y: 45 };
  const setL = () => { st2.style.setProperty('--lx', L.x + '%'); st2.style.setProperty('--ly', L.y + '%'); };
  const fromEvent = (e) => { const r = st2.getBoundingClientRect(); L = { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 }; setL(); };
  st2.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) fromEvent(e); });
  st2.addEventListener('pointerdown', (e) => { st2.setPointerCapture(e.pointerId); fromEvent(e); });
  // the first time the plate comes into view, the light drifts once across it to show what it does
  if (!REDUCE && 'IntersectionObserver' in window) new IntersectionObserver((es, o) => es.forEach((e) => {
    if (!e.isIntersecting) return; o.disconnect(); const t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / 2200); L = { x: 18 + p * 50, y: 45 + Math.sin(p * Math.PI) * 8 }; setL(); if (p < 1 && !st2.matches(':hover, :focus')) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .6 }).observe(st2);
  st2.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[e.key]; if (!d) return;
    e.preventDefault(); L = { x: Math.min(100, Math.max(0, L.x + d[0])), y: Math.min(100, Math.max(0, L.y + d[1])) }; setL();
  });

  /* ---------- The viewer: a full homepage, desktop or phone ---------- */
  let opener = null, vdata = null;
  const vimg = $('.viewer__scroll img'), vscroll = $('.viewer__scroll');
  const vset = (m) => {
    viewer.dataset.vw = m; $$('[data-vw]', viewer).forEach((b) => b.setAttribute('aria-pressed', b.dataset.vw === m));
    const d = vdata.dataset; vimg.src = m === 'd' ? d.d : d.m; vimg.width = m === 'd' ? d.dw : d.mw; vimg.height = m === 'd' ? d.dh : d.mh;
    vimg.alt = `The full ${d.title} homepage on ${m === 'd' ? 'desktop' : 'a phone'}, from top to bottom`; vscroll.scrollTop = 0;
  };
  $$('[data-viewer]').forEach((b) => b.addEventListener('click', () => {
    opener = b; vdata = b; $('.viewer__title', viewer).textContent = b.dataset.title; vset('d');
    viewer.showModal(); vscroll.focus();
    if (!REDUCE) viewer.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: OUT });
  }));
  $$('[data-vw]', viewer).forEach((b) => b.addEventListener('click', () => vset(b.dataset.vw)));
  $('[data-close]', viewer).addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => opener?.focus());

  // Build notes: readings taken from this browser, now. Nothing here is a stored number.
  function readouts() {
    const r = (k, v) => { const el = $(`[data-readout="${k}"]`); if (el) el.textContent = v; };
    r('route', `you are at ${location.hash || '#select'}; ${history.length} ${history.length === 1 ? 'entry' : 'entries'} in this tab's history`);
    r('files', `${document.querySelectorAll('script[src]').length} script file, ${document.styleSheets.length} stylesheets, 0 libraries`);
    const fams = new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')));
    r('fonts', `${fams.size} of 4 typefaces loaded so far: ${[...fams].join(', ') || 'none yet'}`);
    const imgs = performance.getEntriesByType('resource').filter((e) => /other-side\/assets\//.test(e.name));
    const kb = Math.round(imgs.reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0) / 1024);
    r('images', `${imgs.length} of 21 screens downloaded this visit${kb ? ` (${kb} KB)` : ''}`);
    r('motion', `reduced motion is ${REDUCE ? 'on' : 'off'} on this device`);
  }
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && readouts()), { threshold: .2 }).observe($('.nbuild'));

  /* ---------- World on: only the visible world runs anything ---------- */
  function worldOn(name) {
    if (name === 'fable') requestAnimationFrame(() => { fmeasure(); scrub(); });
    if (name === 'hollow' && !REDUCE) setTimeout(rupture, 60);
    if (name === 'hollow') fits.forEach((f) => f());
    if (name === 'neon') readouts();
  }
  addEventListener('resize', () => { if (view === 'fable') fmeasure(); });
  document.fonts?.ready.then(() => { if (view === 'fable') fmeasure(); });

  // Back to the portfolio: store the back button's square so the homepage can fly it into its full stop.
  const backBtn = $('[data-back]');
  function backHome(e) {
    if (e) e.preventDefault();
    const r = backBtn.getBoundingClientRect();
    try { sessionStorage.setItem('os-return', JSON.stringify({ x: r.left, y: r.top, w: r.height, h: r.height })); } catch (err) {}
    location.href = '/';
  }
  backBtn.addEventListener('click', backHome);
  // Going home, the homepage draws its own return, so the browser's cross-document morph is skipped.
  addEventListener('pageswap', (e) => { const v = e.viewTransition; if (v) { v.ready.catch(() => {}); v.finished.catch(() => {}); v.skipTransition(); } });

  show(routeOf());
})();
