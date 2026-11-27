/* The period as a portal: any a.dotp is a heading's full stop that leads somewhere (see the end of css/base.css).
   This adds the bleed layers and the shared ink filter once, and on click floods the screen with the colour before
   following the link. Links with data-pf-open (the project form) bloom and open the form without leaving. */
(() => {
  const dots = [...document.querySelectorAll('a.dotp')];
  if (!dots.length) return;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LABEL = 'To the other side';
  const WORLDS = ['base', 'fable', 'neon', 'hollow'];
  const GLYPHS = '▚▞░▒▓/\\_#%<>01';

  /* GSAP MorphSVG: with the plugin loaded, the mark is one SVG path that morphs between the worlds' shapes
     (the portfolio's square → the Fable's diamond → Neon's pixel on its tile → the Hollow's torn shard),
     with each world's details fading in around it. Without it, the CSS marks in css/base.css take over. */
  const MORPH = !REDUCE && window.gsap && window.MorphSVGPlugin;
  if (MORPH) gsap.registerPlugin(MorphSVGPlugin);
  const SHAPE = {
    base: 'M0 0H10V10H0Z',
    fable: 'M5 .6L9.4 5L5 9.4L.6 5Z',
    neon: 'M2.9 2.9H7.1V7.1H2.9Z',
    hollow: 'M-.6 -.6H5.9L6.7 1.4L8.2 .2L10.6 2.4V10.6H-.6Z',
  };
  const FILL = { fable: '#C4E44A', neon: '#B6F34A', hollow: '#2A2148' };
  const PARTS = { fable: ['.m-bar'], neon: ['.m-tile', '.m-scan'], hollow: ['.m-seam'], base: [] };
  const SVG_MARK = '<svg class="dotp__svg" viewBox="0 0 10 10" overflow="visible" aria-hidden="true" focusable="false">'
    + '<rect class="m-tile" x="0" y="0" width="10" height="10" fill="#080B12" stroke="#22336B" stroke-width=".5" opacity="0"/>'
    + '<rect class="m-bar" x="-2.6" y="1.8" width=".9" height="6.4" fill="#3B45DE" opacity="0"/>'
    + '<path class="m-shape" d="' + 'M0 0H10V10H0Z' + '" fill="currentColor"/>'
    + '<line class="m-scan" x1="0" x2="10" y1="3" y2="3" stroke="#12C9D9" stroke-width=".35" opacity="0"/>'
    + '<line class="m-seam" x1="1" y1="8.4" x2="9.2" y2="2.4" stroke="#C0463B" stroke-width=".6" opacity="0"/></svg>';
  const morph = (d, w) => {
    const g = d.querySelector('.dotp__svg'); if (!g) return;
    const shape = g.querySelector('.m-shape');
    gsap.killTweensOf(shape);
    gsap.to(shape, { morphSVG: SHAPE[w], duration: .55, ease: 'expo.inOut' });
    if (w === 'base') gsap.to(shape, { fill: getComputedStyle(d).color, duration: .4, onComplete: () => shape.setAttribute('fill', 'currentColor') });
    else gsap.to(shape, { fill: FILL[w], duration: .4 });
    const on = PARTS[w];
    g.querySelectorAll('.m-tile, .m-bar, .m-scan, .m-seam').forEach((el) => {
      const show = on.some((q) => el.matches(q));
      gsap.killTweensOf(el, 'opacity');
      gsap.to(el, { opacity: show ? (el.matches('.m-scan') ? .9 : 1) : 0, duration: show ? .35 : .2, delay: show ? .2 : 0 });
    });
    g._scan?.kill();
    if (w === 'neon') g._scan = gsap.fromTo(g.querySelector('.m-scan'), { attr: { y1: 2.6, y2: 2.6 } }, { attr: { y1: 7.4, y2: 7.4 }, duration: 1, ease: 'steps(6)', repeat: -1, yoyo: true });
  };

  // One filter for every bloom: fractal noise displaces the edge so it frays like ink in paper fibres.
  // Units are the element's own box, so the frayed edge looks the same at any heading size.
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML = '<filter id="dotp-ink" x="-25%" y="-25%" width="150%" height="150%" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">'
    + '<feTurbulence type="fractalNoise" baseFrequency="3.2" numOctaves="3" seed="7" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale=".22" xChannelSelector="R" yChannelSelector="G" result="d"/>'
    + '<feGaussianBlur in="d" stdDeviation=".004"/></filter>'
    // the tide-line: a thinner, more broken edge, so it reads as a stain margin and never as a ripple ring
    + '<filter id="dotp-tide" x="-25%" y="-25%" width="150%" height="150%" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">'
    + '<feTurbulence type="fractalNoise" baseFrequency="7" numOctaves="3" seed="2" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale=".14" xChannelSelector="G" yChannelSelector="R"/></filter>';
  document.body.append(svg);

  dots.forEach((d) => {
    if (!d.querySelector('.dotp__sq')) d.insertAdjacentHTML('afterbegin', '<span class="dotp__sq" aria-hidden="true"></span>');
    d.querySelector('.dotp__sq').insertAdjacentHTML('beforeend', MORPH ? SVG_MARK : '<i class="dotp__f"></i><i class="dotp__x"></i>');
    if (MORPH) d.classList.add('is-svg');
    d.insertAdjacentHTML('beforeend', `<span class="dotp__label" aria-hidden="true">${[...LABEL].map((c) => c === ' ' ? '<b class="s">\u00a0</b>' : `<b>${c}</b>`).join('')}</span>`);
    // Ink bleed on hover is switched off for now (styles kept in css/base.css as .dotp__bleed).
    d.addEventListener('click', (e) => {
      if (REDUCE || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
      const sq = d.querySelector('.dotp__sq').getBoundingClientRect(), cx = sq.left + sq.width / 2, cy = sq.top + sq.height / 2;
      const s = 60, k = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) * 2.6 / s;
      const b = document.createElement('div'); b.className = 'dotp-burst';
      b.style.cssText = `left:${cx - s / 2}px;top:${cy - s / 2}px;width:${s}px;height:${s}px;--bleed:${getComputedStyle(d).getPropertyValue('--bleed')}`;
      document.body.append(b);
      const form = d.hasAttribute('data-pf-open');
      if (form) { // bloom through the screen while the form opens, then let it go
        b.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: `scale(${k * .8})`, opacity: .85, offset: .55 }, { transform: `scale(${k})`, opacity: 0 }], { duration: 640, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished.then(() => b.remove());
        setTimeout(() => b.remove(), 1000); return;
      }
      b.animate([{ transform: 'scale(.2)' }, { transform: `scale(${k})` }], { duration: 460, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
      e.preventDefault();
      const go = () => { location.href = d.href; };
      setTimeout(go, 340); // leave as the colour reaches the edges; the page keeps the flood until the next one paints
      setTimeout(() => b.remove(), 2500);
    });
  });
  /* ---------- The cycle: each period flicks through the worlds of The Other Side ----------
     Resting: a slow pass (the portfolio's square holds longest). Hovered or focused: faster, and the label
     scrambles and re-forms in each world's voice. Only periods on screen run; reduced motion keeps the square. */
  const state = new Map();
  const setWorld = (d, w) => {
    if (d.dataset.w === w) return;
    d.dataset.w = w;
    if (REDUCE) return;
    if (MORPH) morph(d, w);
    d.classList.remove('is-glitch'); void d.offsetWidth; d.classList.add('is-glitch');
    clearTimeout(state.get(d).g); state.get(d).g = setTimeout(() => d.classList.remove('is-glitch'), 240);
    if (d.matches(':hover, :focus-visible') || d.classList.contains('is-tell')) scramble(d);
  };
  const scramble = (d) => {
    if (REDUCE) return;
    const st = state.get(d), bs = [...d.querySelectorAll('.dotp__label b:not(.s)')], text = LABEL.replace(/ /g, '');
    cancelAnimationFrame(st.raf);
    const t0 = performance.now(), dur = 420;
    const tick = (t) => {
      const p = (t - t0) / dur;
      bs.forEach((b, i) => {
        const settle = i / bs.length * .7 + .3;
        b.textContent = p >= settle ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      });
      if (p < 1) st.raf = requestAnimationFrame(tick);
    };
    st.raf = requestAnimationFrame(tick);
  };
  const HOLD = { base: 2600, fable: 1100, neon: 1100, hollow: 1100 };
  const step = (d) => {
    const st = state.get(d); clearTimeout(st.t);
    if (!st.vis || document.hidden) return;
    const next = WORLDS[(WORLDS.indexOf(d.dataset.w) + 1) % WORLDS.length];
    setWorld(d, next);
    const fast = d.matches(':hover, :focus-visible');
    st.t = setTimeout(() => step(d), fast ? 700 : HOLD[next]);
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const d = e.target, st = state.get(d);
    st.vis = e.isIntersecting;
    clearTimeout(st.t);
    if (!st.vis || REDUCE) return;
    st.t = setTimeout(() => step(d), 900 + st.i * 350);
    // First time a period comes into view, it says where it goes (so touch gets the label without hovering).
    if (!st.told && e.intersectionRatio > 0 && e.boundingClientRect.top < innerHeight * .8) {
      st.told = true;
      setTimeout(() => { d.classList.add('is-tell'); scramble(d); setTimeout(() => d.classList.remove('is-tell'), 2600); }, 700);
    }
  }), { threshold: [0, 1], rootMargin: '0px 0px -15% 0px' });
  dots.forEach((d, i) => {
    d.dataset.w = 'base';
    state.set(d, { i, t: 0, g: 0, raf: 0, vis: false, told: false });
    io.observe(d);
    const wake = () => { scramble(d); const st = state.get(d); if (!REDUCE && st.vis) { clearTimeout(st.t); st.t = setTimeout(() => step(d), 250); } };
    d.addEventListener('pointerenter', wake);
    d.addEventListener('focus', wake);
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) dots.forEach((d) => { const st = state.get(d); if (st.vis && !REDUCE) { clearTimeout(st.t); st.t = setTimeout(() => step(d), 600); } }); });

  // Back from the next page (bfcache): never come back to a flooded screen.
  addEventListener('pageshow', (e) => { if (e.persisted) document.querySelectorAll('.dotp-burst').forEach((b) => b.remove()); });
})();
