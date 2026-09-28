import { initScroll, initAnchors } from './scroll.js';
import { initIntro, initScrollAnimations, prepareText } from './animations.js';
import { initCursor, initMagnetic, initHoverAnimations, initClock } from './interactions.js';

function boot() {
  const { gsap, ScrollTrigger } = window;

  initClock();

  // If the CDN fails, the page stays fully readable with no motion.
  if (!gsap || !ScrollTrigger) {
    document.documentElement.classList.remove('js');
    document.querySelector('.intro')?.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  prepareText();

  const lenis = initScroll({ reduceMotion });
  lenis?.stop();
  initAnchors();

  initScrollAnimations();
  initIntro({ reduceMotion, onComplete: () => lenis?.start() });

  initCursor();
  initMagnetic();
  initHoverAnimations();

  // Re-measure once late-arriving fonts and images have settled layout.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

boot();
