import { splitAll, TEXT_TARGETS } from './split.js';
import { initNavigation } from './navigation.js';

const { gsap, ScrollTrigger } = window;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const textTargets = (el) => el.querySelectorAll(TEXT_TARGETS);

export const MEDIA = {
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  tablet: '(min-width: 768px) and (max-width: 1023px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
};

/* --------------------------------------------------------------------------
   Opening title sequence
   -------------------------------------------------------------------------- */

export function initIntro({ reduceMotion, onComplete }) {
  const intro = $('.intro');
  const scrollCue = $('.scroll-cue');
  const [first, second, third] = $$('.hero__title .l-inner');

  if (reduceMotion || !intro) {
    intro?.remove();
    scrollCue?.classList.add('is-active');
    onComplete?.();
    return null;
  }

  gsap.set('[data-intro-item]', { yPercent: 110 });
  gsap.set('[data-nav-item]', { yPercent: -60, clipPath: 'inset(0% 0% 100% 0%)' });
  gsap.set('[data-hero-meta]', { yPercent: 110 });
  // Each line takes a slightly different path out of its mask.
  gsap.set(first, { yPercent: 100 });
  gsap.set(second, { yPercent: 100, xPercent: 5 });
  gsap.set(third, { yPercent: 100, rotate: 2.5 });
  gsap.set('.hero__rule', { scaleX: 0 });
  gsap.set('.hero__accent', { scale: 0 });
  gsap.set(scrollCue, { autoAlpha: 0 });
  gsap.set('.grid-lines span', { scaleY: 0, transformOrigin: '50% 0%' });

  const tl = gsap.timeline({
    defaults: { ease: 'power4.out' },
    onComplete: () => {
      intro.remove();
      onComplete?.();
    },
  });

  // 0 — a title card of metadata, then 1 — the background establishes itself
  tl.to('[data-intro-item]', { yPercent: 0, duration: 1, stagger: 0.08, delay: 0.2 })
    .to('[data-intro-item]', { yPercent: -110, duration: 0.6, stagger: 0.05, ease: 'power3.in' }, '+=0.35')
    .to(intro, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'expo.inOut' }, '-=0.15')
    // 2 — navigation settles in from above, quietly
    .to('[data-nav-item]', {
      yPercent: 0,
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.2,
      stagger: 0.06,
      ease: 'expo.out',
      clearProps: 'clipPath',
    }, '-=0.35')
    // 3 — metadata
    .to('[data-hero-meta]', { yPercent: 0, duration: 1.2, stagger: 0.05 }, '<0.15')
    // 4 + 5 — the title, line by line, each on its own path
    .addLabel('title', '<0.1')
    .to(first, { yPercent: 0, duration: 1.8 }, 'title')
    .to(second, { yPercent: 0, xPercent: 0, duration: 1.9 }, 'title+=0.16')
    .to(third, { yPercent: 0, rotate: 0, duration: 2 }, 'title+=0.32')
    .to('.hero__rule', { scaleX: 1, duration: 1.8, ease: 'expo.inOut' }, 'title+=0.4')
    // 6 — accent
    .to('.hero__accent', { scale: 1, duration: 1, ease: 'expo.out' }, 'title+=1.1')
    // 7 — the grid draws itself in behind everything
    .to('.grid-lines span', { scaleY: 1, duration: 1.8, stagger: 0.1, ease: 'expo.inOut' }, 'title+=0.9')
    // 8 — scroll cue becomes active
    .to(scrollCue, { autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, 'title+=1.6')
    .add(() => scrollCue.classList.add('is-active'), '<');

  return tl;
}

/* --------------------------------------------------------------------------
   Reusable reveals
   -------------------------------------------------------------------------- */

const REVEAL = {
  line: { duration: 1.5, stagger: 0.12 },
  word: { duration: 1.4, stagger: 0.045 },
  char: { duration: 1.2, stagger: 0.025 },
};

