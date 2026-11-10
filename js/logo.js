/*
 * The wordmark ("noah" + a square full stop) in the nav.
 *
 * 1  On load the letters rise and the full stop settles (CSS; on the homepage
 *    `.is-in` releases it when the intro clears).
 * 2  Scrolling down folds it to "n.": o-a-h slide away behind the n and the
 *    square glides in after it. Back near the top it opens again.
 * 3  Mouse only: hovering the folded mark (or focusing it) opens it.
 * 4  Switching theme, the square wipes from the old accent to the new one.
 * 5  The slow cursor blink lives on the intro card only (CSS).
 * Reduced motion: a static "noah.", no folding.
 */
const FOLD_AT = 120; // px scrolled before the mark folds

export function releaseLogo() {
  document.querySelectorAll('[data-logo]').forEach((el) => el.classList.add('is-in'));
}

export function initLogo() {
  const { gsap } = window;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const logos = [...document.querySelectorAll('[data-logo]')];

  initDotWipe(gsap, reduce);
  if (!gsap || reduce || !logos.length) return;

  logos.forEach((logo) => {
    const rest = logo.querySelector('.logo__rest');
    const inner = logo.querySelector('.logo__restin');
    if (!rest || !inner) return;

    let folded = false;
    let held = false; // opened by hover / focus while folded

    const set = (fold, instant = false) => {
      const width = inner.getBoundingClientRect().width;
      const duration = instant ? 0 : fold ? 0.8 : 0.9;
      gsap.to(rest, { width: fold ? 0 : width, duration, ease: 'expo.inOut', overwrite: true,
        onComplete: () => { if (!fold) gsap.set(rest, { clearProps: 'width' }); } });
      gsap.to(inner, { x: fold ? -width : 0, duration, ease: 'expo.inOut', overwrite: true });
    };

    const shouldFold = () => window.scrollY > FOLD_AT && !held;
    const sync = () => {
      const next = shouldFold();
      if (next === folded) return;
      folded = next;
      set(folded);
    };

    let queued = 0;
    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = requestAnimationFrame(() => { queued = 0; sync(); });
    }, { passive: true });

    // Restored mid-page (reload, back/forward): start folded, without the move.
    if (shouldFold()) { folded = true; set(true, true); }

    const hold = (on) => { held = on; sync(); };
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      logo.addEventListener('pointerenter', () => hold(true));
      logo.addEventListener('pointerleave', () => hold(false));
    }
    logo.addEventListener('focus', () => { if (logo.matches(':focus-visible')) hold(true); });
    logo.addEventListener('blur', () => hold(false));

    // The folded width depends on the font; re-measure when it changes.
    window.addEventListener('resize', () => { if (!folded) gsap.set(rest, { clearProps: 'width' }); });
  });
}

/* 4 — theme.js announces the switch before and after; every square on the page
   holds the old colour, then the new one wipes up from the bottom. */
function initDotWipe(gsap, reduce) {
  if (!gsap || reduce) return;
  let dots = [];
  document.addEventListener('theme:before', () => {
    dots = [...document.querySelectorAll('.logo__dot')].filter((dot) => dot.firstElementChild);
    dots.forEach((dot) => {
      const layer = dot.firstElementChild;
      gsap.killTweensOf(layer);
      dot.style.background = getComputedStyle(layer).backgroundColor;
      gsap.set(layer, { clipPath: 'inset(100% 0% 0% 0%)' });
    });
  });
  document.addEventListener('theme:after', () => {
    dots.forEach((dot, i) => {
      gsap.to(dot.firstElementChild, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, delay: i * 0.05, ease: 'expo.inOut',
        onComplete: () => { dot.style.background = ''; gsap.set(dot.firstElementChild, { clearProps: 'clipPath' }); },
      });
    });
  });
}
