/*
 * Theme switch with a blinds curtain (after Motion's curtains "blinds" preset):
 * horizontal slats in the incoming theme's ground scale shut from the top,
 * the theme swaps while the screen is covered, then the slats open downward.
 * Reduced motion swaps instantly. Shared by every fusion page.
 */
(() => {
  const root = document.documentElement;
  const GROUND = { light: '#F8DBC1', dark: '#0E1718' };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let busy = false;

  const apply = (t) => {
    root.dataset.theme = t;
    try { localStorage.setItem('noah-theme', t); } catch (e) {}
    sync();
  };
  const sync = () => {
    const dark = root.dataset.theme === 'dark';
    document.querySelectorAll('[data-theme-switch]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(dark));
      const label = btn.querySelector('.theme__label');
      if (label) label.textContent = dark ? 'Dark' : 'Light';
    });
  };

  const blinds = (next, done) => {
    const size = innerWidth < 600 ? 48 : 64;
    const count = Math.ceil(innerHeight / size) + 1;
    const wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;display:flex;flex-direction:column';
    const slats = Array.from({ length: count }, () => {
      const s = document.createElement('i');
      s.style.cssText = `display:block;flex:none;height:${size + 1}px;background:${GROUND[next]};transform:scaleY(0);transform-origin:50% 0`;
      wrap.append(s);
      return s;
    });
    document.body.append(wrap);
    const g = window.gsap;
    g.timeline({ onComplete: () => { wrap.remove(); done(); } })
      .to(slats, { scaleY: 1, duration: .42, ease: 'power3.in', stagger: { each: .018, from: 'start' } })
      .add(() => apply(next))
      .set(slats, { transformOrigin: '50% 100%' })
      .to(slats, { scaleY: 0, duration: .55, ease: 'power3.out', stagger: { each: .018, from: 'start' } }, '+=.06');
  };

  addEventListener('DOMContentLoaded', () => {
    sync();
    document.querySelectorAll('[data-theme-switch]').forEach((btn) => btn.addEventListener('click', () => {
      if (busy) return;
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      if (reduce || !window.gsap) { apply(next); return; }
      busy = true;
      blinds(next, () => { busy = false; });
    }));
  });
})();

/* Inner-page footer: the "Start a project" card slides up as it scrolls into view (scrubbed with the scroll, so it
   always sits flush at the bottom of the page), then the words rise out of a mask and the full stop drops in.
   The card is revealed with clip-path, so nothing moves in layout and the page never grows. Reduced motion: static. */
(() => {
  const f = document.querySelector('footer.next');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const big = f.querySelector('a.big');
  if (big && !big.querySelector('.nx-w')) {
    const txt = [...big.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    big.setAttribute('aria-label', txt);
    [...big.childNodes].filter((n) => n.nodeType === 3).forEach((n) => n.remove());
    const words = txt.split(/\s+/).map((w, i) => `<span class="nx-w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
    big.insertAdjacentHTML('afterbegin', `<span class="nx-ws">${words}</span>`);   // one flex item, so word spacing stays a normal space
    const sq = big.querySelector(':scope > i'); if (sq) big.querySelector('.nx-ws').append(sq);   // the full stop follows the last word, even when the title wraps
  }
  f.classList.add('nx');
  // Where the browser has CSS scroll-driven animations, the card's rise runs in CSS on a view() timeline
  // (css/site.css, .nx-sd) and JS only marks the moment the words come in. Elsewhere the scroll handler below does it.
  if (window.CSS && CSS.supports('animation-timeline: view()')) {
    f.classList.add('nx-sd');
    new IntersectionObserver((es, io) => { if (es[0].intersectionRatio >= .45 || es[0].intersectionRect.height > innerHeight * .36) { f.classList.add('is-in'); io.disconnect(); } }, { threshold: [0, .2, .45, .6] }).observe(f);
    return;
  }
  let top = 0, h = 1, q = 0, shown = false;
  const measure = () => { const r = f.getBoundingClientRect(); top = r.top + scrollY; h = r.height; };
  const tick = () => {
    q = 0;
    const p = Math.max(0, Math.min(1, (scrollY + innerHeight - top) / Math.min(h, innerHeight * .8)));
    f.style.setProperty('--nx', p.toFixed(4));
    if (!shown && p > .45) { shown = true; f.classList.add('is-in'); }
  };
  measure(); tick();
  addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(tick); }, { passive: true });
  addEventListener('resize', () => { measure(); tick(); });
  addEventListener('load', () => { measure(); tick(); });
  if (window.ResizeObserver) new ResizeObserver(() => { measure(); tick(); }).observe(document.body);
})();
