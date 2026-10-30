/*
 * Entry point for the 404. The page keeps its own small inline script (the
 * missing path, the clock in the footer, the hunting viewfinder); this adds
 * what every other page has: the nav clock, the theme switch, the cursor,
 * the project form, magnetic buttons, touch feedback, and the weight-on-hover
 * headline ("Out of frame.").
 */
import { initCursor, initMagnetic, initClock, initHeroWeight } from './interactions.js';
import { initTheme } from './theme.js';
import { initContactForm } from './contact.js';
import { initTouchFx } from './touch.js';
import { wrapChars } from './split.js';

function boot() {
  initClock();
  initTheme();
  const title = document.querySelector('.nf-title[data-weight]');
  if (title) wrapChars(title);

  const { gsap, ScrollTrigger } = window;
  if (!gsap) return;
  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  initCursor();
  initMagnetic();
  initHeroWeight();
  initContactForm();
  initTouchFx({ home: false });
}

boot();
