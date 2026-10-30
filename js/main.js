import { initScroll, initAnchors } from './scroll.js';
import { initIntro, initScrollAnimations, prepareText } from './animations.js';
import { initCursor, initMagnetic, initHoverAnimations, initClock, initInViewVideo, initHeroWeight, initTimelineDetails, initCardVideos } from './interactions.js';
import { initContactForm } from './contact.js';
import { initPageLeave } from './transition.js';
import { initScramble } from './scramble.js';
import { initTouchFx } from './touch.js';
import { initTheme } from './theme.js';
import { initProjectTitles } from './titles.js';
import { initSectionIndex } from './sections.js';

const RETURN_KEY = 'home-return';

/** Save the scroll position whenever the visitor leaves for a case study or the colophon. */
function rememberSpot() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !/\/(work\/[^/]+|colophon)\/?$/.test(url.pathname)) return;
    try { sessionStorage.setItem(RETURN_KEY, JSON.stringify({ y: window.scrollY, t: Date.now() })); } catch { /* private mode */ }
  }, true);
}

/** A saved spot applies when we arrive back from one of those pages, recently, without a deep link. */
function readReturn() {
  let saved = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(RETURN_KEY) || 'null');
    sessionStorage.removeItem(RETURN_KEY);
  } catch { return null; }
  if (!saved || Date.now() - saved.t > 30 * 60 * 1000) return null;
  const nav = performance.getEntriesByType?.('navigation')[0];
  const back = nav?.type === 'back_forward';
  let fromCase = false;
  try { fromCase = /\/(work\/[^/]+|colophon)\/?$/.test(new URL(document.referrer).pathname); } catch { /* no referrer */ }
  const hash = window.location.hash;
  if (hash && hash !== '#work') return null; // "About" or "Contact" from a case page still goes there
  return back || fromCase ? saved.y : null;
}

/** Jump straight there once layout (fonts, pins) has settled. */
function restoreSpot(y, lenis) {
  const { ScrollTrigger } = window;
  const go = () => {
    ScrollTrigger.refresh();
    // An element (deep link) is measured now that layout has settled.
    const top = typeof y === 'number' ? y : y.getBoundingClientRect().top + window.scrollY;
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo(0, top);
    ScrollTrigger.update();
  };
  (document.fonts?.ready || Promise.resolve()).then(() => requestAnimationFrame(go));
}

function boot() {
  const { gsap, ScrollTrigger } = window;

  initClock();
  initTheme();
  initInViewVideo();

  // If the CDN fails, the page stays fully readable with no motion.
  if (!gsap || !ScrollTrigger) {
    document.documentElement.classList.remove('js');
    document.querySelector('.intro')?.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Coming back from a case study or the colophon (Back, or "All work"), land
  // where the visitor left the homepage, without replaying the intro.
  // A deep link (#about, #contact, or #work with no saved spot) goes to that section.
  const hashTarget = window.location.hash.length > 1 ? document.querySelector(window.location.hash) : null;
  const returnTo = readReturn() ?? (hashTarget ? hashTarget : null);
  window.scrollTo(0, 0);
  rememberSpot();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  prepareText();

  const lenis = initScroll({ reduceMotion });
  lenis?.stop();
  initAnchors();

  initScrollAnimations();
  initIntro({ reduceMotion: reduceMotion || returnTo !== null, onComplete: () => lenis?.start() });
  if (returnTo !== null) restoreSpot(returnTo, lenis);

  initCursor();
  initMagnetic();
  initHoverAnimations();
  initCardVideos();
  initHeroWeight();
  initContactForm();
  initTimelineDetails();
  initPageLeave();
  initScramble();
  initTouchFx();
  initProjectTitles();
  initSectionIndex({ ScrollTrigger, ticks: false, menu: false });

  // Re-measure once late-arriving fonts and images have settled layout.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

boot();
