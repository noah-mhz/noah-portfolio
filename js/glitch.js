/*
 * Colophon: the homepage glitches into the 404. The address scrambles to a
 * missing page, the screen jitters, slices of the 404 tear across it with
 * mint and white ghosts, then it settles — and the real 404 takes over,
 * live, inside the frame. Plays once in view; "Break it again" replays it.
 */
import { scramble } from './scramble.js';

const $ = (selector, root = document) => root.querySelector(selector);

const HOME = 'noah-portfolio.pages.dev';
const MISSING = 'noah-portfolio.pages.dev/this-page-does-not-exist';
const SLICES = 7;

export function initGlitch({ gsap, ScrollTrigger }) {
  const root = $('[data-glitch]');
  if (!root) return;
  const view = $('[data-glitch-view]', root);
  const a = $('[data-glitch-a]', root);
  const b = $('[data-glitch-b]', root);
  const live = $('[data-glitch-live]', root);
  const url = $('[data-glitch-url]', root);
  const replay = $('[data-glitch-replay]', root);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The live 404 is drawn at desktop size and scaled to fit the frame.
  const fit = () => { live.style.transform = `scale(${view.clientWidth / 1440})`; };
  fit();
  window.addEventListener('resize', fit);
  const loadLive = () => { if (!live.src) live.src = live.dataset.src; };

  if (reduce || !gsap) {
    // Still version: the 404, no tearing.
    replay.hidden = true;
    return;
  }

  // Torn slices and two colour ghosts, all painted from the 404 screenshot.
  const src = `url("${b.currentSrc || b.src}")`;
  const make = (cls) => { const el = document.createElement('span'); el.className = cls; el.style.backgroundImage = src; el.setAttribute('aria-hidden', 'true'); view.insertBefore(el, live); return el; };
  const slices = Array.from({ length: SLICES }, () => make('colo-glitch__slice'));
  const ghosts = [make('colo-glitch__ghost colo-glitch__ghost--mint'), make('colo-glitch__ghost colo-glitch__ghost--white')];
  const band = () => { const top = gsap.utils.random(0, 88); return `inset(${top}% 0% ${Math.max(0, 100 - top - gsap.utils.random(3, 14))}% 0%)`; };

  const wide = () => { const top = gsap.utils.random(0, 70); return `inset(${top}% 0% ${Math.max(0, 100 - top - gsap.utils.random(14, 30))}% 0%)`; };

  const reset = () => {
    gsap.killTweensOf([a, b, live, ...slices, ...ghosts, view]);
    gsap.set(a, { autoAlpha: 1, x: 0 });
    gsap.set(b, { autoAlpha: 0 });
    gsap.set(live, { autoAlpha: 0 });
    gsap.set([...slices, ...ghosts], { autoAlpha: 0, x: 0 });
    url.textContent = HOME;
  };

  let tl = null;
  const play = () => {
    tl?.kill();
    reset();
    loadLive();
    tl = gsap.timeline();
    tl.add(() => { url.textContent = MISSING; scramble(url, { duration: 0.5 }); }, 0.15);
    // The page twitches first…
    tl.to(a, { x: 6, duration: 0.05, repeat: 5, yoyo: true, ease: 'steps(1)' }, 0.3);
    // …then tears: a few bursts of random bands.
    for (let k = 0; k < 5; k += 1) {
      tl.add(() => {
        slices.forEach((s) => gsap.set(s, { clipPath: band(), x: gsap.utils.random(-70, 70), autoAlpha: Math.random() > 0.35 ? 1 : 0 }));
        // Colour ghosts only bleed through wide bands, never the whole frame.
        gsap.set(ghosts[0], { clipPath: wide(), x: gsap.utils.random(-12, -4), autoAlpha: 0.45 });
        gsap.set(ghosts[1], { clipPath: wide(), x: gsap.utils.random(4, 12), autoAlpha: 0.3 });
        gsap.set(a, { autoAlpha: k % 2 ? 0.35 : 1 });
      }, 0.55 + k * 0.11);
    }
    // Settle on the 404, then hand over to the live page.
    tl.add(() => {
      gsap.set(slices, { autoAlpha: 0, x: 0 });
      gsap.set(a, { autoAlpha: 0 });
      gsap.set(b, { autoAlpha: 1 });
    }, 1.12)
      .to(ghosts, { x: 0, autoAlpha: 0, duration: 0.35, ease: 'power2.out' }, 1.12)
      .fromTo(view, { scale: 1.015 }, { scale: 1, duration: 0.5, ease: 'expo.out' }, 1.12)
      .to(live, { autoAlpha: 1, duration: 0.6, ease: 'power1.out' }, 1.6);
  };

  reset();
  ScrollTrigger.create({ trigger: root, start: 'top 65%', once: true, onEnter: play });
  replay.addEventListener('click', play);
}
