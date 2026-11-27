/* Case studies: the screens gallery (showcase arrangements + backstage index and detail).
   Each page lists its screens in <script type="application/json" id="screens">. */
addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && window.Lenis) { const l = new Lenis({ lerp: .09 }); window.lenis = l; const raf = (t) => { l.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }

  /* Dimension line (Industmarine): drawn to the title's width, like a measured drawing; plotted with GSAP DrawSVG */
  const dim = $('[data-dim]');
  if (dim) {
    const h1 = dim.previousElementSibling;
    const NS = 'http://www.w3.org/2000/svg';
    let drawn = false;
    const build = () => {
      const r = document.createRange(); r.selectNodeContents(h1.firstChild);
      const W = Math.round(r.getBoundingClientRect().width), H = 30, y = 14, cx = W / 2, gap = 52, a = 6;
      dim.innerHTML = `<svg xmlns="${NS}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        <line class="d-ext" x1=".5" y1="0" x2=".5" y2="${H - 4}"/><line class="d-ext" x1="${W - .5}" y1="0" x2="${W - .5}" y2="${H - 4}"/>
        <line class="d-run" x1="${cx - gap}" y1="${y}" x2="1" y2="${y}"/><line class="d-run" x1="${cx + gap}" y1="${y}" x2="${W - 1}" y2="${y}"/>
        <path class="d-arr" d="M${1 + a * 1.6} ${y - a / 2}L1 ${y}L${1 + a * 1.6} ${y + a / 2}"/><path class="d-arr" d="M${W - 1 - a * 1.6} ${y - a / 2}L${W - 1} ${y}L${W - 1 - a * 1.6} ${y + a / 2}"/>
        <text x="${cx}" y="${y + 4}" text-anchor="middle">${dim.dataset.dim}</text></svg>`;
    };
    const plot = () => {
      if (reduce || !window.gsap || !window.DrawSVGPlugin) return;
      gsap.registerPlugin(DrawSVGPlugin);
      const s = $('svg', dim);
      gsap.timeline({ delay: .3 })
        .from($$('.d-ext', s), { drawSVG: 0, duration: .5, ease: 'power2.inOut', stagger: .08 })
        .from($$('.d-run', s), { drawSVG: 0, duration: .9, ease: 'expo.inOut' }, '-=.15')
        .from($$('.d-arr', s), { drawSVG: '50% 50%', duration: .35, ease: 'power2.out' }, '-=.3')
        .from($('text', s), { opacity: 0, y: 4, duration: .5, ease: 'power3.out' }, '-=.6');
    };
    const go = () => { build(); if (!drawn) { drawn = true; plot(); } };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(go);
    let t = 0; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 150); });
  }

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

  // Page intro: title rises, the rest follows.
  if (!reduce && window.gsap) {
    gsap.from('.head h1', { yPercent: 40, opacity: 0, duration: 1.1, ease: 'expo.out' });
    gsap.from('.head > :not(h1)', { y: 24, opacity: 0, duration: .9, stagger: .06, ease: 'power3.out', delay: .15 });
  }
});
