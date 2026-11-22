/* Ganko.sg case study: the screens gallery (showcase arrangements + backstage index and detail). */
addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && window.Lenis) { const l = new Lenis({ lerp: .09 }); window.lenis = l; const raf = (t) => { l.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }

  const IMG = '../../assets/images/';
  const S = [
    ['ganko-home-1600.webp', 'Homepage', 'Home', 'Discover the restaurant, or go straight to booking: the two journeys start here.'],
    ['ganko-tradition.webp', 'Tradition', 'Heritage first', 'Archival photographs of the founding team beside today’s Singapore kitchen, on a washi-paper background.'],
    ['ganko-hospitality.webp', 'Hospitality', 'Photography leads', 'Dishes, interiors and the chefs at work in an asymmetric gallery of varied crops and heights.'],
    ['ganko-reservation.webp', 'Reservation', 'Booking on-site', 'The Chope booking widget, embedded beside the address and opening hours.'],
    ['ganko-dishes.webp', 'Signature dishes', 'Six-up grid, dark ground', 'The food does the talking; copy stays short.'],
    ['ganko-interiors.webp', 'Interiors', 'The Singapore room', 'The interior design of the Singapore restaurant, the end of the story that starts in Osaka.'],
    ['ganko-ui-nav.webp', 'Navigation', 'Two journeys', 'Discover (Home, Tradition, Hospitality, Menu) or plan a visit (Reservation, Contact).'],
    ['ganko-ui-faq.webp', 'FAQ', 'Under More', 'FAQ and Careers sit under More, out of the two main journeys.'],
    ['ganko-ui-contact.webp', 'Contact', 'Hours · map', 'Opening hours and the map, one step from booking.'],
  ];
  const thumbs = S.map(([f]) => IMG + f);
  const items = S.map(([f, title, sub, text], i) => ({
    src: IMG + f, title, sub, text,
    rows: [['Screen', `${String(i + 1).padStart(2, '0')} / ${String(S.length).padStart(2, '0')}`], ['Built in', 'GoDaddy + custom HTML']],
    href: 'https://ganko.sg', cta: 'Visit ganko.sg',
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
