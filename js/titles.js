/*
 * Project titles on the homepage.
 *
 * Colour: each title is set in its brand colour (--brand / --brand-day on the
 * article, in CSS). Projects without a brand colour stay ink.
 *
 * Overlap: where a title crosses its image, that part is drawn in white. A
 * white twin of the title sits over the original, clipped to the visible image;
 * the original is clipped to everything else. Both follow the title and image
 * as they move, only while the project is on screen.
 */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// "inset(10% 0% 28px 0%)" → [top, right, bottom, left] in px for a box of w × h.
function insetOf(value, w, h) {
  const m = /inset\(([^)]+)\)/.exec(value || '');
  if (!m) return [0, 0, 0, 0];
  const parts = m[1].trim().split(/\s+/);
  const [t, r = t, b = t, l = r] = parts;
  const px = (v, size) => (v.endsWith('%') ? (parseFloat(v) / 100) * size : parseFloat(v) || 0);
  return [px(t, h), px(r, w), px(b, h), px(l, w)];
}

// The part of an element left visible by its own inline clip-path, in screen coordinates.
function visibleRect(el) {
  const r = el.getBoundingClientRect();
  const [t, rt, b, l] = insetOf(el.style.clipPath, r.width, r.height);
  return { left: r.left + l, top: r.top + t, right: r.right - rt, bottom: r.bottom - b };
}

function intersect(a, b) {
  return {
    left: Math.max(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  };
}

const COPY = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'whiteSpace'];

function overlap({ title, layers, until }) {
  const parent = title.parentElement;
  if (!parent || !layers.length) return;

  const twin = title.cloneNode(true);
  twin.className = 'title-over';
  twin.removeAttribute('id');
  twin.removeAttribute('data-split');
  twin.removeAttribute('data-split-done');
  twin.removeAttribute('data-reveal');
  twin.removeAttribute('aria-label');
  twin.removeAttribute('style');
  twin.setAttribute('aria-hidden', 'true');
  parent.appendChild(twin);

  // Typography follows the original (it is fluid, so re-read on resize).
  const type = () => {
    const cs = getComputedStyle(title);
    COPY.forEach((k) => { twin.style[k] = cs[k]; });
  };
  type();
  window.addEventListener('resize', type, { passive: true });

  const chars = $$('.c-inner', title);
  const twinChars = $$('.c-inner', twin);
  let lastClip = '';
  let lastTwin = '';

  const sync = () => {
    // Characters animate in on reveal; the twin mirrors them.
    chars.forEach((ch, i) => {
      const tf = ch.style.transform;
      if (twinChars[i] && twinChars[i].style.transform !== tf) twinChars[i].style.transform = tf;
    });

    const t = title.getBoundingClientRect();
    const h = parent.getBoundingClientRect();
    twin.style.transform = `translate(${t.left - h.left}px, ${t.top - h.top}px)`;

    const img = layers.map(visibleRect).reduce(intersect);
    const box = intersect(img, t);
    const hit = box.right > box.left && box.bottom > box.top;

    let titleClip = '';
    let twinClip = 'inset(50% 50% 50% 50%)';
    if (hit) {
      // Local coordinates inside the title's box, padded so descenders and the mask edge never peek.
      const x1 = box.left - t.left;
      const y1 = box.top - t.top;
      const x2 = box.right - t.left;
      const y2 = box.bottom - t.top;
      const W = t.width;
      const H = t.height;
      const P = 40;
      twinClip = `inset(${y1}px ${W - x2}px ${H - y2}px ${x1}px)`;
      titleClip = `path(evenodd, "M${-P} ${-P}H${W + P}V${H + P}H${-P}Z M${x1} ${y1}H${x2}V${y2}H${x1}Z")`;
    }
    if (titleClip !== lastClip) { title.style.clipPath = titleClip; lastClip = titleClip; }
    if (twinClip !== lastTwin) { twin.style.clipPath = twinClip; lastTwin = twinClip; }
  };

  let running = false;
  const start = () => { if (!running) { running = true; window.gsap.ticker.add(sync); } };
  const stop = () => { if (running) { running = false; window.gsap.ticker.remove(sync); } };

  window.ScrollTrigger.create({
    trigger: parent,
    refreshPriority: -1,
    start: 'top bottom',
    ...(until ? { endTrigger: until, end: 'top top' } : { end: 'bottom top' }),
    onToggle: (self) => (self.isActive ? start() : stop()),
  });
  sync();
}

export function initProjectTitles() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;

  // Ganko: the pinned case sequence at the top of the work list.
  const caseEl = $('.case');
  const caseTitle = $('.case__title', caseEl || document);
  const caseMedia = $('.case__media', caseEl || document);
  if (caseEl && caseTitle && caseMedia) {
    const next = $('[data-project] .project__media');
    overlap({ title: caseTitle, layers: [caseMedia], until: next });
  }

  $$('[data-project]').forEach((project) => {
    const media = $('.project__media', project);
    const clip = $('.project__clip', project);
    const title = $('.project__title', project);
    if (!media || !clip || !title) return;
    overlap({ title, layers: [clip, media] });
  });
}
