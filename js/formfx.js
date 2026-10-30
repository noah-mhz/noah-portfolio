/*
 * Project form details.
 *
 *   Choices    — the native dropdowns are replaced by the site's own list (the
 *                browser's pop-up can't be styled or take the dot cursor). The
 *                real <select> stays in the form, hidden, so submitting and
 *                validation are unchanged. Options rise out of masks, the
 *                hovered one is framed, and the chosen word scrambles in.
 *   Placeholders — "your name" etc. slide up and fade as a field takes focus.
 *   Errors     — an invalid field's underline turns red and shakes once.
 */
import { scramble } from './scramble.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let uid = 0;

function enhanceSelect(field, closeOthers) {
  const select = $('select', field);
  if (!select || field.dataset.enhanced) return null;
  field.dataset.enhanced = 'true';
  const { gsap } = window;
  const id = `pf-list-${uid += 1}`;
  const name = $('.sr-only', field)?.textContent.trim() || select.name;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pf__pick';
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', id);
  button.innerHTML = `<span class="pf__pick-text"></span><i class="pf__pick-caret" aria-hidden="true"></i>`;
  const text = $('.pf__pick-text', button);

  const list = document.createElement('ul');
  list.className = 'pf__list';
  list.id = id;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', name);
  list.tabIndex = -1;
  list.hidden = true;
  const options = [...select.options].map((option, i) => {
    const li = document.createElement('li');
    li.className = 'pf__opt';
    li.id = `${id}-${i}`;
    li.setAttribute('role', 'option');
    li.dataset.value = option.value;
    li.innerHTML = `<span class="pf__opt-mask"><span class="pf__opt-text">${option.textContent}</span></span><span class="marks" aria-hidden="true"></span>`;
    list.appendChild(li);
    return li;
  });

  select.hidden = true;
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  select.after(button);
  field.appendChild(list);

  let active = select.selectedIndex;
  let isOpen = false;

  const paint = () => {
    text.textContent = select.options[select.selectedIndex]?.textContent || '';
    options.forEach((li, i) => li.setAttribute('aria-selected', String(i === select.selectedIndex)));
  };
  const highlight = (index) => {
    active = (index + options.length) % options.length;
    options.forEach((li, i) => li.classList.toggle('is-active', i === active));
    list.setAttribute('aria-activedescendant', options[active].id);
  };

  const open = () => {
    if (isOpen) return;
    closeOthers(field);
    isOpen = true;
    field.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
    list.hidden = false;
    // Near the right edge (phones), the list hangs from the field's right side instead.
    list.style.left = '';
    list.style.right = '';
    if (list.getBoundingClientRect().right > window.innerWidth - 8) { list.style.left = 'auto'; list.style.right = '0'; }
    highlight(select.selectedIndex);
    list.focus({ preventScroll: true });
    if (!gsap || reduce()) return;
    gsap.killTweensOf([list, ...$$('.pf__opt-text', list)]);
    gsap.fromTo(list, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'expo.out' });
    gsap.fromTo($$('.pf__opt-text', list), { yPercent: 110 }, { yPercent: 0, duration: 0.7, stagger: 0.045, ease: 'expo.out', delay: 0.05 });
  };

  const close = (focusButton = true) => {
    if (!isOpen) return;
    isOpen = false;
    field.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    const done = () => { list.hidden = true; };
    if (focusButton) button.focus({ preventScroll: true });
    if (!gsap || reduce()) { done(); return; }
    gsap.killTweensOf(list);
    gsap.to(list, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.35, ease: 'power3.in', onComplete: done });
  };

  const choose = (index) => {
    const changed = index !== select.selectedIndex;
    select.selectedIndex = index;
    paint();
    close();
    if (changed) {
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      scramble(text, { duration: 0.5 });
    }
  };

  button.addEventListener('click', () => (isOpen ? close() : open()));
  button.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); open(); }
  });
  options.forEach((li, i) => {
    li.addEventListener('pointerenter', () => highlight(i));
    li.addEventListener('click', () => choose(i));
  });
  list.addEventListener('keydown', (event) => {
    const keys = {
      ArrowDown: () => highlight(active + 1),
      ArrowUp: () => highlight(active - 1),
      Home: () => highlight(0),
      End: () => highlight(options.length - 1),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Escape: () => close(),
      Tab: () => close(false),
    };
    if (!keys[event.key]) return;
    if (event.key !== 'Tab') event.preventDefault();
    // Escape closes the list, not the whole form.
    event.stopPropagation();
    keys[event.key]();
  });

  paint();
  field.closest('form')?.addEventListener('pf:reset', paint);
  return { field, close, contains: (node) => field.contains(node) };
}

function enhancePlaceholder(field) {
  const input = $('input', field);
  if (!input || !input.placeholder || field.dataset.ph) return;
  field.dataset.ph = 'true';
  const ph = document.createElement('span');
  ph.className = 'pf__ph';
  ph.setAttribute('aria-hidden', 'true');
  ph.textContent = input.placeholder;
  input.placeholder = '';
  input.after(ph);
  const sync = () => field.classList.toggle('has-value', input.value.length > 0);
  ['input', 'change', 'blur'].forEach((type) => input.addEventListener(type, sync));
  setTimeout(sync, 600); // after any browser autofill
  field.closest('form')?.addEventListener('pf:reset', sync);
  sync();
}

export function initFormFx(root) {
  if (!root) return;
  const pickers = [];
  const closeOthers = (keep) => pickers.forEach((p) => { if (p.field !== keep) p.close(false); });
  $$('.pf__field--select', root).forEach((field) => {
    const picker = enhanceSelect(field, closeOthers);
    if (picker) pickers.push(picker);
  });
  $$('.pf__field:not(.pf__field--select)', root).forEach(enhancePlaceholder);

  // A click anywhere else closes an open list.
  document.addEventListener('pointerdown', (event) => {
    pickers.forEach((p) => { if (!p.contains(event.target)) p.close(false); });
  });
}

/** Replays the shake on fields that are still invalid after another try. */
export function flagInvalid(fields) {
  fields.forEach((field) => {
    field.classList.remove('is-shaking');
    void field.offsetWidth; // restart the animation
    field.classList.add('is-shaking');
  });
}
