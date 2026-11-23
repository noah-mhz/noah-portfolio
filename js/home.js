/* Homepage: hero, Ganko case sequence, work deck, services scenes, timeline and the rest of the homepage motion. */
  addEventListener('DOMContentLoaded', () => {
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const fine = matchMedia('(pointer: fine)').matches;
    // Videos play only when motion is welcome (reduced motion keeps the poster), and each plays only while it's on screen, so off-screen ones don't decode while you scroll.
    if (!REDUCE) {
      const io = 'IntersectionObserver' in window && new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { rootMargin: '10% 0px' });
      $$('video[data-autoplay]').forEach((v) => { v.removeAttribute('autoplay'); if (io) io.observe(v); else v.play().catch(() => {}); });
    }
    const sy = () => (window.lenis ? window.lenis.scroll : scrollY);
    const desktop = matchMedia('(min-width: 1024px)').matches;


    /* ---------- Fit the pressure lines to the width ---------- */
    const presses = $$('[data-press]');
    presses.forEach((h) => $$('.t', h).forEach((t) => {
      splitChars(t); t.removeAttribute('aria-label');
      // Spaces collapse inside the flex line: give each one its own letter box.
      [...t.childNodes].filter((n) => n.nodeType === 3 && /\s/.test(n.data)).forEach((n) => { const sp = document.createElement('span'); sp.className = 'ch'; sp.setAttribute('aria-hidden', 'true'); sp.innerHTML = '&nbsp;'; n.replaceWith(sp); });
    }));
    const fit = () => presses.forEach((h) => {
      const W = h.clientWidth;
      $$('[data-fit]', h).forEach((ln) => {
        ln.classList.add('m'); ln.style.fontSize = '100px';
        const w = [...ln.children].reduce((a, c) => { const cs = getComputedStyle(c); return a + c.getBoundingClientRect().width + parseFloat(cs.marginLeft) + parseFloat(cs.marginRight); }, 0);
        ln.style.fontSize = (100 * W / w * 0.995) + 'px'; ln.classList.remove('m');
      });
    });
    fit(); document.fonts.load('800 100px Archivo').then(() => { fit(); window.ScrollTrigger?.refresh(); }); addEventListener('resize', fit);

    /* ---------- Deck data + behaviour ---------- */
    const WORK = [
      { n: '02 / 04', name: 'Luumens', img: '/assets/images/luumens-home-1600.webp', href: '/work/luumens/', cta: 'Read the case study →',
        rows: [['Type', 'In-house · Pomar Engineering'], ['Sector', 'Energy'], ['Year', '2026'], ['Built with', 'WordPress, custom widgets, GSAP']] },
      { n: '03 / 04', name: 'Voyagaer', img: '/assets/images/voyagaer-hero-poster.webp', href: '/work/voyagaer/', cta: 'Read the case study →',
        rows: [['Type', 'In-house · Pomar Engineering'], ['Sector', 'Marine'], ['Status', 'Not yet launched'], ['Built with', 'WordPress, custom widgets']] },
      { n: '04 / 04', name: 'Industmarine', img: '/assets/images/industmarine-hero.webp', href: '/work/industmarine/', cta: 'Read the case study →',
        rows: [['Type', 'In-house · Pomar Engineering'], ['Sector', 'Marine, offshore & industrial'], ['Year', '2026'], ['Built with', 'WordPress, custom widgets, GSAP']] },
      { n: 'Concept', name: 'Pixel Pull', img: '/assets/images/concept-pixel-pull-cover.webp', href: '/concepts/', cta: 'See the concept →', rows: [['Type', 'Pitched homepage'], ['Sector', 'Card shop']] },
      { n: 'Concept', name: 'Little Rösti', img: '/assets/images/concept-little-rosti-poster.webp', href: '/concepts/', cta: 'See the concept →', rows: [['Type', 'Pitched homepage'], ['Sector', 'Café']] },
      { n: 'Concept', name: 'Common Table', img: '/assets/images/concept-common-table-cover.webp', href: '/concepts/', cta: 'See the concept →', rows: [['Type', 'Pitched homepage'], ['Sector', 'Restaurant']] },
      { n: 'Concept', name: 'Crumb & Kin', img: '/assets/images/concept-crumb-and-kin-poster.webp', href: '/concepts/', cta: 'See the concept →', rows: [['Type', 'Pitched homepage'], ['Sector', 'Bakery']] },
    ];
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const deckEl = $('[data-deck]'), indexEl = $('[data-index]'), recordEl = $('[data-record]'), countEl = $('[data-count]');
    const deckSection = $('.more');
    deckEl.innerHTML = WORK.map((w, i) => `<a class="deck__card" href="${w.href}" draggable="false" data-i="${i}" data-view><img src="${w.img}" alt="" draggable="false"><span class="deck__tag mono">${esc(w.n)} · ${esc(w.name)}</span></a>`).join('');
    indexEl.innerHTML = WORK.map((w, i) => `<li><button type="button" data-go="${i}"><span>${w.n === 'Concept' ? 'C' + (i - WORK.filter((x) => x.n !== 'Concept').length + 1) : w.n.slice(0, 2)}</span><span class="nm">${esc(w.name)}</span><span>${w.n === 'Concept' ? 'Concept' : 'Project'}</span></button></li>`).join('');
    const deckCards = $$('.deck__card', deckEl);
    let order = WORK.map((_, i) => i); // order[0] is on top
    const top = () => order[0];
    const deckStatus = () => { const w = WORK[top()]; setStatus(w.n === 'Concept' ? `Concept · ${w.name}` : `${w.n} · ${w.name}`); };
    const pose = (d0) => { const d = Math.min(d0, 3); return { x: d * 26, y: -d * 20, scale: 1 - d * .045, rotation: d === 0 ? 0 : (d % 2 ? 2.4 : -1.6) * d / 1.5, autoAlpha: 1, zIndex: WORK.length - d0 }; };
    const record = () => {
      const w = WORK[top()];
      recordEl.innerHTML = `<dt>Project</dt><dd>${esc(w.name)}</dd>` + w.rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('') + `<dt class="sr-only">Link</dt><dd class="record__cta"><a href="${w.href}"><span class="ulink">${w.cta.replace(' →', '')}</span> <span class="arr" aria-hidden="true">→</span></a></dd>`;
      $$('[data-go]', indexEl).forEach((b, i) => { b.classList.toggle('is-current', i === top()); b.setAttribute('aria-current', i === top() ? 'true' : 'false'); });
      countEl.textContent = `${top() + 1} / ${WORK.length}`;
      deckCards.forEach((c, i) => { c.tabIndex = i === top() ? 0 : -1; c.setAttribute('aria-hidden', i === top() ? 'false' : 'true'); });
      if (sections[current] === deckSection) deckStatus();
      if (window.gsap && !REDUCE) gsap.fromTo(recordEl.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .03, ease: 'power3.out' });
    };
    const layout = (instant) => order.forEach((ci, d) => {
      const c = deckCards[ci];
      if (!window.gsap || REDUCE || instant) { if (window.gsap) gsap.set(c, { ...pose(d), x: pose(d).x, rotationX: 0, rotationY: 0 }); else { c.style.zIndex = WORK.length - d; c.style.opacity = d > 3 ? 0 : 1; c.style.transform = `translate(${d * 26}px, ${-d * 20}px) scale(${1 - d * .045})`; } return; }
      gsap.to(c, { ...pose(d), rotationX: 0, rotationY: 0, duration: .8, ease: 'expo.out', overwrite: 'auto', zIndex: WORK.length - d });
    });
    // Cards move in one continuous pass: the ones leaving the front arc out and tuck in at the back
    // while the rest slide forward together. One record update per move, however many cards it skips.
    const settle = (skip = []) => order.forEach((ci, d) => {
      if (skip.includes(ci)) return;
      const { zIndex, ...to } = pose(d);
      deckCards[ci].style.zIndex = zIndex;
      gsap.to(deckCards[ci], { ...to, rotationX: 0, rotationY: 0, duration: .6, ease: 'power3.out', overwrite: true, delay: d * .025 });
    });
    const sendBack = (c, dir, i = 0, vy = 0) => {
      const w = deckEl.offsetWidth, { zIndex, ...to } = pose(order.indexOf(+c.dataset.i));
      c.style.zIndex = WORK.length * 2 - i; // stays above the deck while it flies out
      gsap.timeline({ delay: i * .07 })
        .to(c, { x: dir * w * .72, y: vy - 24, rotation: dir * 9, rotationX: 0, rotationY: 0, duration: .3, ease: 'power2.in', overwrite: true })
        .add(() => { c.style.zIndex = zIndex; })
        .to(c, { ...to, duration: .5, ease: 'power3.out' });
    };
    const move = (leaving, dir = 1, vy = 0) => {
      if (!leaving.length) return;
      order = order.filter((ci) => !leaving.includes(ci)).concat(leaving);
      if (window.gsap && !REDUCE) {
        leaving.forEach((ci, i) => sendBack(deckCards[ci], dir, i, i ? 0 : vy));
        settle(leaving);
      } else layout(true);
      record();
    };
    const flick = (dir = 1, vy = 0) => move([top()], dir, vy);
    const back = () => {
      order.unshift(order.pop());
      const c = deckCards[top()];
      if (window.gsap && !REDUCE) {
        c.style.zIndex = WORK.length * 2;
        const { zIndex, ...to } = pose(0);
        gsap.fromTo(c, { x: -deckEl.offsetWidth * .72, y: -24, rotation: -9 }, { ...to, onComplete: () => { c.style.zIndex = zIndex; }, rotationX: 0, rotationY: 0, duration: .6, ease: 'power3.out', overwrite: true });
        settle([top()]);
      } else layout(true);
      record();
    };
    const goTo = (i) => { const k = order.indexOf(i); if (k > 0) move(order.slice(0, k)); };
    function initDeck() {
      // Drag / swipe the top card; tilt it under the cursor.
      let drag = null, moved = false;
      deckEl.addEventListener('pointerdown', (e) => {
        const c = e.target.closest('.deck__card'); if (!c || +c.dataset.i !== top()) return;
        drag = { c, x0: e.clientX, y0: e.clientY, t0: performance.now(), dx: 0, dy: 0 }; moved = false;
        c.setPointerCapture(e.pointerId);
      });
      deckEl.addEventListener('pointermove', (e) => {
        if (drag) {
          drag.dx = e.clientX - drag.x0; drag.dy = e.clientY - drag.y0;
          if (Math.abs(drag.dx) > 6) moved = true;
          gsap.set(drag.c, { x: drag.dx, y: drag.dy * .35, rotation: drag.dx * .04, rotationX: 0, rotationY: 0 });
          return;
        }
        if (!fine || gsap.isTweening(deckCards[top()])) return;
        const c = deckCards[top()], r = deckEl.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        gsap.to(c, { rotationY: px * 10, rotationX: -py * 10, duration: .6, ease: 'power3.out', overwrite: 'auto' });
      });
      const end = () => {
        if (!drag) return;
        const v = drag.dx / Math.max(1, performance.now() - drag.t0);
        if (Math.abs(drag.dx) > deckEl.offsetWidth * .22 || Math.abs(v) > .6) flick(Math.sign(drag.dx) || 1, drag.dy * .35);
        else gsap.to(drag.c, { ...pose(0), duration: .6, ease: 'back.out(1.6)', overwrite: true });
        drag = null;
      };
      deckEl.addEventListener('pointerup', end); deckEl.addEventListener('pointercancel', end);
      deckEl.addEventListener('pointerleave', () => { if (!drag) gsap.to(deckCards[top()], { rotationX: 0, rotationY: 0, duration: .6 }); });
      deckEl.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
      // The deck deals itself in the first time it's seen.
      gsap.from(deckCards, { y: 120, x: 0, rotation: 0, autoAlpha: 0, duration: 1.1, stagger: { each: .07, from: 'end' }, ease: 'expo.out', scrollTrigger: { trigger: deckEl, start: 'top 80%' }, onComplete: () => layout() });
    }
    /* ---------- Section status, progress ticks and rail (from the original) ---------- */
    const sections = $$('[data-section]');
    const pnav = $('[data-pnav]'), status = $('[data-status-btn]'), stText = $('[data-status-text]');
    const progress = $('.progress'), fill = $('.progress__fill'), topEl = $('.top');
    const rail = document.createElement('nav');
    rail.className = 'rail mono'; rail.setAttribute('aria-label', 'On this page');
    rail.innerHTML = `<ol>${sections.map((s, i) => `<li><a href="#" data-i="${i}"><i></i><span>${s.dataset.section}</span></a></li>`).join('')}</ol>`;
    document.body.append(rail);
    const railLinks = $$('a', rail);
    const ticks = sections.map((s, i) => {
      const t = document.createElement('button');
      t.className = 'progress__tick'; t.type = 'button'; t.tabIndex = -1; t.setAttribute('aria-label', 'Jump to ' + s.dataset.section);
      t.innerHTML = `<span class="progress__tip mono">${s.dataset.section}</span>`;
      progress.append(t); return t;
    });
    const target = (i) => { const el = sections[i]; return el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el; };
    const jump = (i) => { const el = target(i); const y = el.getBoundingClientRect().top + scrollY - (el.classList.contains('pin-spacer') ? 0 : 72); window.lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: 'smooth' }); };
    railLinks.forEach((a, i) => a.addEventListener('click', (e) => { e.preventDefault(); jump(i); }));
    ticks.forEach((t, i) => t.addEventListener('click', () => jump(i)));

    /* Typewriter (after Motion's typewriter): set() erases back to where the old and new
       text differ, then types the rest with natural, slightly uneven timing. */
    const typewriter = (el, { speed = 42, back = 18 } = {}) => {
      const txt = document.createTextNode(el.textContent); const caret = document.createElement('i');
      caret.className = 'tw-caret'; caret.setAttribute('aria-hidden', 'true');
      el.textContent = ''; el.append(txt, caret);
      let target = txt.data, timer = 0;
      const step = () => {
        const cur = txt.data; let k = 0;
        while (k < cur.length && k < target.length && cur[k] === target[k]) k++;
        el.classList.toggle('is-empty', !cur && !target);
        if (cur === target) { el.classList.remove('is-typing'); return; }
        el.classList.add('is-typing');
        if (cur.length > k) { txt.data = cur.slice(0, -1); timer = setTimeout(step, back); return; }
        const ch = target[cur.length]; txt.data = cur + ch;
        const pause = /[ —\/.,]/.test(ch) ? 2.2 : 1;
        timer = setTimeout(step, speed * pause * (0.6 + Math.random() * 0.8));
      };
      el.classList.toggle('is-empty', !txt.data);
      return { set(t) { target = t; clearTimeout(timer); if (REDUCE) { txt.data = t; el.classList.toggle('is-empty', !t); return; } step(); } };
    };
    window.typewriter = typewriter;
    const twStatus = typewriter(stText);
    let marks = [], current = -1, label = '';
    const narrow = matchMedia('(max-width: 430px)');
    const setStatus = (t) => { if (narrow.matches) t = t.replace(/^\d+ \/ \d+ · /, ''); if (t === label) return; label = t; twStatus.set(t); };
    window.setStatus = setStatus;
    let maxScroll = 1;
    const place = () => {
      const max = maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      marks = sections.map((s, i) => Math.min(1, Math.max(0, (target(i).getBoundingClientRect().top + scrollY - innerHeight * .3) / max)));
      ticks.forEach((t, i) => t.style.left = marks[i] * 100 + '%');
      update();
    };
    let lastY = -1;
    const update = () => {
      const y = sy();
      if (y === lastY) return; lastY = y;
      const p = Math.min(1, Math.max(0, y / maxScroll));
      fill.style.scale = `${p} 1`;
      topEl.classList.toggle('is-scrolled', y > 8);
      ticks.forEach((t, i) => t.classList.toggle('is-passed', p >= marks[i] - .001));
      let idx = -1; marks.forEach((m, i) => { if (p >= m - .001) idx = i; });
      rail.classList.toggle('is-visible', idx >= 0 && p < .985);
      pnav.classList.toggle('is-sectioned', idx >= 0);
      if (idx !== current) {
        current = idx;
        railLinks.forEach((a, i) => a.classList.toggle('is-current', i === idx));
        const s = sections[idx];
        $$('[data-link]').forEach((a) => a.classList.toggle('is-active', !!s && a.dataset.link === s.dataset.nav));
        if (s && !s.hasAttribute('data-own-status')) setStatus(s.dataset.status || s.dataset.section);
        if (idx < 0) setStatus('');
        if (s === deckSection) deckStatus();
      }
    };
    const open = (v) => { pnav.classList.toggle('is-open', v); status.setAttribute('aria-expanded', v); };
    status.addEventListener('click', () => open(!pnav.classList.contains('is-open')));
    if (fine) { status.addEventListener('pointerenter', () => open(true)); pnav.addEventListener('pointerleave', () => open(false)); }
    $$('.pnav__links a').forEach((a) => a.addEventListener('click', () => open(false)));
    if (window.gsap) gsap.ticker.add(update); else addEventListener('scroll', update, { passive: true });
    addEventListener('resize', place);
    layout(true); record();
    $('[data-next]').addEventListener('click', () => flick(1));
    $('[data-prev]').addEventListener('click', back);
    deckEl.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); flick(1); deckCards[top()].focus(); } if (e.key === 'ArrowLeft') { e.preventDefault(); back(); deckCards[top()].focus(); } });
    $$('[data-go]', indexEl).forEach((b) => b.addEventListener('click', () => goTo(+b.dataset.go)));

    if (!window.gsap) { place(); return; }
    ScrollTrigger.addEventListener('refresh', place);
    /* ---------- Services: each card acts out its service (picked options) ---------- */
    const IMG = '/assets/images/';
    const page = (v) => {
      const c = {
        wire: { logo: '', nav: '<span class="ph"></span><span class="ph"></span><span class="ph"></span>', h: '<span class="ph"></span><span class="ph"></span>', txt: '<span class="ph"></span><span class="ph"></span>', btn: '', img: '' },
        fin: { logo: 'Mori<i></i>', nav: '<span>Menu</span><span>Story</span><span>Book</span>', h: 'Fresh, every morning', txt: 'A small bakery-café. Bread out of the oven at seven.', btn: 'Book a table', img: `<img src="${IMG}concept-crumb-and-kin-poster.webp" alt="">` },
        old: { logo: "Mori's", nav: '<span>Home</span>|<span>About</span>|<span>Contact</span>', h: 'Welcome to our Homepage!!', txt: 'Best viewed in 800×600', btn: 'Click Here', img: `<img src="${IMG}concept-crumb-and-kin-poster.webp" alt="">` },
        brut: { logo: 'MORI', nav: '<span>Menu</span><span>Story</span><span>Book</span>', h: 'Fresh every morning', txt: 'Bread at 07:00.', btn: 'Book →', img: `<img src="${IMG}concept-crumb-and-kin-poster.webp" alt="">` },
        soft: { logo: 'mori', nav: '<span>menu</span><span>story</span><span>book</span>', h: 'Fresh, every morning', txt: 'A small bakery-café.', btn: 'Book a table', img: `<img src="${IMG}concept-crumb-and-kin-poster.webp" alt="">` },
      }[v];
      const ph = v === 'wire' ? ' ph' : '';
      return `<div class="mp v-${v}"><div class="mp-bg"></div><div class="p-logo${ph}" data-k="logo">${c.logo}</div><div class="p-nav" data-k="nav">${c.nav}</div><div class="p-h" data-k="h">${c.h}</div><div class="p-txt" data-k="txt">${c.txt}</div><div class="p-btn${ph}" data-k="btn">${c.btn}</div><div class="p-img" data-k="img">${c.img}</div></div>`;
    };
    const stage = (inner) => `<div class="stage"><div class="stage__bar"><i></i><i></i><i></i></div><div class="view">${inner}</div></div>`;
    const KEYS = ['logo', 'nav', 'h', 'txt', 'btn', 'img'];
    const SCENES = {
      wire: {
        html: () => stage(`<div class="layer a">${page('wire')}</div><div class="layer b">${page('fin')}</div>`),
        tl: (el) => {
          const tl = gsap.timeline({ paused: true });
          tl.set($('.b .mp-bg', el), { opacity: 0 }, 0);
          KEYS.forEach((k) => tl.set($(`.b [data-k="${k}"]`, el), { clipPath: 'inset(0% 100% 0% 0%)' }, 0));
          tl.to($('.b .mp-bg', el), { opacity: 1, duration: .5 }, 0);
          KEYS.forEach((k, i) => {
            tl.to($(`.a [data-k="${k}"]`, el), { opacity: 0, duration: .3 }, .15 + i * .14)
              .to($(`.b [data-k="${k}"]`, el), { clipPath: 'inset(0% 0% 0% 0%)', duration: .55, ease: 'expo.out' }, .15 + i * .14);
          });
          return tl;
        },
      },
      loop: {
        html: () => stage(`<div class="layer s0">${page('old')}</div><div class="layer s1">${page('brut')}</div><div class="layer s2">${page('soft')}</div><div class="layer s3">${page('fin')}</div>`),
        tl: (el) => {
          const L = ['.s1', '.s2', '.s3'].map((s) => $(s, el));
          gsap.set(L, { clipPath: 'inset(0% 0% 100% 0%)' });
          const tl = gsap.timeline({ paused: true });
          L.forEach((l, i) => tl.to(l, { clipPath: 'inset(0% 0% 0% 0%)', duration: .45, ease: 'expo.inOut' }, i * .6));
          return tl;
        },
      },
      code: {
        html: () => stage(`<pre class="code"><span class="ln"><span class="k">const</span> card = $(<span class="s">".card"</span>)</span><span class="ln">gsap.to(card, { y: <span class="v">-24</span> })</span><span class="ln">gsap.to(card, { rotate: <span class="v">6</span> })</span><span class="ln">gsap.to(card, { scale: <span class="v">1.12</span> })</span><span class="ln">card.style.bg = <span class="s">"apricot"</span></span></pre>
          <div class="comp"><img src="${IMG}concept-common-table-cover.webp" alt=""><b></b><b></b><span class="comp-sel"></span></div>`),
        tl: (el) => {
          const ln = $$('.ln', el), comp = $('.comp', el), sel = $('.comp-sel', el);
          const tl = gsap.timeline({ paused: true });
          const run = (i, at) => tl.add(() => ln.forEach((l, k) => l.classList.toggle('is-run', k === i)), at);
          run(0, 0); tl.to(sel, { opacity: 1, duration: .25 }, 0);
          run(1, .5); tl.to(comp, { y: '-6cqw', duration: .5, ease: 'back.out(2)' }, .5);
          run(2, 1.0); tl.to(comp, { rotation: 6, duration: .5, ease: 'back.out(2)' }, 1.0);
          run(3, 1.5); tl.to(comp, { scale: 1.12, duration: .5, ease: 'back.out(2)' }, 1.5);
          run(4, 2.0); tl.to(comp, { backgroundColor: '#F2A65A', duration: .4 }, 2.0).to(sel, { opacity: 0, duration: .3 }, 2.2);
          tl.add(() => {}, 2.6);
          tl.eventCallback('onReverseComplete', () => ln.forEach((l) => l.classList.remove('is-run')));
          return tl;
        },
      },
      versions: {
        html: () => stage(`<div class="ver v0" style="left:6%;top:8%">${page('wire')}<span class="ver__tag">v1.0</span></div><div class="ver v1" style="left:13%;top:15%">${page('soft')}<span class="ver__tag">v1.1</span></div><div class="ver v2" style="left:20%;top:22%">${page('fin')}<span class="ver__tag">v1.2</span></div>`),
        tl: (el) => {
          gsap.set($('.v0 .mp-bg', el), { background: '#FBEBDD' });
          return gsap.timeline({ paused: true })
            .fromTo($('.v1', el), { xPercent: 120, rotation: 8 }, { xPercent: 0, rotation: 0, duration: .7, ease: 'expo.out', immediateRender: true }, .1)
            .fromTo($('.v2', el), { xPercent: 120, rotation: 8 }, { xPercent: 0, rotation: 0, duration: .7, ease: 'expo.out', immediateRender: true }, .6);
        },
      },
    };
    $$('.svc__item[data-scene]').forEach((card) => {
      const sc = SCENES[card.dataset.scene];
      $('[data-stage]', card).outerHTML = sc.html();
      const tl = sc.tl(card, card);
      tl.progress(1).progress(0);
      $$('.is-run', card).forEach((l) => l.classList.remove('is-run'));
      if (REDUCE) { tl.progress(1); return; }
      const on = () => { card.classList.add('is-on'); tl.timeScale(1).play(); };
      const off = () => { card.classList.remove('is-on'); tl.timeScale(1.8).reverse(); };
      if (matchMedia('(hover: hover) and (pointer: fine)').matches) { card.addEventListener('pointerenter', on); card.addEventListener('pointerleave', off); }
      else ScrollTrigger.create({ trigger: card, start: 'top 60%', end: 'bottom 40%', onToggle: (st) => (st.isActive ? on() : off()) });
      card.tabIndex = 0; card.addEventListener('focus', on); card.addEventListener('blur', off);
    });

    if (REDUCE) { place(); return; }

    /* ---------- Wordmark fold (from the live site's logo.js) ---------- */
    {
      const logo = $('[data-logo]'), rest = $('.logo__rest', logo), inner = $('.logo__restin', logo);
      let folded = false, held = false;
      const set = (fold, instant) => {
        const w = inner.getBoundingClientRect().width, d = instant ? 0 : fold ? .8 : .9;
        gsap.to(rest, { width: fold ? 0 : w, duration: d, ease: 'expo.inOut', overwrite: true, onComplete: () => { if (!fold) gsap.set(rest, { clearProps: 'width' }); } });
        gsap.to(inner, { x: fold ? -w : 0, duration: d, ease: 'expo.inOut', overwrite: true });
      };
      const should = () => sy() > 120 && !held;
      const sync = () => { const n = should(); if (n === folded) return; folded = n; set(folded); };
      let q = 0; addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(() => { q = 0; sync(); }); }, { passive: true });
      if (should()) { folded = true; set(true, true); }
      const hold = (v) => { held = v; sync(); };
      if (fine) { logo.addEventListener('pointerenter', () => hold(true)); logo.addEventListener('pointerleave', () => hold(false)); }
      logo.addEventListener('focus', () => { if (logo.matches(':focus-visible')) hold(true); });
      logo.addEventListener('blur', () => hold(false));
    }

    /* ---------- Loader → hero (first visit this session) ----------
       The head script adds .has-loader on a first visit with motion allowed. Stages:
       entry (0–.45s) · DESIGN → DETAIL → DISTINCTIVE through a mask (.45–2s) · counter completes,
       labels clear (1.5–2.05s) · the two background halves split (2.05–2.85s) · the rest of the hero
       rises in (2.45–3.2s). The final word is a copy of the hero's first line, placed exactly over it,
       so when the halves open it simply stays: the loader copy is removed with no visible change.
       The counter only reaches 100% once the fonts and the hero poster are ready (capped at 3.5s). */
    const root = document.documentElement, loader = $('.loader');
    let seen = false;
    try { seen = sessionStorage.getItem('fusion-intro') === '1'; sessionStorage.setItem('fusion-intro', '1'); } catch (e) {}
    if (loader && !seen && root.classList.contains('has-loader') && !REDUCE && window.gsap) runLoader();
    else if (loader) loader.remove();

    function runLoader() {
      loader.style.animation = 'none'; // the script owns it now; the CSS timer was only a fallback
      const [halfTop, halfBottom] = $$('.loader__half', loader);
      const logoL = $('.loader__logo', loader), label = $('.loader__label', loader), note = $('.loader__note', loader);
      const prog = $('.loader__progress', loader), bar = $('.loader__bar i', loader), count = $('.loader__count', loader), mask = $('.loader__mask', loader);
      const heroLogo = $('.top .logo'), lines = $$('.hero .press .ln'), line1 = lines[0], rest = lines.slice(1);
      const restChars = rest.flatMap((l) => $$('.ch', l));
      const intro = $$('.hero__intro > *, .hero__foot > *');

      const word = (txt) => `<div class="press"><span class="ln"><span class="t" style="flex:none">${txt}</span></span></div>`;
      mask.innerHTML = word('Design') + word('Detail') + `<div class="press">${line1.outerHTML}</div>`;
      const words = $$('.press', mask), wordLines = words.map((w) => $('.ln', w));

      // Pin the loader's logo and word to the header logo and the hero's first line.
      const place = () => {
        const r = heroLogo.getBoundingClientRect(), cs = getComputedStyle(heroLogo);
        logoL.style.left = r.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) + 'px';
        logoL.style.top = r.top + parseFloat(cs.paddingTop) + parseFloat(cs.borderTopWidth) + 'px';
        const lr = line1.getBoundingClientRect(), fs = line1.style.fontSize || getComputedStyle(line1).fontSize;
        Object.assign(mask.style, { left: lr.left + 'px', right: 'auto', top: lr.top + 'px', width: lr.width + 'px', height: lr.height + 'px', fontSize: fs });
        wordLines.forEach((l) => { l.style.fontSize = fs; l.removeAttribute('data-fit'); });
      };
      place();
      addEventListener('resize', place);

      window.lenis?.stop();
      const block = (e) => e.preventDefault();
      loader.addEventListener('wheel', block, { passive: false });
      loader.addEventListener('touchmove', block, { passive: false });

      gsap.set(words, { yPercent: 160 });
      gsap.set(rest, { yPercent: 70, autoAlpha: 0 });
      gsap.set(intro, { y: 24, autoAlpha: 0 });

      const cnt = { v: 1 };
      const draw = () => { const v = Math.round(cnt.v); count.textContent = String(v).padStart(2, '0') + '%'; bar.style.transform = `scaleX(${cnt.v / 100})`; };
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const fonts = document.fonts ? document.fonts.load('800 100px Archivo').then(() => document.fonts.ready) : Promise.resolve();
      const poster = new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = '/assets/images/ganko-scroll-poster.webp'; });
      const gate = (promise, at) => {
        let ok = false; promise.then(() => { ok = true; requestAnimationFrame(place); });
        tl.add(() => { if (ok) return; tl.pause(); promise.then(() => requestAnimationFrame(() => { place(); tl.resume(); })); }, at);
      };

      let done = false;
      const finish = () => {
        if (done) return; done = true;
        clearTimeout(safety);
        removeEventListener('resize', place);
        loader.remove();
        window.lenis?.start();
      };
      const tl = gsap.timeline();
      const safety = setTimeout(() => { tl.progress(1); finish(); }, 7000);

      // 1 · Entry
      tl.from([logoL, label, note, prog], { y: 14, autoAlpha: 0, duration: .5, stagger: .05, ease: 'power3.out' }, 0)
        .to(cnt, { v: 86, duration: 1.45, ease: 'power1.inOut', onUpdate: draw }, .05);
      gate(Promise.race([fonts, wait(1500)]), .42);
      // 2 · Typographic assembly: each word rolls up through the mask
      tl.to(words[0], { yPercent: 0, duration: .5, ease: 'expo.out' }, .45)
        .to(words[0], { yPercent: -160, duration: .3, ease: 'power3.in' }, .8)
        .to(words[1], { yPercent: 0, duration: .5, ease: 'expo.out' }, 1.02)
        .to(words[1], { yPercent: -160, duration: .3, ease: 'power3.in' }, 1.36);
      gate(Promise.race([Promise.all([fonts, poster]), wait(3500)]), 1.4);
      tl.to(words[2], { yPercent: 0, duration: .6, ease: 'expo.out' }, 1.58)
      // 3 · Completion
        .to(cnt, { v: 100, duration: .4, ease: 'power2.out', onUpdate: draw }, 1.6)
        .to([label, note, prog], { autoAlpha: 0, y: -8, duration: .35, ease: 'power2.in', stagger: .03 }, 1.95)
      // 4 · The halves split
        .to(halfTop, { yPercent: -101, duration: .8, ease: 'power4.inOut' }, 2.05)
        .to(halfBottom, { yPercent: 101, duration: .8, ease: 'power4.inOut' }, 2.05)
        .add(finish, 2.86)
      // 5 · The rest of the hero rises in, with the letters swelling as on the old intro
        .to(rest, { yPercent: 0, autoAlpha: 1, duration: .9, stagger: .08, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }, 2.45)
        .fromTo(restChars, { fontVariationSettings: "'wdth' 62, 'wght' 300" }, { fontVariationSettings: "'wdth' 100, 'wght' 800", duration: 1, stagger: .02, ease: 'expo.out', clearProps: 'fontVariationSettings' }, 2.5)
        .to(intro, { y: 0, autoAlpha: 1, duration: .8, stagger: .05, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 2.6);
    }

    if (fine) presses.forEach((h) => {
      // Letters near the cursor widen and thicken. Letter centres are measured once (relative to the
      // line block) and on resize, so each frame does one read and then only writes.
      const chars = $$('.ch', h); let mx = 0, my = 0, active = 0, centres = [];
      const measure = () => {
        chars.forEach((c) => (c.style.fontVariationSettings = ''));
        const r = h.getBoundingClientRect();
        centres = chars.map((c) => { const b = c.getBoundingClientRect(); return [b.left - r.left + b.width / 2, b.top - r.top + b.height / 2]; });
      };
      addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; active = 90; }, { passive: true });
      addEventListener('resize', () => { centres = []; });
      if (document.fonts) document.fonts.ready.then(() => { centres = []; });
      const st = chars.map(() => ({ w: 100, g: 800 }));
      gsap.ticker.add(() => {
        if (active <= 0) return;
        const r = h.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight || gsap.getProperty(h, 'opacity') < .05) { active = 0; return; }
        if (!centres.length) measure();
        let moving = false;
        chars.forEach((c, i) => {
          const k = Math.max(0, 1 - Math.hypot(mx - (r.left + centres[i][0]), my - (r.top + centres[i][1])) / (r.height * .9));
          const tw = 85 + 40 * k, tg = 560 + 340 * k;
          const dw = (tw - st[i].w) * .14, dg = (tg - st[i].g) * .14;
          if (Math.abs(dw) < .05 && Math.abs(dg) < .5) return;
          moving = true; st[i].w += dw; st[i].g += dg;
          c.style.fontVariationSettings = `'wdth' ${st[i].w.toFixed(1)}, 'wght' ${st[i].g.toFixed(0)}`;
        });
        if (!moving) active--;
      });
    });

    /* ---------- Hero → case: the original reel handoff ---------- */
    const hero = $('.hero'), reel = $('.press .reel'), lines = $$('.hero .press .ln');
    const caseEl = $('.case'), caseMedia = $('.case__media'), flyer = $('.reel-flyer');
    if (desktop) {
      // The hero holds briefly while the headline clears; the reel then flies, growing,
      // into the exact spot the Ganko image takes once its sequence pins, and hands over.
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: hero, start: 'top top', end: '+=95%', pin: true, scrub: 1 } })
        .fromTo('.hero .press', { yPercent: 0, autoAlpha: 1 }, { yPercent: -8, autoAlpha: 0, duration: .6, ease: 'power1.in', immediateRender: false }, .05)
        .fromTo('.hero__intro', { y: 0, autoAlpha: 1 }, { y: -40, autoAlpha: 0, duration: .5, ease: 'power1.in', immediateRender: false }, 0)
        .fromTo('.hero__foot', { autoAlpha: 1 }, { autoAlpha: 0, duration: .4, immediateRender: false }, 0)
        .to({}, { duration: .45 });
      const lerp = (a, b, t) => a + (b - a) * t;
      const caseStart = () => ScrollTrigger.getAll().find((t) => t.pin === caseEl)?.start ?? Infinity;
      const prog = { value: 0 }; let state = 'reel', dock = null;
      const show = (n) => {
        if (n === state) return; state = n;
        gsap.set(reel, { visibility: n === 'reel' ? 'visible' : 'hidden' });
        gsap.set(flyer, { visibility: n === 'flying' ? 'visible' : 'hidden' });
        gsap.set(caseMedia, { autoAlpha: n === 'flying' ? 0 : 1 });
      };
      // Where the case image sits once its sequence pins, in viewport terms. Measured on refresh only.
      const measureDock = () => {
        const r = caseMedia.getBoundingClientRect(), off = scrollY - caseStart();
        dock = { left: r.left, top: r.top + off, width: r.width, height: r.height };
        gsap.set(flyer, { width: dock.width, height: dock.height, transformOrigin: '0 0', force3D: true });
      };
      // The flyer keeps the docked size and moves by transform only (no layout per frame);
      // its corners are counter-scaled so they stay round while it grows.
      const render = () => {
        const t = prog.value;
        if (sy() >= caseStart() - 1 && t >= .999) return show('docked');
        if (t <= .001) return show('reel');
        if (!dock) measureDock();
        show('flying');
        const f = reel.getBoundingClientRect();
        const w = lerp(f.width, dock.width, t), hh = lerp(f.height, dock.height, t);
        const kx = w / dock.width, ky = hh / dock.height, rad = lerp(f.height * .1, 14, t);
        gsap.set(flyer, { x: lerp(f.left, dock.left, t), y: lerp(f.top, dock.top, t), scaleX: kx, scaleY: ky, borderRadius: `${rad / kx}px / ${rad / ky}px` });
      };
      gsap.to(prog, { value: 1, ease: 'power3.inOut', onUpdate: render, scrollTrigger: { start: 0, endTrigger: caseEl, end: 'top top', scrub: 1.6 } });
      ScrollTrigger.create({ start: 0, endTrigger: caseEl, end: 'top top', onUpdate: render, onLeave: render, onEnterBack: render });
      ScrollTrigger.addEventListener('refresh', () => { measureDock(); render(); });
    } else {
      // Tablet / phone: the reel opens to the screen's width as the headline parts (original initReelOpen).
      const [first, second] = lines;
      const media = reel.querySelector('video');
      const measure = () => {
        let left = 0; for (let el = reel; el; el = el.offsetParent) left += el.offsetLeft;
        const w = reel.offsetWidth, h = reel.offsetHeight, vw = document.documentElement.clientWidth;
        const tH = matchMedia('(max-width: 767px)').matches ? vw : vw * .625;
        return { sx: vw / w, sy: tH / h, x: vw / 2 - (left + w / 2) };
      };
      let m = measure();
      gsap.set(second, { position: 'relative', zIndex: 2 });
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 20%', scrub: 1, invalidateOnRefresh: true, onRefreshInit: () => { m = measure(); } } });
      tl.to(reel, { x: () => m.x, scaleX: () => m.sx, scaleY: () => m.sy, ease: 'power2.inOut', duration: 1 }, 0)
        .to($$('.ch, .sq', second), { autoAlpha: 0, duration: .45 }, 0)
        .fromTo(first, { yPercent: 0, autoAlpha: 1 }, { yPercent: -60, autoAlpha: 0, duration: .6, immediateRender: false }, 0)
        .fromTo('.hero__intro', { y: 0, autoAlpha: 1 }, { y: -60, autoAlpha: 0, duration: .6, immediateRender: false }, 0)
        .fromTo('.hero__foot', { autoAlpha: 1 }, { autoAlpha: 0, duration: .4, immediateRender: false }, 0);
      tl.eventCallback('onUpdate', () => { const sx = gsap.getProperty(reel, 'scaleX'), sy = gsap.getProperty(reel, 'scaleY'), k = Math.max(sx, sy); gsap.set(media, { scaleX: k / sx, scaleY: k / sy }); });
    }

    /* ---------- Case study: the original pinned timeline ---------- */
    const section = $('.case');
    const stages = $$('.case__stage', section);
    const media = $('.case__media', section), imgA = $('.case__img--a', section), imgB = $('.case__img--b', section);
    const titleChars = splitChars($('[data-case-title]'));
    const STAGES = ['Overview', 'Approach', 'Platform', 'Live'];
    const twStage = typewriter($('[data-tw-stage]'), { speed: 55 });
    if (!desktop) {
      gsap.fromTo(titleChars, { yPercent: 115 }, { yPercent: 0, duration: 1.4, ease: 'power4.out', stagger: .03, scrollTrigger: { trigger: section, start: 'top 75%', once: true } });
      gsap.fromTo(media, { clipPath: 'inset(42% 0% 0% 0% round .9rem)' }, { clipPath: 'inset(0% 0% 0% 0% round .9rem)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: media, start: 'top 85%', once: true } });
      stages.forEach((stage, i) => {
        gsap.fromTo($$('[data-stage-item]', stage), { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: stage, start: 'top 85%', once: true } });
        ScrollTrigger.create({ trigger: stage, start: 'top 60%', end: 'bottom 40%', onToggle: (t) => t.isActive && twStage.set(STAGES[i]) });
      });
    } else {
      section.classList.add('is-pinned');
      const steps = $$('.case__steps li', section), bar = $('[data-case-bar]', section), wrap = $('.case__stages', section), next = $$('[data-case-next]', section);
      const stageIn = [.5, 2.1, 3.7, 5.3], stageOut = [1.8, 3.4, 5.0, 99], exitAt = 6.5, total = 7.0;
      let cur = -1;
      const setStep = (i) => { if (i === cur) return; cur = i; steps.forEach((s, k) => s.classList.toggle('is-active', k === i)); twStage.set(STAGES[i]); };
      const mediaShift = () => wrap.offsetLeft - media.offsetLeft;
      const stagesShift = () => (media.offsetLeft + media.offsetWidth) - (wrap.offsetLeft + wrap.offsetWidth);
      gsap.set(stages, { autoAlpha: 0 });
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, scrollTrigger: { trigger: section, start: 'top top', end: '+=160%', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => { const t = self.progress * total; setStep(t < stageIn[1] ? 0 : t < stageIn[2] ? 1 : t < stageIn[3] ? 2 : 3); } } });
      tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: total, ease: 'none' }, 0)
        .fromTo(titleChars, { yPercent: 115 }, { yPercent: 0, duration: .9, stagger: .04, ease: 'power4.out' }, .1)
        .fromTo(imgB, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.2 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.3 }, stageIn[1] - .3)
        .to(imgA, { yPercent: -10, scale: 1.08, duration: 1.3 }, stageIn[1] - .3)
        .to(imgB, { scale: 1.08, xPercent: -3, duration: exitAt - stageIn[2], ease: 'none' }, stageIn[2])
        .to(media, { x: mediaShift, duration: 1.2 }, stageOut[2] + .1)
        .to(wrap, { x: stagesShift, duration: 1.2 }, stageOut[2] + .1)
        // The last step stays: the frame then scrolls away whole, so no empty screen follows.
        .to({}, { duration: .1 }, total - .1);
      stages.forEach((stage, i) => {
        const items = $$('[data-stage-item]', stage);
        tl.set(stage, { autoAlpha: 1 }, stageIn[i] + (i ? .25 : 0))
          .fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: .75, stagger: .06, ease: 'power3.out' }, stageIn[i] + (i ? .3 : 0));
        if (i < stages.length - 1) tl.to(items, { yPercent: -110, duration: .3, stagger: .015, ease: 'power3.in' }, stageOut[i])
          .set(stage, { autoAlpha: 0 }, stageOut[i] + .45);
      });
      setStep(0);
    }

    /* ---------- More work: the deck (after Motion's gallery-cards: stack + tilt) ---------- */
    initDeck();

    /* ---------- Statement: words fill with colour as you scroll (created after the pins so it lines up) ---------- */
    const p = $('[data-reveal]');
    const words = (txt, cls) => txt.split(/(\s+)/).map((w) => /\s/.test(w) || !w ? w : `<span class="w${cls}">${w}</span>`).join('');
    p.innerHTML = [...p.childNodes].map((n) => words(n.textContent, n.nodeType === 3 ? '' : ' k')).join('');
    if (matchMedia('(max-width: 767px)').matches) gsap.to($$('.w', p), { opacity: 1, stagger: .04, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: p, start: 'top 75%' } });
    else gsap.to($$('.w', p), { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true } });


    if (fine) {
      const b = $('.bubble');
      const bx = gsap.quickTo(b, 'x', { duration: .45, ease: 'power3' }), by = gsap.quickTo(b, 'y', { duration: .45, ease: 'power3' });
      addEventListener('pointermove', (e) => { bx(e.clientX); by(e.clientY); });
      $$('[data-view]').forEach((c) => {
        c.addEventListener('pointerenter', () => gsap.to(b, { scale: 1, duration: .5, ease: 'back.out(2)' }));
        c.addEventListener('pointerleave', () => gsap.to(b, { scale: 0, duration: .35, ease: 'power3.in' }));
      });
      $$('[data-tilt]').forEach((c) => {
        const rx = gsap.quickTo(c, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(c, 'rotationY', { duration: .6, ease: 'power3' });
        c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 14); rx(-((e.clientY - r.top) / r.height - .5) * 14); });
        c.addEventListener('pointerleave', () => { rx(0); ry(0); });
      });
    }


    /* ---------- Experience timeline (ported from the live site) ---------- */
    {
      const track = $('[data-timeline]');
      // Points: a dash per line; figures ("10%", "10–15%") picked out and counted up.
      $$('.tl__points li', track).forEach((li) => {
        const dash = document.createElement('i'); dash.className = 'tl__dash'; dash.setAttribute('aria-hidden', 'true'); li.prepend(dash);
        const t = li.querySelector('[data-tl-item]');
        t.innerHTML = t.innerHTML.replace(/(\d+)(?:–(\d+))?%/g, (m, a, b) => `<b class="tl__num" data-count="${a}"${b ? ` data-count-to="${b}"` : ''}>${m}</b>`);
      });
      const pointsTl = (list) => {
        const tl = gsap.timeline({ paused: true, delay: .35 });
        $$('li', list).forEach((li, i) => {
          const at = i * .12;
          tl.fromTo(li.querySelector('.tl__dash'), { scaleX: 0 }, { scaleX: 1, duration: .45, ease: 'power3.out' }, at)
            .fromTo(li.querySelector('[data-tl-item]'), { yPercent: 110 }, { yPercent: 0, duration: .8, ease: 'expo.out' }, at + .12);
          $$('.tl__num', li).forEach((num) => {
            const end = +num.dataset.count, endTo = num.dataset.countTo ? +num.dataset.countTo : null, c = { v: 0 };
            tl.fromTo(c, { v: 0 }, { v: 1, duration: 1.1, ease: 'power2.out', onUpdate: () => { const a = Math.round(end * c.v); num.textContent = endTo === null ? `${a}%` : `${a}–${Math.round(endTo * c.v)}%`; } }, at + .2);
          });
        });
        return tl;
      };
      // Years: an odometer that rolls back from when the role ended to when it began.
      const odometer = (entry) => {
        const year = $('.tl__year [data-tl-item]', entry);
        const start = parseInt(year.textContent, 10), range = $('.tl__range', entry).textContent, ys = range.match(/\d{4}/g) || [];
        const end = /now/i.test(range) ? new Date().getFullYear() : parseInt(ys[ys.length - 1], 10);
        if (!start || !end || end <= start) return [];
        const seq = []; for (let y = end; y >= start; y--) seq.push(String(y));
        const odo = document.createElement('span'); odo.className = 'odo'; odo.setAttribute('aria-hidden', 'true');
        [...String(start)].forEach((_, col) => {
          const digits = seq.map((y) => y[col]).filter((d, i, all) => i === 0 || d !== all[i - 1]);
          const c = document.createElement('span'); c.className = 'odo__col';
          const strip = document.createElement('span'); strip.className = 'odo__strip';
          digits.forEach((d) => { const e = document.createElement('span'); e.textContent = d; strip.append(e); });
          if (digits.length > 1) { strip.style.setProperty('--odo-top', `${-(digits.length - 1)}em`); strip.dataset.from = String((digits.length - 1) / digits.length * 100); }
          c.append(strip); odo.append(c);
        });
        const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = String(start);
        year.replaceChildren(odo, sr);
        return $$('.odo__strip[data-from]', year);
      };
      gsap.fromTo('[data-timeline-fill]', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: track, start: 'top 70%', end: 'bottom 70%', scrub: true } });
      $$('[data-tl]', track).forEach((entry) => {
        const strips = odometer(entry), range = $('.tl__range [data-tl-item]', entry);
        gsap.fromTo($$('[data-tl-item]', entry).filter((el) => !el.closest('.tl__points')), { yPercent: 110 }, { yPercent: 0, duration: .9, ease: 'expo.out', stagger: .05,
          scrollTrigger: { trigger: entry, start: 'top 72%', toggleActions: 'play none none reverse', onEnter: () => scramble(range, { duration: .7 }) } });
        ScrollTrigger.create({ trigger: entry, start: 'top 72%', animation: pointsTl($('.tl__points', entry)), toggleActions: 'play none none reverse' });
        if (strips.length) gsap.fromTo(strips, { yPercent: (i, st) => +st.dataset.from }, { yPercent: 0, duration: 1.3, delay: .2, ease: 'power3.inOut', scrollTrigger: { trigger: entry, start: 'top 72%', toggleActions: 'play none none reverse' } });
        ScrollTrigger.create({ trigger: entry, start: 'top+=60 70%', onEnter: () => entry.classList.add('is-active'), onLeaveBack: () => entry.classList.remove('is-active') });
      });
    }
    $$('.h2s').forEach((h) => gsap.from(h, { yPercent: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 94%' } }));
    gsap.from('.svc__item', { y: 60, opacity: 0, duration: 1.1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.svc__grid', start: 'top 92%' } });
    gsap.from('.cps__grid > a', { y: 60, opacity: 0, duration: 1.1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.cps__grid', start: 'top 92%' } });
    gsap.from('.cta .ln', { yPercent: 100, opacity: 0, duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
    $$('[data-mag]').forEach((el) => magnet(el, .3));
    $$('[data-scr]').forEach((a) => a.addEventListener('pointerenter', () => scramble(a, { duration: .45 })));
    ScrollTrigger.refresh(); place();
  });
  
