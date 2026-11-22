/* Redesign samples: theme switch, smooth scroll, the sample switcher, small helpers. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.REDUCE = reduce;

  // Sample switcher bar.
  const here = location.pathname.match(/samples\/(\w)\//)?.[1];
  const bar = document.createElement('nav');
  bar.className = 'samples-bar';
  bar.setAttribute('aria-label', 'Redesign samples');
  const solo = root.dataset.solo !== undefined;
  bar.innerHTML = (solo ? [] : [['a', 'A · Print'], ['b', 'B · Kinetic'], ['c', 'C · Gallery']])
    .map(([k, t]) => `<a href="../${k}/"${k === here ? ' aria-current="page"' : ''}>${t.replace(' · ', '<span class="sb-l"> · ')}</span></a>`).join('') +
    '<button type="button" data-theme-toggle>Light / Dark</button>';
  if (root.dataset.bar !== 'none') document.body.append(bar);

  const setTheme = (t) => {
    root.dataset.theme = t;
    try { localStorage.setItem('sample-theme', t); } catch (e) {}
    document.dispatchEvent(new CustomEvent('sample:theme', { detail: t }));
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-theme-toggle]')) setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const el = document.querySelector(a.getAttribute('href'));
      if (el) { e.preventDefault(); lenis.scrollTo(el, { duration: 1.6 }); }
    }));
  }

  // Split an element's text into per-char spans (kept readable via aria-label).
  window.splitChars = (el, cls = 'ch') => {
    const text = el.textContent;
    el.setAttribute('aria-label', text.trim());
    el.innerHTML = [...text].map((c) => c === ' ' ? ' ' : `<span class="${cls}" aria-hidden="true">${c}</span>`).join('');
    return [...el.querySelectorAll('.' + cls)];
  };

  // Magnetic pull (React Bits "Magnet").
  window.magnet = (el, strength = 0.35) => {
    if (reduce || !matchMedia('(pointer: fine)').matches) return;
    const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      qx((e.clientX - r.left - r.width / 2) * strength);
      qy((e.clientY - r.top - r.height / 2) * strength);
    });
    el.addEventListener('pointerleave', () => { qx(0); qy(0); });
  };

  // Scramble a label into place (React Bits "Decrypted Text").
  window.scramble = (el, { duration = 1, chars = 'abcdefghijklmnopqrstuvwxyz0123456789·/→' } = {}) => {
    const final = el.textContent;
    if (reduce) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      const n = Math.floor(p * final.length);
      el.textContent = final.slice(0, n) + [...final.slice(n)].map((c) => c === ' ' ? ' ' : chars[(Math.random() * chars.length) | 0]).join('');
      if (p < 1) requestAnimationFrame(tick); else el.textContent = final;
    };
    requestAnimationFrame(tick);
  };
})();
