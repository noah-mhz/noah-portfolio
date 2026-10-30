/*
 * Page transition between the homepage and the case studies.
 *
 * Leave (homepage): clicking any link into /work/<project>/ expands that
 * project's image from where it sits to fill the screen, then navigates.
 * Enter (case study): the same image arrives full-screen and settles into
 * the case study's hero frame, so the visitor lands "inside" the project.
 *
 * The image travels through sessionStorage; a tiny inline script in each
 * case page's <head> paints it on the very first frame (html.pt-enter).
 * Reduced motion, modified clicks and new-tab links are left alone.
 */
import { getLenis } from './scroll.js';

const KEY = 'pt:image';
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const insetOf = (r) => `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px)`;

function overlay(src) {
  const el = document.createElement('div');
  el.className = 'pt';
  el.setAttribute('aria-hidden', 'true');
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    el.appendChild(img);
  }
  document.body.appendChild(el);
  return el;
}

/** Where the transition starts from, and which picture travels. */
function sourceFor(link) {
  if (link.classList.contains('hero__reel')) {
    const video = link.querySelector('video');
    return { el: link, src: video?.getAttribute('poster') };
  }
  // Next project: its preview frame grows into the next page.
  const peek = link.querySelector('.study-next__peek');
  if (peek && peek.getBoundingClientRect().height) {
    const img = peek.querySelector('img');
    return { el: peek, src: img?.currentSrc || img?.src || '' };
  }
  const caseEl = link.closest('.case');
  if (caseEl) {
    const media = caseEl.querySelector('.case__media');
    const img = media?.querySelector('img');
    return { el: media, src: img?.currentSrc || img?.src };
  }
  const project = link.closest('[data-project]');
  if (project) {
    const clip = project.querySelector('.project__clip');
    const img = project.querySelector('img.project__img');
    return { el: clip, src: img?.currentSrc || img?.src || '' };
  }
  return null;
}

export function initPageLeave() {
  const { gsap } = window;

  // Coming back with the browser's Back button: clear any overlay left behind.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) document.querySelectorAll('.pt').forEach((el) => el.remove());
  });

  if (!gsap || reduce()) return;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !/\/(work\/[^/]+|colophon)\/?$/.test(url.pathname)) return;

    const source = sourceFor(link);
    if (!source?.el) return;

    event.preventDefault();
    const rect = source.el.getBoundingClientRect();
    const layer = overlay(source.src);
    const img = layer.querySelector('img');

    try { sessionStorage.setItem(KEY, source.src || ''); } catch { /* private mode: no hand-off, still navigates */ }

    getLenis()?.stop();
    gsap.timeline({ onComplete: () => { window.location.href = url.href; } })
      .fromTo(layer, { clipPath: insetOf(rect) }, { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.85, ease: 'expo.inOut' }, 0)
      .fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1, ease: 'expo.out' }, 0);
  });
}

export function initPageEnter() {
  const root = document.documentElement;
  let src = null;
  try { src = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  const done = () => root.classList.remove('pt-enter');

  const { gsap } = window;
  const target = document.querySelector('[data-hero-media] .frame') || document.querySelector('[data-hero-media]');
  if (src === null || !gsap || reduce() || !target) { done(); return; }

  // Take over from the first-frame placeholder painted by the inline script.
  const layer = overlay(src);
  done();

  const settle = () => {
    const rect = target.getBoundingClientRect();
    gsap.timeline({ delay: 0.1, onComplete: () => layer.remove() })
      .to(layer, { clipPath: insetOf(rect), duration: 1.05, ease: 'expo.inOut' }, 0)
      .to(layer, { autoAlpha: 0, duration: 0.45, ease: 'power1.out' }, 0.75);
  };
  // Settle once layout is final (fonts in), but never keep the visitor waiting.
  const ready = Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((r) => { setTimeout(r, 600); })]);
  ready.then(() => requestAnimationFrame(() => requestAnimationFrame(settle)));
}
