/*
 * Entry point for case-study pages (work/*). Reuses the shared scroll,
 * text-reveal, navigation and interaction modules; adds the motion that
 * only these pages need: hero entrance, media reveals and scroll-through
 * frames for long page captures.
 */
import { initScroll, initAnchors } from './scroll.js';
import { MEDIA, initTextReveal, prepareText } from './animations.js';
import { initNavigation } from './navigation.js';
import { initCursor, initMagnetic, initInViewVideo } from './interactions.js';
import { TEXT_TARGETS } from './split.js';
import { initPageEnter } from './transition.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function initHero({ gsap }) {
  const chars = $('[data-hero-title]').querySelectorAll(TEXT_TARGETS);

  gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.15 })
    .fromTo(chars, { yPercent: 110 }, { yPercent: 0, duration: 1.6, stagger: 0.05 }, 0)
    .fromTo('[data-hero-sub]', { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.4 }, 0.5)
    .fromTo('.study-hero__jp', { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' }, 0.6)
    .fromTo('[data-hero-meta]', { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, 0.8)
    .fromTo('[data-hero-media]',
      { clipPath: 'inset(18% 10% 0% 10%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' }, 0.9)
    .fromTo('[data-hero-media] img, [data-hero-media] video', { scale: 1.15 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0.9);
}

/** Media frames open from the edge named in data-from, while the image settles. */
function initMediaReveal({ gsap }, { isMobile }) {
  const from = {
    top: 'inset(0% 0% 100% 0%)',
    bottom: 'inset(100% 0% 0% 0%)',
    left: 'inset(0% 100% 0% 0%)',
  };

  $$('[data-reveal="media"]').forEach((el) => {
    const target = el.querySelector('.study-media, .frame') || el;
    const img = target.querySelector('img, video');

    gsap.timeline({ scrollTrigger: { trigger: el, start: isMobile ? 'top 88%' : 'top 80%', once: true } })
      .fromTo(target,
        { clipPath: from[el.dataset.from] || from.bottom },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0)
      .fromTo(img, { scale: 1.12 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0);
  });

  gsap.fromTo('[data-swatch]', { scaleY: 0 }, {
    scaleY: 1,
    duration: 1.2,
    ease: 'expo.inOut',
    stagger: 0.1,
    scrollTrigger: { trigger: '.study-palette', start: 'top 85%', once: true },
  });
}

/** Long page captures scroll inside their frame as the frame passes through the viewport. */
function initScrollThrough({ gsap }) {
  $$('[data-scroll-through]').forEach((frame) => {
    const view = frame.querySelector('.frame__view');
    const img = view.querySelector('img');
    frame.classList.add('is-scrolling');

    gsap.fromTo(img, { y: 0 }, {
      y: () => -(img.getBoundingClientRect().height - view.clientHeight),
      ease: 'none',
      scrollTrigger: {
        trigger: frame,
        start: 'top 70%',
        end: 'bottom 30%',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
  });
}

function boot() {
  const { gsap, ScrollTrigger } = window;

  initInViewVideo();

  if (!gsap || !ScrollTrigger) {
    document.documentElement.classList.remove('js', 'pt-enter');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  initPageEnter();
  const reduceMotion = window.matchMedia(MEDIA.reduced).matches;

  prepareText();
  initScroll({ reduceMotion });
  initAnchors();

  const mm = gsap.matchMedia();

  mm.add({ isDesktop: MEDIA.desktop, isTablet: MEDIA.tablet, isMobile: MEDIA.mobile }, (context) => {
    const { isDesktop, isTablet, isMobile } = context.conditions;
    if (!isDesktop && !isTablet && !isMobile) return undefined;

    initHero({ gsap });
    initTextReveal({ isMobile });
    initMediaReveal({ gsap }, { isMobile });
    if (!isMobile) initScrollThrough({ gsap });
    const cleanupNav = initNavigation();

    return () => {
      cleanupNav?.();
      $$('[data-scroll-through]').forEach((frame) => frame.classList.remove('is-scrolling'));
    };
  });

  mm.add(MEDIA.reduced, () => initNavigation({ reduceMotion: true }));

  initCursor();
  initMagnetic();

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

boot();
