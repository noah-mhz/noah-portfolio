/* Case studies: the screens gallery (showcase arrangements + backstage index and detail).
   Each page lists its screens in <script type="application/json" id="screens">. */
addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && window.Lenis) { const l = new Lenis({ lerp: .09 }); window.lenis = l; const raf = (t) => { l.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }

  const data = JSON.parse($('#screens').textContent);
  const S = data.screens;
  const thumbs = S.map(([f]) => data.base + f);
  const items = S.map(([f, title, sub, text], i) => ({
    src: data.base + f, title, sub, text,
    rows: [['Screen', `${String(i + 1).padStart(2, '0')} / ${String(S.length).padStart(2, '0')}`], ...(data.rows || [])],
    href: data.href, cta: data.cta,
    thumbs: [thumbs[i], ...thumbs.filter((_, k) => k !== i)],
  }));

  const idx = $('[data-idx]'), cap = $('[data-caption]'), count = $('[data-count]');
  idx.innerHTML = items.map((it, i) => `<li><button type="button" data-go="${i}"><span>${String(i + 1).padStart(2, '0')}</span><span class="nm">${it.title}</span><span>${it.sub}</span></button></li>`).join('');
  const onActive = (i) => {
    $$('[data-go]', idx).forEach((b, k) => { b.classList.toggle('is-current', k === i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    cap.innerHTML = `<p class="mono" style="color:var(--teal);margin:0 0 .5rem">${items[i].sub}</p><h3>${items[i].title}</h3><p>${items[i].text}</p>`;
    count.textContent = `${i + 1} / ${items.length}`;
    if (!reduce && window.gsap) gsap.fromTo(cap.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .04, ease: 'power3.out' });
  };
  const g = Gallery($('[data-stage]'), { items, arrange: 'coverflow', onActive });
  $$('[data-go]', idx).forEach((b) => b.addEventListener('click', () => { g.go(+b.dataset.go); if (g.mode === 'grid') g.open(+b.dataset.go); }));
  $$('[data-seg] button').forEach((b) => b.addEventListener('click', () => {
    $$('[data-seg] button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    g.arrange(b.dataset.arr);
  }));

  /* ---------- Art direction layer (css/case.css) ----------
     Hero: the title rises letter by letter, the composition's layers arrive back to front, then drift
     with the pointer and at different speeds as you scroll. Spreads: each image is uncovered upward
     and drifts inside its frame; the text lines rise. Details and the next project slide in. */
  const G = window.gsap, ST = window.ScrollTrigger;
  if (G && ST) { G.registerPlugin(ST); if (window.lenis) window.lenis.on('scroll', ST.update); }
  const title = $('.cs-title');
  if (title) {
    // Split the title into letters inside a mask; the accessible name stays on the h1.
    const t = title.querySelector('.cs-title__txt');
    if (t) { const txt = t.textContent; t.textContent = ''; [...txt].forEach((c) => { const s = document.createElement('span'); s.className = 'cs-ch'; s.setAttribute('aria-hidden', 'true'); s.textContent = c === ' ' ? '\u00a0' : c; t.append(s); }); }
  }
  if (reduce || !G) return;
  const layers = $$('.cs-layer');
  const intro = G.timeline({ defaults: { ease: 'expo.out' } });
  intro.from('.cs-title .cs-ch', { yPercent: 110, duration: 1.1, stagger: .03 }, 0)
    .from('.cs-title i', { scale: 0, duration: .7, ease: 'back.out(2)' }, .5)
    .from('.cs-kicker, .cs-side > *', { y: 24, autoAlpha: 0, duration: .9, stagger: .06 }, .2)
    .from([...layers].reverse(), { y: 80, autoAlpha: 0, rotation: (i) => [3, -4, 2][i % 3], duration: 1.3, stagger: .12 }, .25);

  if (matchMedia('(hover: hover) and (pointer: fine)').matches && layers.length) {
    const qs = layers.map((el) => ({ d: parseFloat(el.dataset.depth) || .6, x: G.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' }), y: G.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' }) }));
    addEventListener('pointermove', (e) => {
      if ((window.lenis ? window.lenis.scroll : scrollY) > innerHeight) return;
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      qs.forEach((q) => { q.x(-nx * 26 * q.d); q.y(-ny * 18 * q.d); });
    }, { passive: true });
  }
  if (!ST) return;
  const compose = $('.cs-compose');
  if (compose) layers.forEach((el) => {
    const d = parseFloat(el.dataset.depth) || .6;
    G.to(el, { yPercent: -18 * d, ease: 'none', scrollTrigger: { trigger: compose, start: 'top 40%', end: 'bottom top', scrub: true } });
  });
  const lines = (el) => {
    // Wrap each block's text in a line mask so it can rise.
    $$('h3, p, .mono', el).forEach((b) => { if (b.querySelector('.cs-line')) return; b.innerHTML = `<span class="cs-line"><span>${b.innerHTML}</span></span>`; });
    return $$('.cs-line > span', el);
  };
  $$('.cs-spread').forEach((sp) => {
    const fig = $('.cs-spread__fig', sp), img = $('img', fig), txt = $('.cs-spread__txt', sp);
    G.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: sp, start: 'top 78%', once: true } });
    G.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: sp, start: 'top 78%', once: true } });
    G.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    G.from(lines(txt), { yPercent: 110, duration: 1, stagger: .07, ease: 'expo.out', scrollTrigger: { trigger: sp, start: 'top 70%', once: true } });
  });
  const st = $('.cs-statement p');
  if (st) G.from(st, { y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: st, start: 'top 82%', once: true } });
  const det = $$('.cs-detail');
  if (det.length) G.from(det, { y: 60, autoAlpha: 0, duration: 1.1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: det[0], start: 'top 85%', once: true } });
  const peek = $('.cs-next__peek');
  if (peek) G.fromTo(peek, { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.cs-next', start: 'top bottom', end: 'bottom bottom', scrub: true } });
});
