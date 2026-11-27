/* Homepage helpers: Lenis smooth scroll synced to ScrollTrigger, anchor scrolling, splitChars (GSAP SplitText), magnet, scramble. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.REDUCE = reduce;

  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  // Phones: the address bar showing/hiding resizes the viewport; don't re-measure every trigger for it.
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]:not([data-pf-open])').forEach((a) => a.addEventListener('click', (e) => {
      const el = document.querySelector(a.getAttribute('href'));
      if (el) { e.preventDefault(); lenis.scrollTo(el, { duration: 1.6 }); }
    }));
  }

  // Split an element's text into per-char spans with GSAP SplitText (readable via aria-label on the element,
  // each char aria-hidden). Same output as before: span.<cls> per character, spaces left as text.
  window.splitChars = (el, cls = 'ch') => {
    if (window.SplitText) {
      gsap.registerPlugin(SplitText);
      return SplitText.create(el, { type: 'chars', charsClass: cls, tag: 'span', aria: 'auto', reduceWhiteSpace: false }).chars;
    }
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
