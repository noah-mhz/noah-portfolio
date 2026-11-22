/* Colophon: type specimen controls, the SGT clock, the theme button label and section reveals. */
addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const g = window.gsap;
  if (!reduce && window.Lenis) { const l = new Lenis({ lerp: .09 }); window.lenis = l; const raf = (t) => { l.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); if (window.ScrollTrigger) l.on('scroll', ScrollTrigger.update); }

  /* Specimen: sliders drive width and weight; with a fine pointer, letters near it press wider. */
  const word = $('[data-spec]');
  const txt = word.textContent; word.textContent = '';
  const chars = [...txt].map((c) => { const s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.textContent = c; word.append(s); return s; });
  const val = { w: 100, g: 800 };
  const paint = () => { word.style.setProperty('--w', val.w); word.style.setProperty('--g', val.g); };
  $$('[data-axis]').forEach((inp) => inp.addEventListener('input', () => {
    val[inp.dataset.axis] = +inp.value; $(`[data-out="${inp.dataset.axis}"]`).textContent = inp.value; paint();
  }));
  paint();
  if (!reduce && g && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mx = 0, my = 0, on = false;
    const box = word.parentElement;
    box.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; on = true; });
    box.addEventListener('pointerleave', () => { on = false; });
    const st = chars.map(() => ({ w: 0, g: 0 }));
    g.ticker.add(() => {
      const r = word.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      chars.forEach((c, i) => {
        const b = c.getBoundingClientRect();
        const k = on ? Math.max(0, 1 - Math.hypot(mx - (b.left + b.width / 2), my - (b.top + b.height / 2)) / (r.height * 1.1)) : 0;
        st[i].w += (25 * k - st[i].w) * .12; st[i].g += (200 * k - st[i].g) * .12;
        const w = Math.min(125, val.w + st[i].w), wg = Math.min(900, val.g + st[i].g);
        c.style.fontVariationSettings = (st[i].w > .05 || on) ? `'wdth' ${w.toFixed(1)}, 'wght' ${wg.toFixed(0)}` : '';
      });
    });
  }

  /* Clock */
  const clock = $('[data-clock]');
  const tick = () => { clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }).format(new Date()); };
  tick(); setInterval(tick, 15000);

  /* Theme button says where it goes */
  const next = $('[data-next]');
  const syncNext = () => { next.textContent = root.dataset.theme === 'dark' ? 'light' : 'dark'; };
  syncNext(); new MutationObserver(syncNext).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  /* Reveals */
  if (reduce || !g || !window.ScrollTrigger) return;
  g.registerPlugin(ScrollTrigger);
  const rv = $$('.rv').filter((el) => el.getBoundingClientRect().top > innerHeight * .88);
  g.set(rv, { opacity: 0, y: 24 });
  ScrollTrigger.batch(rv, { start: 'top 88%', once: true, onEnter: (els) => g.to(els, { opacity: 1, y: 0, duration: .9, stagger: .06, ease: 'expo.out', clearProps: 'transform' }) });
});