/** Masked reveal for any split element: [data-reveal="text"]. */
export function initTextReveal({ isMobile = false } = {}) {
  $$('[data-reveal="text"]').forEach((el) => {
    const targets = textTargets(el);
    if (!targets.length) return;

    const kind = targets[0].classList.contains('c-inner') ? 'char'
      : targets[0].classList.contains('l-inner') ? 'line' : 'word';
    const { duration, stagger } = REVEAL[kind];

    gsap.fromTo(targets,
      { yPercent: 110, rotate: isMobile || kind === 'char' ? 0 : 2.5 },
      {
        yPercent: 0,
        rotate: 0,
        duration,
        ease: 'power4.out',
        stagger: isMobile ? stagger * 0.6 : stagger,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
  });

  $$('[data-reveal="fade"]').forEach((el) => {
    gsap.fromTo(el,
      { y: 28, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
  });
}

export function initImageReveal() {
  $$('.about__media-inner').forEach((media) => {
    gsap.fromTo(media,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.8,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: media, start: 'top 85%', once: true },
      });
  });
}

export function initParallax() {
  $$('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax) || 8;
    const img = el.querySelector('img') || el;

    gsap.fromTo(img,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
  });
}

/* --------------------------------------------------------------------------
   Hero exit + statement
   -------------------------------------------------------------------------- */

export function initHeroScroll({ isMobile }) {
  const hero = $('.hero');
  const lines = $$('.hero__title .line');

  const tl = gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });

  lines.forEach((line, index) => {
    tl.to(line, { yPercent: -(isMobile ? 20 : 40) - index * 22, ease: 'none' }, 0);
  });

  tl.to('.hero__meta, .hero__hello', { y: -60, autoAlpha: 0, ease: 'none' }, 0)
    .to('.hero__foot', { autoAlpha: 0, ease: 'none', duration: 0.5 }, 0)
    .to('.scroll-cue__track', { scaleY: 0, transformOrigin: '50% 100%', ease: 'none', duration: 0.4 }, 0);
}

export function initStatement() {
  $$('.statement__text .line').forEach((line) => {
    const from = {
      left: { xPercent: -16 },
      right: { xPercent: 16 },
      up: { yPercent: 45 },
    }[line.dataset.from] || { yPercent: 45 };

    gsap.fromTo(line, from, {
      xPercent: 0,
      yPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: line, start: 'top bottom', end: 'top 45%', scrub: 1 },
    });
  });
}

/* --------------------------------------------------------------------------
   Selected work
   -------------------------------------------------------------------------- */

export function initWorkHead() {
  const [first, second] = $$('.work__title .line');
  const scrub = { trigger: '.work__head', start: 'top bottom', end: 'bottom top', scrub: true };

  gsap.fromTo(first, { xPercent: 8 }, { xPercent: -6, ease: 'none', scrollTrigger: scrub });
  gsap.fromTo(second, { xPercent: -8 }, { xPercent: 4, ease: 'none', scrollTrigger: { ...scrub } });
}

/**
 * Each project enters along the path the previous one left on, so the
 * sequence reads as one choreography: up (Ganko, pinned) → from below
 * (Luumens) → diagonal (Voyagaer) → lateral wipe (Experiments).
 * title: signed xPercent entry offset · meta: side the metadata enters from.
 */
const PROJECT_PATHS = [
  { title: 12, clip: 'inset(42% 0% 0% 0%)', media: { yPercent: 12 }, meta: -1 },
  { title: -12, clip: 'inset(0% 0% 38% 38%)', media: { xPercent: -4, yPercent: 8 }, meta: 1 },
  { title: 12, clip: 'inset(0% 0% 0% 64%)', media: { xPercent: 5 }, meta: -1 },
];

