/*
 * Entry point for case-study pages (work/*). Reuses the shared scroll,
 * text-reveal, navigation and interaction modules; adds the motion that
 * only these pages need: hero entrance, media reveals and scroll-through
 * frames for long page captures.
 */
import { initScroll, initAnchors } from './scroll.js';
import { MEDIA, initTextReveal, prepareText } from './animations.js';
import { initNavigation } from './navigation.js';
import { initCursor, initMagnetic, initInViewVideo, initClock } from './interactions.js';
import { initScramble } from './scramble.js';
import { initTouchFx } from './touch.js';
import { initTheme } from './theme.js';
import { initContactForm } from './contact.js';
import { initGlitch } from './glitch.js';
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

  $$('.study-palette').forEach((palette) => {
    gsap.fromTo($$('[data-swatch]', palette), { scaleY: 0 }, {
      scaleY: 1,
      duration: 1.2,
      ease: 'expo.inOut',
      stagger: 0.1,
      scrollTrigger: { trigger: palette, start: 'top 85%', once: true },
    });
  });
}

/**
 * Decisions chapter (desktop): the step nearest the middle of the screen is
 * active, and the held frame swaps to its screen — the new one wipes up over
 * the old. Smaller screens and reduced motion get the stacked layout from CSS.
 */
function initChapter({ gsap }) {
  const chapter = $('[data-chapter]');
  if (!chapter) return undefined;
  const steps = $$('[data-step]', chapter);
  const imgs = $$('[data-stage-img]', chapter);
  const url = $('[data-stage-url]', chapter);
  let current = -1;
  let layer = 1;

  const show = (index) => {
    if (index === current) return;
    const first = current < 0;
    current = index;
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
    if (url) url.textContent = imgs[index].dataset.url || url.textContent;
    layer += 1;
    gsap.set(imgs[index], { zIndex: layer });
    if (first) {
      gsap.set(imgs[index], { clipPath: 'inset(0% 0% 0% 0%)' });
      return;
    }
    gsap.fromTo(imgs[index],
      { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.06 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.1, ease: 'expo.inOut', overwrite: true });
  };

  const triggers = steps.map((step, i) => window.ScrollTrigger.create({
    trigger: step,
    start: 'top 55%',
    end: 'bottom 55%',
    onToggle: (self) => { if (self.isActive) show(i); },
  }));
  show(0);

  return () => {
    triggers.forEach((t) => t.kill());
    steps.forEach((step) => step.classList.remove('is-active'));
    gsap.set(imgs, { clearProps: 'clipPath,zIndex,scale' });
  };
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
  initClock();
  initTheme();

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
    const cleanupChapter = isDesktop ? initChapter({ gsap }) : undefined;
    const cleanupNav = initNavigation();

    return () => {
      cleanupNav?.();
      cleanupChapter?.();
      $$('[data-scroll-through]').forEach((frame) => frame.classList.remove('is-scrolling'));
    };
  });

  mm.add(MEDIA.reduced, () => initNavigation({ reduceMotion: true }));

  initCursor();
  initMagnetic();
  initScramble();
  initTouchFx({ home: false });
  initContactForm();
  initGlitch({ gsap, ScrollTrigger });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

boot();
