/*
 * Project form. Any [data-pf-open] link ("Discuss a project", "Start a project") opens it.
 * The form is built here so every page shares one copy. It opens behind apricot blinds
 * (the same slats as the theme switch), reads as one sentence, and posts to /api/contact,
 * a Cloudflare Pages Function that checks Turnstile and sends the enquiry through Resend.
 * Without JavaScript the links go to the homepage's contact section.
 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

  const MARKUP = `
  <div class="pf" id="project-form" role="dialog" aria-modal="true" aria-labelledby="pf-title" hidden>
    <div class="pf__panel">
      <header class="pf__top mono">
        <span class="pf__in">New project</span>
        <button class="pf__close mono" type="button" data-pf-close><span class="pf__in">Close <span aria-hidden="true">✕</span></span><span class="sr-only"> the form</span></button>
      </header>
      <form class="pf__form" novalidate>
        <h2 class="pf__title" id="pf-title"><span class="pf__in">Tell me about it<i aria-hidden="true"></i></span></h2>
        <p class="pf__sentence">
          <span class="pf__in">Hi Noah, I'm</span>
          <label class="pf__field" data-field="name"><span class="sr-only">Your name</span><input name="name" type="text" autocomplete="name" placeholder="your name" maxlength="80" required></label>
          <span class="pf__in">from</span>
          <span class="pf__nb"><label class="pf__field" data-field="company"><span class="sr-only">Company (optional)</span><input name="company" type="text" autocomplete="organization" placeholder="company (optional)" maxlength="100"></label><span class="pf__in">.</span></span>
          <span class="pf__in">I need</span>
          <label class="pf__field pf__field--select" data-field="type"><span class="sr-only">What you need</span>
            <select name="type" required>
              <option value="a new website">a new website</option>
              <option value="a redesign">a redesign</option>
              <option value="improvements to my site">improvements to my site</option>
              <option value="something else">something else</option>
            </select></label>
          <span class="pf__in">and my budget is</span>
          <span class="pf__nb"><label class="pf__field pf__field--select" data-field="budget"><span class="sr-only">Budget</span>
            <select name="budget">
              <option value="not sure yet">not sure yet</option>
              <option value="under S$3k">under S$3k</option>
              <option value="S$3k–8k">S$3k–8k</option>
              <option value="S$8k–15k">S$8k–15k</option>
              <option value="S$15k+">S$15k+</option>
            </select></label><span class="pf__in">.</span></span>
          <span class="pf__in">Reach me at</span>
          <label class="pf__field" data-field="email"><span class="sr-only">Your email</span><input name="email" type="email" autocomplete="email" placeholder="you@email.com" maxlength="254" required></label>
          <span class="pf__in">or</span>
          <span class="pf__nb"><label class="pf__field" data-field="mobile"><span class="sr-only">Mobile (optional)</span><input name="mobile" type="tel" inputmode="tel" autocomplete="tel" placeholder="mobile (optional)" maxlength="24"></label><span class="pf__in">.</span></span>
        </p>
        <label class="pf__message pf__in" data-field="message">
          <span class="mono">Anything else? (optional)</span>
          <textarea name="message" rows="3" maxlength="2000" placeholder="A link, a deadline, an idea…"></textarea>
        </label>
        <label class="pf__hp" aria-hidden="true">Website<input name="website" type="text" tabindex="-1" autocomplete="off"></label>
        <div class="pf__foot pf__in">
          <div class="pf__captcha" data-pf-captcha></div>
          <button class="pf__send" type="submit">Send <b aria-hidden="true">→</b></button>
        </div>
        <p class="pf__status mono" role="status" aria-live="polite"></p>
      </form>
      <div class="pf__result" hidden role="status" aria-live="polite">
        <p class="mono" data-pf-r="label">Message sent</p>
        <p class="pf__result-title"><span data-pf-r="t1">Thanks,</span> <em data-pf-r="t2">talk soon.</em></p>
        <p class="pf__result-note" data-pf-r="note">I usually reply within a day or two.</p>
        <div class="pf__actions">
          <button class="pf__action mono" type="button" data-pf-retry hidden>Try again</button>
          <button class="pf__action mono" type="button" data-pf-close>Back to the site</button>
        </div>
      </div>
    </div>
  </div>`;

  let turnstileReady;
  const loadTurnstile = () => {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    turnstileReady = turnstileReady || new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = TURNSTILE_SRC; s.async = true;
      s.onload = () => resolve(window.turnstile); s.onerror = reject;
      document.head.append(s);
    });
    return turnstileReady;
  };

  addEventListener('DOMContentLoaded', () => {
    const triggers = $$('[data-pf-open]');
    if (!triggers.length) return;
    document.body.insertAdjacentHTML('beforeend', MARKUP);
    const root = $('#project-form'), panel = $('.pf__panel', root), form = $('.pf__form', root);
    const result = $('.pf__result', root), status = $('.pf__status', root), send = $('.pf__send', root);
    const captcha = $('[data-pf-captcha]', root), retry = $('[data-pf-retry]', root);
    const g = window.gsap;

    let opener = null, isOpen = false, busy = false;
    let widgetId = null, token = '', captchaState = 'idle', setupPromise = null;

    /* ---------- Turnstile ---------- */
    const setupCaptcha = () => {
      if (captchaState === 'ready' || captchaState === 'loading') return setupPromise;
      if (widgetId !== null && window.turnstile) { window.turnstile.reset(widgetId); token = ''; captchaState = 'ready'; return Promise.resolve(); }
      captchaState = 'loading';
      setupPromise = (async () => {
        let config;
        try { config = await fetch('/api/contact', { headers: { accept: 'application/json' } }).then((r) => r.json()); }
        catch (e) { captchaState = 'unconfigured'; return; }
        if (!config.siteKey || config.configured === false) { captchaState = 'unconfigured'; return; }
        try {
          const ts = await loadTurnstile();
          const dark = document.documentElement.dataset.theme === 'dark';
          widgetId = ts.render(captcha, {
            sitekey: config.siteKey, theme: dark ? 'dark' : 'light', size: 'flexible', appearance: 'interaction-only',
            callback: (t) => { token = t; },
            'expired-callback': () => { token = ''; },
            'error-callback': () => { token = ''; captchaState = 'error'; return true; },
          });
          if (captchaState === 'loading') captchaState = 'ready';
        } catch (e) { captchaState = 'blocked'; }
      })();
      return setupPromise;
    };
    const waitForToken = (ms) => new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        if (!token && window.turnstile && widgetId !== null) token = window.turnstile.getResponse(widgetId) || '';
        if (token || captchaState === 'error' || Date.now() - start > ms) return resolve(token);
        setTimeout(tick, 150);
      };
      tick();
    });

    /* ---------- Open / close behind blinds ---------- */
    const slats = (fill) => {
      const size = innerWidth < 600 ? 48 : 64, count = Math.ceil(innerHeight / size) + 1;
      const wrap = document.createElement('div');
      wrap.setAttribute('aria-hidden', 'true');
      wrap.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;display:flex;flex-direction:column';
      const list = Array.from({ length: count }, () => {
        const s = document.createElement('i');
        s.style.cssText = `display:block;flex:none;height:${size + 1}px;background:${fill};transform:scaleY(0);transform-origin:50% 0`;
        wrap.append(s); return s;
      });
      document.body.append(wrap);
      return { wrap, list };
    };
    const curtain = (swap, done) => {
      if (reduce || !g) { swap(); done && done(); return; }
      const fill = getComputedStyle(document.documentElement).getPropertyValue('--pink').trim() || '#F2A65A';
      const { wrap, list } = slats(fill);
      g.timeline({ onComplete: () => { wrap.remove(); done && done(); } })
        .to(list, { scaleY: 1, duration: .38, ease: 'power3.in', stagger: { each: .016 } })
        .add(swap)
        .set(list, { transformOrigin: '50% 100%' })
        .to(list, { scaleY: 0, duration: .5, ease: 'power3.out', stagger: { each: .016 } }, '+=.05');
    };
    const intro = () => {
      if (reduce || !g) return;
      g.fromTo($$('.pf__in', root), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .025, ease: 'expo.out', delay: .35, clearProps: 'transform,opacity' });
    };

    const lock = (on) => {
      document.documentElement.classList.toggle('pf-open', on);
      if (window.lenis) on ? window.lenis.stop() : window.lenis.start();
    };
    const showForm = () => {
      result.hidden = true; form.hidden = false; status.textContent = ''; status.classList.remove('is-error');
      $$('.is-invalid', root).forEach((f) => f.classList.remove('is-invalid'));
    };
    const open = (e) => {
      if (e) e.preventDefault();
      if (isOpen || busy) return;
      busy = true; opener = document.activeElement; setupCaptcha();
      curtain(() => {
        root.hidden = false; panel.scrollTop = 0; lock(true); isOpen = true;
        showForm();
        intro();
      }, () => { busy = false; $('input[name="name"]', root).focus({ preventScroll: true }); });
    };
    const close = () => {
      if (!isOpen || busy) return;
      busy = true;
      curtain(() => { root.hidden = true; lock(false); isOpen = false; }, () => {
        busy = false;
        if (opener && opener.focus) opener.focus({ preventScroll: true });
      });
    };

    triggers.forEach((t) => t.addEventListener('click', open));
    $$('[data-pf-close]', root).forEach((b) => b.addEventListener('click', close));
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key !== 'Tab') return;
      const f = $$('button:not([hidden]), input:not([tabindex="-1"]), select, textarea, a[href]', root).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    if (location.hash === '#start') { history.replaceState(null, '', location.pathname + location.search); addEventListener('load', () => open(), { once: true }); }

    /* ---------- Validation and sending ---------- */
    const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]{1,190}\.[a-z]{2,24}$/i;
    const flag = (names) => {
      names.forEach((n) => { const f = $(`[data-field="${n}"]`, root); if (f) f.classList.add('is-invalid'); });
      const first = $(`[data-field="${names[0]}"] input, [data-field="${names[0]}"] select, [data-field="${names[0]}"] textarea`, root);
      if (first) first.focus();
    };
    form.addEventListener('input', (e) => { const f = e.target.closest('[data-field]'); if (f) f.classList.remove('is-invalid'); });
    const fail = (msg) => { status.textContent = msg; status.classList.add('is-error'); };
    const showResult = (ok, msg) => {
      const set = (k, v) => { $(`[data-pf-r="${k}"]`, root).textContent = v; };
      if (ok) { set('label', 'Message sent'); set('t1', 'Thanks,'); set('t2', 'talk soon.'); set('note', 'I usually reply within a day or two.'); retry.hidden = true; }
      else { set('label', 'Not sent'); set('t1', 'Sorry,'); set('t2', 'that didn’t go through.'); set('note', msg || 'Please try again in a moment.'); retry.hidden = false; }
      form.hidden = true; result.hidden = false;
      if (!reduce && g) g.from(result.children, { y: 24, opacity: 0, duration: .8, stagger: .06, ease: 'expo.out', clearProps: 'transform,opacity' });
      (ok ? $('[data-pf-close]', result) : retry).focus();
    };
    retry.addEventListener('click', () => { showForm(); setupCaptcha(); intro(); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (root.classList.contains('is-sending')) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const bad = [];
      if ((data.name || '').trim().length < 2) bad.push('name');
      if (!EMAIL.test((data.email || '').trim())) bad.push('email');
      if (data.mobile && !/^\+?[\d\s().-]{7,20}$/.test(data.mobile.trim())) bad.push('mobile');
      if (bad.length) { fail('Please check the highlighted fields.'); flag(bad); return; }

      root.classList.add('is-sending'); send.disabled = true;
      status.classList.remove('is-error'); status.textContent = 'Checking…';
      await setupCaptcha();
      if (captchaState === 'unconfigured') { root.classList.remove('is-sending'); send.disabled = false; status.textContent = ''; showResult(false, 'The form isn’t set up yet. Please try again later.'); return; }
      if (captchaState === 'blocked') { root.classList.remove('is-sending'); send.disabled = false; fail('The spam check couldn’t load. Turn off any blocker for this site and try again.'); return; }
      if (!token) await waitForToken(10000);
      if (!token) { root.classList.remove('is-sending'); send.disabled = false; fail('Please complete the verification above, then send again.'); if (captchaState === 'error') { captchaState = 'idle'; setupCaptcha(); } return; }

      status.textContent = 'Sending…';
      try {
        const res = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ ...data, token }) });
        const out = await res.json().catch(() => ({}));
        if (window.turnstile && widgetId !== null && !(res.ok && out.ok)) { window.turnstile.reset(widgetId); token = ''; }
        if (res.status === 422 && out.fields) { status.textContent = ''; fail(out.error || 'Please check the highlighted fields.'); flag(out.fields); }
        else if (res.ok && out.ok) { status.textContent = ''; form.reset(); token = ''; captchaState = 'idle'; showResult(true); }
        else { status.textContent = ''; showResult(false, out.error); }
      } catch (err) {
        status.textContent = ''; showResult(false, 'Check your connection and try again.');
      }
      root.classList.remove('is-sending'); send.disabled = false;
    });
  });
})();
