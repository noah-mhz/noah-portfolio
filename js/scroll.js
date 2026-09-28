const { gsap, ScrollTrigger } = window;

let lenis = null;
let reducedMotion = false;

/**
 * Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger and Lenis
 * share one frame loop. Skipped entirely for reduced-motion users.
 */
export function initScroll({ reduceMotion }) {
  reducedMotion = reduceMotion;
  if (reduceMotion || typeof window.Lenis === 'undefined') return null;

  lenis = new window.Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function getLenis() {
  return lenis;
}

export function scrollToTarget(target) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
  } else {
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }
}

/** In-page anchors: smooth travel plus a focus hand-off for keyboard users. */
export function initAnchors() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    const target = hash.length > 1 ? document.querySelector(hash) : null;
    if (!target) return;

    event.preventDefault();
    scrollToTarget(target);

    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}
