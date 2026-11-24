/* The period as a portal: any a.dotp is a heading's full stop that leads somewhere (see the end of css/base.css).
   This adds the bleed layers and the shared ink filter once, and on click floods the screen with the colour before
   following the link. Links with data-pf-open (the project form) bloom and open the form without leaving. */
(() => {
  const dots = [...document.querySelectorAll('a.dotp')];
  if (!dots.length) return;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One filter for every bloom: fractal noise displaces the edge so it frays like ink in paper fibres.
  // Units are the element's own box, so the frayed edge looks the same at any heading size.
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML = '<filter id="dotp-ink" x="-25%" y="-25%" width="150%" height="150%" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">'
    + '<feTurbulence type="fractalNoise" baseFrequency="3.2" numOctaves="3" seed="7" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale=".22" xChannelSelector="R" yChannelSelector="G" result="d"/>'
    + '<feGaussianBlur in="d" stdDeviation=".004"/></filter>'
    // the tide-line: a thinner, more broken edge, so it reads as a stain margin and never as a ripple ring
    + '<filter id="dotp-tide" x="-25%" y="-25%" width="150%" height="150%" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">'
    + '<feTurbulence type="fractalNoise" baseFrequency="7" numOctaves="3" seed="2" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale=".14" xChannelSelector="G" yChannelSelector="R"/></filter>';
  document.body.append(svg);

  dots.forEach((d) => {
    if (!d.querySelector('.dotp__sq')) d.insertAdjacentHTML('afterbegin', '<span class="dotp__sq" aria-hidden="true"></span>');
    d.insertAdjacentHTML('beforeend', '<span class="dotp__bleed" aria-hidden="true"><i class="b3"></i><i class="b1"></i><i class="b2"></i></span>');
    d.addEventListener('click', (e) => {
      if (REDUCE || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
      const sq = d.querySelector('.dotp__sq').getBoundingClientRect(), cx = sq.left + sq.width / 2, cy = sq.top + sq.height / 2;
      const s = 60, k = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) * 2.6 / s;
      const b = document.createElement('div'); b.className = 'dotp-burst';
      b.style.cssText = `left:${cx - s / 2}px;top:${cy - s / 2}px;width:${s}px;height:${s}px;--bleed:${getComputedStyle(d).getPropertyValue('--bleed')}`;
      document.body.append(b);
      const form = d.hasAttribute('data-pf-open');
      if (form) { // bloom through the screen while the form opens, then let it go
        b.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: `scale(${k * .8})`, opacity: .85, offset: .55 }, { transform: `scale(${k})`, opacity: 0 }], { duration: 640, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished.then(() => b.remove());
        setTimeout(() => b.remove(), 1000); return;
      }
      b.animate([{ transform: 'scale(.2)' }, { transform: `scale(${k})` }], { duration: 460, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
      e.preventDefault();
      const go = () => { location.href = d.href; };
      setTimeout(go, 340); // leave as the colour reaches the edges; the page keeps the flood until the next one paints
      setTimeout(() => b.remove(), 2500);
    });
  });
  // Back from the next page (bfcache): never come back to a flooded screen.
  addEventListener('pageshow', (e) => { if (e.persisted) document.querySelectorAll('.dotp-burst').forEach((b) => b.remove()); });
})();
