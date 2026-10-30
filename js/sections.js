/*
 * Getting around a long page without losing anything on it.
 *
 *   Ticks  — the progress bar carries a tick per section. Hover one to see the
 *            section's name, click it to jump there.
 *   Rail   — desktop: a slim index in the left margin, one dash per section.
 *            The current one is lit; hover the rail to read the names; click to jump.
 *   Menu   — tablet & phone: opening the nav's section button also lists the
 *            page's sections under the bar.
 */
import { getLenis } from './scroll.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function collect() {
  const sections = [];
  let last = '';
  $$('[data-nav-section][data-nav-label]').forEach((el) => {
    const label = el.dataset.navLabel;
    if (!label || label === last) return;
    last = label;
    sections.push({ el, label });
  });
  return sections;
}

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function jump(el) {
  const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
  const y = el.getBoundingClientRect().top + window.scrollY - nav - 8;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: y, behavior: reduce() ? 'auto' : 'smooth' });
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

export function initSectionIndex({ ScrollTrigger } = {}) {
  const sections = collect();
  if (sections.length < 2) return;

  /* ---------- Ticks on the progress bar ---------- */
  const bar = $('.progress');
  const ticks = bar ? sections.map(({ el, label }) => {
    const tick = document.createElement('button');
    tick.type = 'button';
    tick.className = 'progress__tick';
    tick.setAttribute('aria-label', `Jump to ${label}`);
    tick.tabIndex = -1; // the rail and menu carry keyboard access; the bar is a pointer shortcut
    tick.innerHTML = `<span class="progress__tip label">${label}</span>`;
    tick.addEventListener('click', () => jump(el));
    bar.appendChild(tick);
    return tick;
  }) : [];
  bar?.classList.add('has-ticks');

  /* ---------- Rail (desktop) ---------- */
  const rail = document.createElement('nav');
  rail.className = 'section-rail';
  rail.setAttribute('aria-label', 'On this page');
  rail.innerHTML = `<p class="section-rail__title label">On this page</p><ol>${sections.map(({ label }, i) => `<li><a href="#" data-i="${i}"><i aria-hidden="true"></i><span class="label">${label}</span></a></li>`).join('')}</ol>`;
  document.body.appendChild(rail);
  const railLinks = $$('a', rail);

  /* ---------- Menu list (tablet & phone) ---------- */
  const menu = document.createElement('nav');
  menu.className = 'section-menu';
  menu.setAttribute('aria-label', 'On this page');
  menu.innerHTML = `<p class="section-menu__title label">On this page</p><ol>${sections.map(({ label }, i) => `<li><a href="#" data-i="${i}">${label}</a></li>`).join('')}</ol>`;
  document.body.appendChild(menu);
  const menuLinks = $$('a', menu);

  const right = $('[data-nav]');
  const status = $('[data-nav-status]');
  const syncMenu = () => menu.classList.toggle('is-open', !!right?.classList.contains('is-open') && !!right?.classList.contains('has-status'));
  if (right) new MutationObserver(syncMenu).observe(right, { attributes: true, attributeFilter: ['class'] });

  [...railLinks, ...menuLinks].forEach((a) => a.addEventListener('click', (event) => {
    event.preventDefault();
    const target = sections[Number(a.dataset.i)].el;
    if (a.closest('.section-menu') && right?.classList.contains('is-open')) status?.click();
    jump(target);
  }));

  /* ---------- Positions & the current section ---------- */
  let marks = [];
  let current = -1;

  const place = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    marks = sections.map(({ el }) => Math.min(1, Math.max(0, (el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5) / max)));
    ticks.forEach((tick, i) => { tick.style.left = `${marks[i] * 100}%`; });
    update();
  };

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    ticks.forEach((tick, i) => tick.classList.toggle('is-passed', p >= marks[i] - 0.001));
    let index = -1;
    marks.forEach((m, i) => { if (p >= m - 0.001) index = i; });
    rail.classList.toggle('is-visible', index >= 0 && p < 0.985);
    if (index === current) return;
    current = index;
    [railLinks, menuLinks].forEach((links) => links.forEach((a, i) => {
      a.classList.toggle('is-current', i === index);
      if (i === index) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }));
  };

  place();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', place, { passive: true });
  ScrollTrigger?.addEventListener('refresh', place);
}
