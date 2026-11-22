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
