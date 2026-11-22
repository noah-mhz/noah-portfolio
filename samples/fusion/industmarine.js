/* Industmarine case study: the screens gallery (showcase arrangements + backstage index and detail). */
addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && window.Lenis) { const l = new Lenis({ lerp: .09 }); window.lenis = l; const raf = (t) => { l.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }

  const IMG = '../../assets/images/industmarine-';
  const S = [
    ['hero', 'Homepage', 'Slider + featured product', 'The hero steps through the mission and the three competencies, and the featured product changes with each slide.'],
    ['threes', 'About', 'Three of everything', 'One 3 stays put while the words around it change: business divisions, focused competencies, key geographies.'],
    ['sectors', 'Industries', 'Activity by sector', 'The split bar fills segment by segment as the shares count up: maritime, offshore, industrial and civil.'],
    ['offshore', 'Offshore', 'Technical drawings', 'Each sector has its own elevation with dimension lines, plotted at its real stroke length as it scrolls in.'],
    ['lifecycle', 'Services', 'Eight services, one life cycle', 'A blue rule runs from cell to cell, then each service’s drawing plots.'],
    ['catalogue', 'Products', 'Filter by competency or principal', 'Twenty products on one page. Any option that would return nothing is switched off.'],
    ['drawer', 'Product details', 'The drawer', 'The panel unfolds band by band while the photo flies in from its card. Products can also be opened from a link.'],
    ['channels', 'Contact', 'Ways to reach us', 'Head office, phone, fax and email, each with its own drawing.'],
    ['menu', 'Menu', 'Grid overlay', 'The menu draws its grid lines, a curtain wipes across, and the links arrive one after another.'],
  ];
  const thumbs = S.map(([f]) => IMG + f + '.webp');
  const items = S.map(([f, title, sub, text], i) => ({
    src: IMG + f + '.webp', title, sub, text,
    rows: [['Screen', `${String(i + 1).padStart(2, '0')} / ${String(S.length).padStart(2, '0')}`], ['Built in', 'Elementor + custom HTML']],
    href: 'https://industmarine.com', cta: 'Visit industmarine.com',
    thumbs: [thumbs[i], ...thumbs.filter((_, k) => k !== i)],
  }));

  const idx = $('[data-idx]'), cap = $('[data-caption]'), count = $('[data-count]');
  idx.innerHTML = items.map((it, i) => `<li><button type="button" data-go="${i}"><span>${String(i + 1).padStart(2, '0')}</span><span class="nm">${it.title}</span><span>${it.sub}</span></button></li>`).join('');
  const onActive = (i) => {
    $$('[data-go]', idx).forEach((b, k) => { b.classList.toggle('is-current', k === i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    cap.innerHTML = `<p class="mono" style="color:var(--teal);margin:0 0 .5rem">${items[i].sub}</p><h3>${items[i].title}</h3><p>${items[i].text}</p>`;
    count.textContent = `${i + 1} / ${items.length}`;
    if (!reduce && window.gsap) gsap.fromTo(cap.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .04, ease: 'power3.out' });
  };
  const g = Gallery($('[data-stage]'), { items, arrange: 'coverflow', onActive });
  $$('[data-go]', idx).forEach((b) => b.addEventListener('click', () => { g.go(+b.dataset.go); if (g.mode === 'grid') g.open(+b.dataset.go); }));
  $$('[data-seg] button').forEach((b) => b.addEventListener('click', () => {
    $$('[data-seg] button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    g.arrange(b.dataset.arr);
  }));

  // Page intro: title rises, the rest follows.
  if (!reduce && window.gsap) {
    gsap.from('.head h1', { yPercent: 40, opacity: 0, duration: 1.1, ease: 'expo.out' });
    gsap.from('.head > :not(h1)', { y: 24, opacity: 0, duration: .9, stagger: .06, ease: 'power3.out', delay: .15 });
  }
});