export function initProjectAnimations({ isMobile }) {
  $$('[data-project]').forEach((project, index) => {
    const path = PROJECT_PATHS[index % PROJECT_PATHS.length];
    const media = $('.project__media', project);
    const clip = $('.project__clip', project);
    const inner = $('.project__inner', project);
    const title = $('.project__title', project);
    const num = $('[data-project-num]', project);
    const meta = $$('.project__facts > div, .project__link', project);

    gsap.fromTo(num, { yPercent: 110 }, {
      yPercent: 0,
      duration: 1.2,
      ease: 'power4.out',
      scrollTrigger: { trigger: project, start: 'top 80%', once: true },
    });

    gsap.fromTo(meta,
      { x: isMobile ? 0 : 56 * path.meta, y: isMobile ? 18 : 0, autoAlpha: 0 },
      {
        x: 0,
        y: 0,
        autoAlpha: 1,
        duration: 1.3,
        ease: 'expo.out',
        stagger: 0.07,
        scrollTrigger: { trigger: clip, start: isMobile ? 'top 80%' : 'top 50%', once: true },
      });

    if (isMobile) {
      gsap.timeline({ scrollTrigger: { trigger: clip, start: 'top 85%', once: true } })
        .fromTo(clip, { clipPath: path.clip }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out' }, 0)
        .fromTo(inner, { scale: 1.12 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0);
      return;
    }

    // Entry — the frame opens along this project's path while the image settles.
    gsap.timeline({
      scrollTrigger: { trigger: project, start: 'top bottom', end: 'center 55%', scrub: 1 },
    })
      .fromTo(clip, { clipPath: path.clip }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out' }, 0)
      .fromTo(media, path.media, { xPercent: 0, yPercent: 0, ease: 'power2.out' }, 0)
      .fromTo(inner, { scale: 1.12 }, { scale: 1, ease: 'power2.out' }, 0);

    // Continuous drift across the full pass — noticed subconsciously.
    gsap.fromTo(inner, { xPercent: -4, yPercent: 3 }, {
      xPercent: 4,
      yPercent: -3,
      ease: 'none',
      scrollTrigger: { trigger: project, start: 'top bottom', end: 'bottom top', scrub: true },
    });

    // Title arrives from its side, settles, then keeps travelling as it leaves.
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: project, start: 'top bottom', end: 'bottom top', scrub: true },
    })
      .fromTo(title, { xPercent: path.title }, { xPercent: 0, duration: 1 })
      .to(title, { xPercent: -path.title * 0.4, duration: 1 });

    // Exit — the frame retracts upward, handing the viewport to the next project.
    gsap.fromTo(media, { clipPath: 'inset(0% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 28% 0%)',
      ease: 'none',
      immediateRender: false,
      scrollTrigger: { trigger: project, start: 'bottom 80%', end: 'bottom top', scrub: true },
    });
  });
}

/* --------------------------------------------------------------------------
   Pinned project sequence — Ganko.sg
   -------------------------------------------------------------------------- */


export function initCaseStudy({ pinned }) {
  const section = $('.case');
  if (!section) return undefined;

  const stages = $$('.case__stage', section);
  const media = $('.case__media', section);
  const imgA = $('.case__img--a', section);
  const imgB = $('.case__img--b', section);
  const titleChars = textTargets($('.case__title', section));

  if (!pinned) {
    gsap.fromTo(titleChars, { yPercent: 115 }, {
      yPercent: 0, duration: 1.4, ease: 'power4.out', stagger: 0.03,
      scrollTrigger: { trigger: section, start: 'top 75%', once: true },
    });
    gsap.fromTo(media, { clipPath: 'inset(42% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out',
      scrollTrigger: { trigger: media, start: 'top 85%', once: true },
    });
    stages.forEach((stage) => {
      gsap.fromTo($$('[data-stage-item]', stage), { yPercent: 110 }, {
        yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: stage, start: 'top 85%', once: true },
      });
    });
    return undefined;
  }

  const nextProject = section.nextElementSibling;
  section.classList.add('is-pinned');
  nextProject?.classList.add('is-overlapping');

  const steps = $$('.case__steps li', section);
  const bar = $('[data-case-bar]', section);
  const stagesWrap = $('.case__stages', section);
  const next = $$('[data-case-next]', section);

  /*
   * One continuous timeline (units are scroll distance):
   * 1 title over a large image · 2 zoom out, metadata · 3 description ·
   * 4 stack & role · 5 image shifts position · 6 exit + next cue ·
   * 7 hold while the next project rises over the frame, then release.
   */
  const stageIn = [1.5, 2.9, 4.3, 6.0];
  const stageOut = [2.6, 4.0, 5.4, 7.0];
  const exitAt = 7.0;
  const total = 9.6;
  let currentStep = -1;

  const setStep = (index) => {
    if (index === currentStep) return;
    currentStep = index;
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
  };

  // Phase 5 distances depend on layout, so they are re-measured on refresh.
  const mediaShift = () => stagesWrap.offsetLeft - media.offsetLeft;
  const stagesShift = () => (media.offsetLeft + media.offsetWidth) - (stagesWrap.offsetLeft + stagesWrap.offsetWidth);

  gsap.set(stages, { autoAlpha: 0 });

  const tl = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=500%',
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const t = self.progress * total;
        setStep(t < stageIn[1] ? 0 : t < stageIn[2] ? 1 : t < stageIn[3] ? 2 : 3);
      },
    },
  });

  tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: exitAt + 1, ease: 'none' }, 0)
    // 1 — the title rises over a large image
    .fromTo(media,
      { clipPath: 'inset(18% 12% 18% 12%)', scale: 1.35 },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.out' }, 0)
    .fromTo(imgA, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'power2.out' }, 0)
    .fromTo(titleChars, { yPercent: 115 }, { yPercent: 0, duration: 0.9, stagger: 0.04, ease: 'power4.out' }, 0.1)
    // 2 — the image zooms out to its place in the grid
    .to(media, { scale: 1, duration: 1.1, ease: 'power2.inOut' }, 1.1)
    // 3 — image transition under the description
    .fromTo(imgB,
      { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.2 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.3 }, stageIn[1] - 0.3)
    .to(imgA, { yPercent: -10, scale: 1.08, duration: 1.3 }, stageIn[1] - 0.3)
    .to(imgB, { scale: 1.08, xPercent: -3, duration: exitAt - stageIn[2], ease: 'none' }, stageIn[2])
    // 5 — the image crosses to the other side of the grid; the text column swaps with it
    .to(media, { x: mediaShift, duration: 1.2 }, stageOut[2] + 0.1)
    .to(stagesWrap, { x: stagesShift, duration: 1.2 }, stageOut[2] + 0.1)
    // 6 — everything leaves upward; the next project is announced
    .to(titleChars, { yPercent: -115, duration: 0.7, stagger: 0.03, ease: 'power3.in' }, exitAt)
    .to(media, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, exitAt)
    .to('.case__top', { autoAlpha: 0, duration: 0.6 }, exitAt + 0.6)
    .fromTo(next, { yPercent: 110 }, { yPercent: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, exitAt + 0.4)
    // 7 — hold while the next project rises over the frame, then release
    .to(next, { yPercent: -110, duration: 0.5, stagger: 0.05, ease: 'power3.in' }, total - 1.1);

  stages.forEach((stage, index) => {
    const items = $$('[data-stage-item]', stage);

    tl.set(stage, { autoAlpha: 1 }, stageIn[index])
      .fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: 0.75, stagger: 0.06, ease: 'power3.out' }, stageIn[index])
      .to(items, { yPercent: -110, duration: 0.45, stagger: 0.02, ease: 'power3.in' }, stageOut[index])
      .set(stage, { autoAlpha: 0 }, stageOut[index] + 0.55);
  });

  setStep(0);

  return () => {
    section.classList.remove('is-pinned');
    nextProject?.classList.remove('is-overlapping');
  };
}

