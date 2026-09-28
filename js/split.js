/**
 * Wraps every word inside `el` in a mask/inner pair so it can rise from
 * beneath its own baseline. Nested elements (e.g. <em>, <sup>) are preserved.
 */
export function splitWords(el) {
  if (el.dataset.splitDone) return el.querySelectorAll('.w-inner');

  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();

        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(' '));
            return;
          }
          const mask = document.createElement('span');
          const inner = document.createElement('span');
          mask.className = 'w-mask';
          inner.className = 'w-inner';
          inner.textContent = part;
          mask.appendChild(inner);
          fragment.appendChild(mask);
        });

        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains('w-mask')) {
        walk(child);
      }
    });
  };

  walk(el);
  el.dataset.splitDone = 'true';
  return el.querySelectorAll('.w-inner');
}

export function splitAll(root = document) {
  root.querySelectorAll('[data-split]').forEach(splitWords);
}
