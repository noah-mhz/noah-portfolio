import { splitWords } from './split.js';

const { gsap, ScrollTrigger } = window;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

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
  const heroLines = $$('.hero__title .line');
  const scrollCue = $('.scroll-cue');

  if (reduceMotion || !intro) {
    intro?.remove();
    scrollCue?.classList.add('is-active');
    onComplete?.();
    return null;
  }

  const counter = $('.intro__count', intro);
  const count = { value: 0 };

  gsap.set('[data-nav-item]', { clipPath: 'inset(0% 100% 0% 0%)' });
  gsap.set('[data-hero-meta]', { yPercent: 110 });
  gsap.set('.hero__title .w-inner', { yPercent: 115, rotate: 4 });
  gsap.set('.hero__rule', { scaleX: 0 });
  gsap.set('.hero__accent', { scale: 0 });
  gsap.set(scrollCue, { autoAlpha: 0 });
  gsap.set('.grid-lines span', { scaleY: 0, transformOrigin: '50% 0%' });

  const tl = gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete: () => {
      intro.remove();
      onComplete?.();
    },
  });

  tl.to(count, {
    value: 100,
    duration: 1.2,
    ease: 'power2.inOut',
    onUpdate: () => {
      counter.textContent = String(Math.round(count.value)).padStart(3, '0');
    },
  })
    // 1 — background
    .to(intro, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: 'expo.inOut' })
    .to('.grid-lines span', { scaleY: 1, duration: 1.8, stagger: 0.08, ease: 'expo.inOut' }, '<0.2')
    // 2 — navigation, horizontally
    .to('[data-nav-item]', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, stagger: 0.08 }, '<0.35')
    // 3 — metadata
    .to('[data-hero-meta]', { yPercent: 0, duration: 1.2, stagger: 0.06, ease: 'power4.out' }, '<0.1')
    .addLabel('title', '<0.15');

  // 4 + 5 — line-by-line, word-by-word
  heroLines.forEach((line, index) => {
    tl.to(line.querySelectorAll('.w-inner'), {
      yPercent: 0,
      rotate: 0,
      duration: 1.5,
      stagger: 0.06,
    }, `title+=${index * 0.14}`);
  });

  // 6 — accent, 7 — scroll cue
  tl.to('.hero__rule', { scaleX: 1, duration: 1.6, ease: 'expo.inOut' }, 'title+=0.3')
    .to('.hero__accent', { scale: 1, duration: 1, ease: 'power4.out' }, 'title+=0.9')
    .to(scrollCue, { autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, '<0.2')
    .add(() => scrollCue.classList.add('is-active'), '<');

  return tl;
}

/* --------------------------------------------------------------------------
   Reusable reveals
   -------------------------------------------------------------------------- */