/**
 * Scroll velocity nudges a few elements and lets them settle once scrolling
 * stops. Ranges are small: the page should never feel unstable.
 */
export function initVelocity() {
  const targets = [
    ...$$('.project__clip').map((el) => [el, 14]),
    ...$$('.project__meta, .project__num').map((el) => [el, 6]),
    ...$$('.project__title').map((el) => [el, 4]),
  ].map(([el, range]) => ({ range, to: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }) }));

  const settle = gsap.delayedCall(0.12, () => targets.forEach(({ to }) => to(0))).pause();

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const v = gsap.utils.clamp(-1, 1, self.getVelocity() / 3000);
      targets.forEach(({ range, to }) => to(-v * range));
      settle.restart(true);
    },
  });
}

/* --------------------------------------------------------------------------
   Typographic transition — DESIGN / DEVELOPMENT / MOTION / EXPERIENCE
   -------------------------------------------------------------------------- */

/**
 * Each discipline is anchored to a grid line and arrives on its own trajectory:
 * DESIGN holds · DEVELOPMENT travels horizontally · MOTION rises vertically ·
 * EXPERIENCE arrives diagonally. Once assembled, the words drift at different
 * rates — depth from motion rather than shadow — before two leave and two stay.
 */
export function initWordStack({ isMobile }) {
  const section = $('.words');
  if (!section) return;

  const [design, development, motion, experience] = $$('.words__item', section);
  const countEl = $('[data-words-count]', section);
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  let current = 1;

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: isMobile ? '+=160%' : '+=320%',
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        const next = p < 0.12 ? 1 : p < 0.3 ? 2 : p < 0.48 ? 3 : 4;
        if (next !== current) {
          current = next;
          countEl.textContent = String(next).padStart(2, '0');
        }
      },
    },
  });

  tl.fromTo(development, { xPercent: 105 }, { xPercent: 0, duration: 1.1 }, 0.1)
    .fromTo(motion, { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.1 }, 1.1)
    .fromTo(textTargets(motion), { yPercent: 110 }, { yPercent: 0, duration: 0.9 }, 1.2)
    .fromTo(experience,
      { xPercent: -10, yPercent: 60, clipPath: 'inset(0% 100% 0% 0%)' },
      { xPercent: 0, yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2 }, 2.1)
    // Parallax layers: the further down the stack, the faster it drifts.
    .to(design, { xPercent: -1, duration: 1.4, ease: 'none' }, 3.3)
    .to(development, { xPercent: -3, duration: 1.4, ease: 'none' }, 3.3)
    .to(motion, { xPercent: -6, duration: 1.4, ease: 'none' }, 3.3)
    .to(experience, { xPercent: -9, duration: 1.4, ease: 'none' }, 3.3)
    // Two leave the frame, two remain pinned; the last word takes the accent.
    .to(design, { xPercent: -110, duration: 1.2, ease: 'power2.in' }, 4.7)
    .to(development, { xPercent: 110, duration: 1.2, ease: 'power2.in' }, 4.7)
    .to(experience, { color: accent, duration: 0.8, ease: 'power2.inOut' }, 4.9)
    .to({}, { duration: 0.4 });
}

