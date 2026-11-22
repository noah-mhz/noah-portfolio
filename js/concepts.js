/* Concepts: the archive gallery (staircase lookbook ↔ indexed list) with a detail view per concept. */
addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && window.Lenis) { const l = new Lenis({ lerp: .09 }); window.lenis = l; const raf = (t) => { l.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }

  const IMG = '/assets/images/', C = '/concepts/';
  const LIVE = 'https://noah-portfolio.pages.dev/concepts/';
  const items = [
    { src: IMG + 'concept-pixel-pull-cover.webp', title: 'Pixel Pull', sub: '01 · Card shop',
      text: 'A trading card store’s homepage, proposed as a future Shopify Online Store 2.0 build. The pitch carried a design note on every section.',
      rows: [['Type', 'Anton, Inter, Silkscreen'], ['Platform', 'Planned for Shopify 2.0'], ['Built', 'Grid, filters, bag drawer']],
      href: LIVE + 'pixel-pull/', cta: 'Open the concept',
      thumbs: ['concept-pixel-pull-cover', 'concept-pp2-hero', 'concept-pp2-categories', 'concept-pp2-products', 'concept-pp2-campaigns', 'concept-pp2-events', 'concept-pp2-about', 'concept-pp2-store', 'concept-pp2-social'].map((f) => IMG + f + '.webp') },
    { src: IMG + 'concept-little-rosti-poster.webp', title: 'Little Rösti', sub: '02 · Café',
      text: 'A rösti café’s homepage. Every word, price and image lives in one content file, so the owner’s updates never touch the layout.',
      rows: [['Content', 'One file'], ['Built from', 'Data'], ['Motion', 'GSAP + ScrollTrigger']],
      href: LIVE + 'little-rosti/', cta: 'Open the concept',
      thumbs: [IMG + 'concept-little-rosti-poster.webp', ...['hero', 'picks', 'process', 's1', 's2', 's3', 's4', 'promo'].map((f) => C + 'little-rosti/assets/images/' + f + '.webp')] },
    { src: IMG + 'concept-common-table-cover.webp', title: 'Common Table', sub: '03 · Restaurant',
      text: 'A restaurant homepage built around the venue’s handwritten, hand-drawn identity: an editorial serif, handwritten accents and a palette taken from the room.',
      rows: [['Hero', 'Two-photo collage'], ['Menu', 'Tabs, hand-lettered'], ['Content', 'One object, CMS-ready']],
      href: LIVE + 'common-table/', cta: 'Open the concept',
      thumbs: [IMG + 'concept-common-table-cover.webp', ...['main', 'food', 'build', 'tray', 'table', 'space', 'hands', 'plants'].map((f) => C + 'common-table/assets/images/' + f + '.webp')] },
    { src: IMG + 'concept-crumb-and-kin-poster.webp', title: 'Crumb & Kin', sub: '04 · Bakery',
      text: 'A small-batch bakery’s homepage, made to feel like an independent campaign: oversized terracotta type, peach panels and hand-drawn dividers.',
      rows: [['Type', 'Oversized serif'], ['Texture', 'Paper grain'], ['Content', 'Data arrays, CMS-ready']],
      href: LIVE + 'crumb-and-kin/', cta: 'Open the concept',
      thumbs: [IMG + 'concept-crumb-and-kin-poster.webp', ...['01', '02', '03', '04', '05', '06', '07', '08'].map((n) => C + 'crumb-and-kin/assets/images/bake-' + n + '.webp')] },
  ];

  const idx = $('[data-idx]'), cap = $('[data-caption]'), count = $('[data-count]'), gal = $('[data-gal]');
  idx.innerHTML = items.map((it, i) => `<li><button type="button" data-go="${i}"><span>C${i + 1}</span><span class="nm">${it.title}</span><span>${it.sub.split(' · ')[1]}</span></button></li>`).join('');
  const onActive = (i) => {
    $$('[data-go]', idx).forEach((b, k) => { b.classList.toggle('is-current', k === i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    cap.innerHTML = `<p class="mono" style="color:var(--teal);margin:0 0 .5rem">${items[i].sub}</p><h3>${items[i].title}</h3><p>${items[i].text}</p>`;
    count.textContent = `${i + 1} / ${items.length}`;
    if (!reduce && window.gsap) gsap.fromTo(cap.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .04, ease: 'power3.out' });
  };
  const g = Gallery($('[data-stage]'), { items, arrange: 'staircase', onActive });
  $$('[data-go]', idx).forEach((b) => b.addEventListener('click', () => g.go(+b.dataset.go)));
  $$('[data-seg] button').forEach((b) => b.addEventListener('click', () => {
    $$('[data-seg] button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    gal.classList.toggle('is-archive', b.dataset.arr === 'list');
    // Let the columns settle before the pictures move into the new shape.
    setTimeout(() => g.arrange(b.dataset.arr), reduce ? 0 : 60);
  }));

  if (!reduce && window.gsap) {
    gsap.from('.head h1', { yPercent: 40, opacity: 0, duration: 1.1, ease: 'expo.out' });
    gsap.from('.head > :not(h1)', { y: 24, opacity: 0, duration: .9, stagger: .06, ease: 'power3.out', delay: .15 });
  }
});
