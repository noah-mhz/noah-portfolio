/*
 * Text splitting for masked reveals. Three granularities:
 *   lines — the default for statements; each authored .line becomes its own mask
 *   words — for short headings
 *   chars — reserved for special moments (project titles, the index)
 * Markup: data-split="lines" | "words" (or empty) | "chars".
 */

const make = (tag, className, text) => {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};

/** Walks text nodes, handing each non-space token to `build` and preserving nested elements. */
function splitTokens(el, build) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          fragment.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : build(part));
        });
        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains('w-mask')) {
        walk(child);
      }
    });
  };
  walk(el);
}

export function splitLines(el) {
  const lines = el.classList.contains('line') ? [el] : el.querySelectorAll('.line');
  lines.forEach((line) => {
    const inner = make('span', 'l-inner');
    while (line.firstChild) inner.appendChild(line.firstChild);
    line.appendChild(inner);
    line.classList.add('l-mask');
  });
}

export function splitWords(el) {
  splitTokens(el, (word) => {
    const mask = make('span', 'w-mask');
    mask.appendChild(make('span', 'w-inner', word));
    return mask;
  });
}

export function splitChars(el) {
  el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
  // Each word stays an unbreakable mask; its glyphs animate inside it.
  splitTokens(el, (word) => {
    const mask = make('span', 'w-mask');
    mask.setAttribute('aria-hidden', 'true');
    [...word].forEach((char) => mask.appendChild(make('span', 'c-inner', char)));
    return mask;
  });
}

const SPLITTERS = { lines: splitLines, words: splitWords, chars: splitChars };

export function splitAll(root = document) {
  root.querySelectorAll('[data-split]').forEach((el) => {
    if (el.dataset.splitDone) return;
    (SPLITTERS[el.dataset.split] || splitWords)(el);
    el.dataset.splitDone = 'true';
  });
}

export const TEXT_TARGETS = '.l-inner, .w-inner, .c-inner';