/* --------------------------------------------------------------------------
   Timeline, capabilities entrance, contact → footer
   -------------------------------------------------------------------------- */

export function initTimeline() {
  const track = $('[data-timeline]');
  if (!track) return;

  gsap.fromTo('[data-timeline-fill]', { scaleY: 0 }, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: track, start: 'top 70%', end: 'bottom 70%', scrub: true },
  });

  // Entries reveal as the line's leading edge (viewport 70%) reaches them.
  $$('[data-tl]', track).forEach((entry) => {
    gsap.fromTo($$('[data-tl-item]', entry), { yPercent: 110 }, {
      yPercent: 0,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.07,
      scrollTrigger: { trigger: entry, start: 'top 72%', toggleActions: 'play none none reverse' },
    });

    ScrollTrigger.create({
      trigger: entry,
      start: 'top+=60 70%',
      onEnter: () => entry.classList.add('is-active'),
      onLeaveBack: () => entry.classList.remove('is-active'),
    });
  });
}

export function initCapsEntrance() {
  gsap.fromTo('[data-cap]', { y: 40, autoAlpha: 0 }, {
    y: 0,
    autoAlpha: 1,
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.07,
    scrollTrigger: { trigger: '[data-caps]', start: 'top 85%', once: true },
  });
}

export function initSectionTransitions({ isMobile }) {
  const grid = $('.grid-lines');
  const contact = $('.contact');

  // The page resolves at the contact: the grid brightens, the accent enters, the link goes live.
  ScrollTrigger.create({
    trigger: contact,
    start: 'top 55%',
    end: 'bottom top',
    onToggle: (self) => {
      grid.classList.toggle('is-lit', self.isActive);
      contact.classList.toggle('is-live', self.isActive);
    },
  });

  // Contact recedes as the footer rises over it.
  gsap.to('.contact__inner', {
    y: isMobile ? -30 : -90,
    autoAlpha: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 30%', scrub: true },
  });

  gsap.fromTo('.footer__mark span', { yPercent: 100 }, {
    yPercent: 0,
    ease: 'none',
    stagger: 0.12,
    scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'bottom bottom', scrub: 1 },
  });

  return () => {
    grid.classList.remove('is-lit');
    contact.classList.remove('is-live');
  };
}

/* --------------------------------------------------------------------------
   Orchestration
   -------------------------------------------------------------------------- */

export function prepareText() {
  splitAll();
}

/**
 * All scroll choreography lives in one matchMedia context so every tween and
 * ScrollTrigger is reverted cleanly when the breakpoint or motion preference
 * changes. Pins are created first so later triggers measure pin spacing.
 */
export function initScrollAnimations() {
  const mm = gsap.matchMedia();

  mm.add({
    isDesktop: MEDIA.desktop,
    isTablet: MEDIA.tablet,
    isMobile: MEDIA.mobile,
  }, (context) => {
    const { isDesktop, isTablet, isMobile } = context.conditions;
    if (!isDesktop && !isTablet && !isMobile) return undefined;

    const cleanupCase = initCaseStudy({ pinned: isDesktop });
    initWordStack({ isMobile });

    initHeroScroll({ isMobile });
    initTextReveal({ isMobile });
    initProjectAnimations({ isMobile });
    initTimeline();
    initCapsEntrance();
    initImageReveal();
    const cleanupSections = initSectionTransitions({ isMobile });
    const cleanupNav = initNavigation();

    if (!isMobile) {
      initStatement();
      initWorkHead();
      initParallax();
    }

    if (isDesktop) initVelocity();

    return () => {
      cleanupCase?.();
      cleanupNav?.();
      cleanupSections?.();
    };
  });

  // Reduced motion: content is static and immediately visible; navigation state still tracks the page.
  mm.add(MEDIA.reduced, () => initNavigation({ reduceMotion: true }));

  return mm;
}