export function initTextReveal({ isMobile = false } = {}) {
  $$('[data-reveal="words"]').forEach((el) => {
    const words = el.querySelectorAll('.w-inner');
    if (!words.length) return;

    gsap.fromTo(words,
      { yPercent: 115, rotate: isMobile ? 0 : 3 },
      {
        yPercent: 0,
        rotate: 0,
        duration: 1.4,
        ease: 'expo.out',
        stagger: isMobile ? 0.03 : 0.045,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
  });

  $$('[data-reveal="fade"]').forEach((el) => {
    gsap.fromTo(el,
      { y: 36, autoAlpha: 0 },
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

export function initProjectScroll({ isMobile }) {
  const projects = $$('[data-project]');
  const strip = $('[data-counter-strip]');
  const counter = $('.work__counter');

  if (counter) {
    ScrollTrigger.create({
      trigger: '.work__list',
      start: 'top 60%',
      end: 'bottom 60%',
      toggleClass: { targets: counter, className: 'is-visible' },
    });
  }

  projects.forEach((project, index) => {
    const alt = project.classList.contains('project--alt');
    const media = $('.project__media', project);
    const clip = $('.project__clip', project);
    const inner = $('.project__inner', project);
    const title = $('.project__title', project);
    const num = $('[data-project-num]', project);
    const meta = $$('.project__meta > div', project);

    if (strip) {
      ScrollTrigger.create({
        trigger: project,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (!self.isActive) return;
          gsap.to(strip, {
            yPercent: -(100 / projects.length) * index,
            duration: 1,
            ease: 'expo.out',
            overwrite: true,
          });
        },
      });
    }

    gsap.fromTo(num, { yPercent: 110 }, {
      yPercent: 0,
      duration: 1.2,
      ease: 'expo.out',
      scrollTrigger: { trigger: project, start: 'top 75%', once: true },
    });

    gsap.fromTo(meta,
      { x: isMobile ? 0 : (alt ? -60 : 60), y: isMobile ? 20 : 0, autoAlpha: 0 },
      {
        x: 0,
        y: 0,
        autoAlpha: 1,
        duration: 1.3,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: clip, start: isMobile ? 'top 80%' : 'top 55%', once: true },
      });

    if (isMobile) {
      gsap.fromTo(clip, { clipPath: 'inset(12% 0% 12% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: clip, start: 'top 85%', once: true },
      });
      gsap.fromTo(inner, { scale: 1.15 }, {
        scale: 1,
        duration: 2,
        ease: 'expo.out',
        scrollTrigger: { trigger: clip, start: 'top 85%', once: true },
      });
      return;
    }

    // Entry: the frame opens from the inside edge while the image settles.
    gsap.timeline({
      scrollTrigger: { trigger: project, start: 'top bottom', end: 'center center', scrub: 1 },
    })
      .fromTo(clip,
        { clipPath: alt ? 'inset(14% 0% 14% 24%)' : 'inset(14% 24% 14% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out' }, 0)
      .fromTo(inner, { scale: 1.15 }, { scale: 1, ease: 'power2.out' }, 0);

    // Continuous drift across the full pass.
    gsap.fromTo(inner, { xPercent: -5 }, {
      xPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: project, start: 'top bottom', end: 'bottom top', scrub: true },
    });

    gsap.fromTo(title, { xPercent: alt ? 10 : -10 }, {
      xPercent: alt ? -3 : 3,
      ease: 'none',
      scrollTrigger: { trigger: project, start: 'top bottom', end: 'bottom top', scrub: true },
    });

    // Exit: the panel recedes as the next one arrives.
    gsap.to(media, {
      scale: 0.92,
      rotate: alt ? 0.6 : -0.6,
      autoAlpha: 0.35,
      ease: 'none',
      scrollTrigger: { trigger: project, start: 'bottom 75%', end: 'bottom top', scrub: true },
    });
  });
}

/* --------------------------------------------------------------------------
   Pinned case study
   -------------------------------------------------------------------------- */

const formatCount = (el, value) => {
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  el.textContent = `${el.dataset.prefix || ''}${value.toFixed(decimals)}${el.dataset.suffix || ''}`;
};

export function initCaseStudy({ pinned }) {
  const section = $('.case');
  if (!section) return;

  const stages = $$('.case__stage', section);
  const media = $('.case__media', section);
  const imgA = $('.case__img--a', section);
  const imgB = $('.case__img--b', section);
  const titleWords = $$('.case__title .w-inner', section);

  if (!pinned) {
    gsap.fromTo(titleWords, { yPercent: 115 }, {
      yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: section, start: 'top 75%', once: true },
    });
    gsap.fromTo(media, { clipPath: 'inset(10% 0% 10% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out',
      scrollTrigger: { trigger: media, start: 'top 85%', once: true },
    });
    stages.forEach((stage) => {
      gsap.fromTo($$('[data-stage-item]', stage), { yPercent: 110 }, {
        yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: stage, start: 'top 85%', once: true },
      });
    });
    return;
  }

  section.classList.add('is-pinned');

  const steps = $$('.case__steps li', section);
  const bar = $('[data-case-bar]', section);
  const counters = $$('[data-count]', section);

  // Timeline positions (seconds within the scrubbed timeline).
  const stageIn = [0.5, 1.9, 3.3, 4.7];
  const stageOut = [1.35, 2.75, 4.15, 5.6];
  const total = 6.4;
  let currentStep = 0;

  const setStep = (index) => {
    if (index === currentStep) return;
    currentStep = index;
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
  };

  gsap.set(stages, { autoAlpha: 0 });

  const tl = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=450%',
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      onUpdate: (self) => {
        const t = self.progress * total;
        setStep(t < stageIn[1] ? 0 : t < stageIn[2] ? 1 : t < stageIn[3] ? 2 : 3);
      },
    },
  });

  tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: total, ease: 'none' }, 0)
    // Overview — the frame opens around the image, the title rises
    .fromTo(media, { clipPath: 'inset(24% 20% 24% 20%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2 }, 0)
    .fromTo(imgA, { scale: 1.3 }, { scale: 1, duration: 1.6, ease: 'power2.out' }, 0)
    .fromTo(titleWords, { yPercent: 115 }, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: 'power4.out' }, 0.15)
    // Approach — image transition
    .fromTo(imgB,
      { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.2 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.3 }, stageIn[1] - 0.3)
    .to(imgA, { yPercent: -10, scale: 1.08, duration: 1.3 }, stageIn[1] - 0.3)
    // Stack — the frame narrows, imagery keeps drifting
    .to(media, { clipPath: 'inset(0% 0% 0% 22%)', duration: 1.1 }, stageIn[2] - 0.2)
    .to(imgB, { scale: 1.12, xPercent: -4, duration: stageOut[3] - stageIn[2], ease: 'none' }, stageIn[2] - 0.2)
    // Outcome — the frame settles back
    .to(media, { clipPath: 'inset(8% 0% 8% 22%)', duration: 1.1 }, stageIn[3] - 0.2)
    // Exit — wipe up into the next section
    .to(titleWords, { yPercent: -115, duration: 0.7, stagger: 0.04, ease: 'power3.in' }, stageOut[3])
    .to(media, { clipPath: 'inset(0% 0% 100% 22%)', duration: 0.9, ease: 'expo.inOut' }, stageOut[3] - 0.1)
    .to('.case__top', { autoAlpha: 0, duration: 0.5 }, stageOut[3] + 0.2);

  stages.forEach((stage, index) => {
    const items = $$('[data-stage-item]', stage);

    tl.set(stage, { autoAlpha: 1 }, stageIn[index])
      .fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: 0.75, stagger: 0.06, ease: 'power3.out' }, stageIn[index])
      .to(items, { yPercent: -110, duration: 0.45, stagger: 0.02, ease: 'power3.in' }, stageOut[index])
      .set(stage, { autoAlpha: 0 }, stageOut[index] + 0.55);
  });

  counters.forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const state = { value: 0 };
    tl.to(state, {
      value: target,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: () => formatCount(el, state.value),
    }, stageIn[3] + 0.1);
  });

  return () => section.classList.remove('is-pinned');
}

/* --------------------------------------------------------------------------
   Typographic transition — DESIGN / DEVELOPMENT / MOTION / EXPERIENCE
   -------------------------------------------------------------------------- */

export function initWordStack({ isMobile }) {
  const section = $('.words');
  if (!section) return;

  const [design, development, motion, experience] = $$('.words__item', section);
  const countEl = $('[data-words-count]', section);
  let current = 1;

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: isMobile ? '+=160%' : '+=300%',
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        const next = p < 0.14 ? 1 : p < 0.32 ? 2 : p < 0.5 ? 3 : 4;
        if (next !== current) {
          current = next;
          countEl.textContent = String(next).padStart(2, '0');
        }
      },
    },
  });

  tl
    // Enters from the right, from beyond the viewport
    .fromTo(development, { xPercent: 105 }, { xPercent: 0, duration: 1 }, 0.1)
    // Rises from beneath its mask
    .fromTo(motion.querySelectorAll('.w-inner'), { yPercent: 115, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1 }, 1.1)
    // Wipes in from the left
    .fromTo(experience,
      { clipPath: 'inset(0% 100% 0% 0%)', xPercent: -6 },
      { clipPath: 'inset(0% 0% 0% 0%)', xPercent: 0, duration: 1.1 }, 2.1)
    // Finale: two words leave the frame, two remain pinned
    .to(design, { xPercent: -110, duration: 1.2, ease: 'power2.in' }, 3.6)
    .to(development, { xPercent: 110, duration: 1.2, ease: 'power2.in' }, 3.6)
    .to(motion, { xPercent: 4, duration: 1.4, ease: 'power2.inOut' }, 3.7)
    .to(experience, {
      xPercent: -3,
      color: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
      duration: 1.4,
      ease: 'power2.inOut',
    }, 3.7)
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

export function initPageTransitions({ isMobile }) {
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
}

/* --------------------------------------------------------------------------
   Navigation state + progress
   -------------------------------------------------------------------------- */

export function initNavState() {
  const nav = $('.nav');
  const links = $$('[data-nav-link]');
  let hidden = false;

  const setActive = (key) => {
    links.forEach((link) => link.classList.toggle('is-active', link.dataset.navLink === key));
  };

  const setHidden = (hide) => {
    if (hide === hidden) return;
    hidden = hide;
    gsap.to(nav, { yPercent: hide ? -100 : 0, duration: 0.8, ease: 'expo.out', overwrite: true });
  };

  $$('[data-nav-section]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => self.isActive && setActive(section.dataset.navSection),
    });
  });

  ScrollTrigger.create({
    start: 120,
    end: 'max',
    onUpdate: (self) => setHidden(self.direction === 1),
    onLeaveBack: () => setHidden(false),
  });

  nav.addEventListener('focusin', () => setHidden(false));

  gsap.to('.progress__bar', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });

  return () => gsap.set(nav, { yPercent: 0 });
}

/* --------------------------------------------------------------------------
   Orchestration
   -------------------------------------------------------------------------- */

export function prepareText() {
  $$('[data-split]').forEach(splitWords);
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
    initProjectScroll({ isMobile });
    initTimeline();
    initCapsEntrance();
    initImageReveal();
    initPageTransitions({ isMobile });
    const cleanupNav = initNavState();

    if (!isMobile) {
      initStatement();
      initWorkHead();
      initParallax();
    }

    return () => {
      cleanupCase?.();
      cleanupNav?.();
    };
  });

  // Reduced motion: content is static and immediately visible; keep only nav state.
  mm.add(MEDIA.reduced, () => initNavState());

  return mm;
}
