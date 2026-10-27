/*
 * Project form. "Start a project" no longer jumps to the mail app: a mint
 * wipe grows out of the button to fill the screen, the dark panel follows it
 * in, and the sentence form writes itself in line by line. Submissions go to
 * /api/contact (a Cloudflare Pages Function) after a Turnstile check.
 * Without JavaScript the button stays a plain mailto link.
 */
import { getLenis } from './scroll.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileReady;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  turnstileReady = turnstileReady || new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return turnstileReady;
}

export function initContactForm() {
  const root = $('#project-form');
  const triggers = $$('[data-pf-open]');
  if (!root || !triggers.length) return;

  const { gsap } = window;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wipe = $('.pf__wipe', root);
  const panel = $('.pf__panel', root);
  const form = $('.pf__form', root);
  const done = $('.pf__done', root);
  const status = $('.pf__status', root);
  const send = $('.pf__send', root);
  const captcha = $('[data-pf-captcha]', root);

  let opener = null;
  let open = false;
  let widgetId = null;
  let token = '';
  let captchaState = 'idle'; // idle | loading | ready | unconfigured | blocked | error
  let captchaError = '';
  let setupPromise = null;

  /* ---------- Turnstile ---------- */

  const setupCaptcha = () => {
    if (captchaState === 'ready' || captchaState === 'loading') return setupPromise;
    if (widgetId !== null && window.turnstile) {
      // Widget exists but errored: reset it instead of rendering a second one.
      captchaState = 'ready'; captchaError = ''; token = '';
      window.turnstile.reset(widgetId);
      setupPromise = Promise.resolve();
      return setupPromise;
    }
    captchaState = 'loading';
    setupPromise = (async () => {
      let config;
      try {
        config = await fetch('/api/contact', { headers: { accept: 'application/json' } }).then((r) => r.json());
      } catch {
        captchaState = 'unconfigured';
        return;
      }
      if (!config.siteKey || config.configured === false) { captchaState = 'unconfigured'; return; }
      try {
        const turnstile = await loadTurnstile();
        widgetId = turnstile.render(captcha, {
          sitekey: config.siteKey,
          theme: 'dark',
          appearance: 'interaction-only',
          callback: (t) => { token = t; captchaError = ''; },
          'expired-callback': () => { token = ''; },
          'error-callback': (code) => { token = ''; captchaError = String(code || 'unknown'); captchaState = 'error'; return true; },
        });
        if (captchaState === 'loading') captchaState = 'ready';
      } catch {
        captchaState = 'blocked';
      }
    })();
    return setupPromise;
  };

  // Turnstile runs in the background; wait for its token rather than failing at once.
  const waitForToken = async (ms) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (!token && window.turnstile && widgetId !== null) token = window.turnstile.getResponse(widgetId) || '';
      if (token || captchaState === 'error') return token;
      await new Promise((resolve) => { setTimeout(resolve, 200); });
    }
    return token;
  };

  /* ---------- Open / close choreography ---------- */

  const items = () => $$('.pf__top .pf__item, .pf__title .pf__item, .pf__sentence .pf__item', root);
  const rules = () => $$('.pf__rule', root);
  const fields = () => $$('.pf__field input, .pf__field select', root);

  const insetFrom = (el) => {
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return `inset(${r.top}px ${vw - r.right}px ${vh - r.bottom}px ${r.left}px)`;
  };

  const openForm = (event) => {
    if (open) return;
    event?.preventDefault();
    opener = event?.currentTarget || document.activeElement;
    open = true;

    root.hidden = false;
    form.hidden = false;
    done.hidden = true;
    status.textContent = '';
    status.classList.remove('is-error');
    document.documentElement.style.overflow = 'hidden';
    getLenis()?.stop();
    setupCaptcha();

    const focusFirst = () => $('input[name="name"]', root)?.focus({ preventScroll: true });

    if (reduce || !gsap) {
      if (gsap) gsap.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, onComplete: focusFirst });
      else focusFirst();
      return;
    }

    gsap.killTweensOf([wipe, panel, ...items(), ...rules(), ...fields()]);
    const from = opener && opener.getBoundingClientRect ? insetFrom(opener) : 'inset(50% 50% 50% 50%)';

    gsap.timeline({ defaults: { ease: 'expo.inOut' }, onComplete: focusFirst })
      .set(root, { autoAlpha: 1 })
      .fromTo(wipe, { clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.9 }, 0)
      .fromTo(panel, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 }, 0.45)
      .fromTo(items(), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.035, ease: 'expo.out' }, 0.95)
      .fromTo(rules(), { scaleX: 0 }, { scaleX: 1, duration: 1.1, stagger: 0.06, ease: 'expo.out' }, 1.1)
      .fromTo(fields(), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out' }, 1.15)
      .fromTo('.pf__message .pf__item, .pf__message textarea, .pf__foot', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' }, 1.35);
  };

  const closeForm = () => {
    if (!open) return;
    open = false;
    const finish = () => {
      root.hidden = true;
      document.documentElement.style.overflow = '';
      getLenis()?.start();
      opener?.focus?.({ preventScroll: true });
    };

    if (reduce || !gsap) {
      if (gsap) gsap.to(root, { autoAlpha: 0, duration: 0.25, onComplete: finish });
      else finish();
      return;
    }

    const to = opener && opener.getBoundingClientRect ? insetFrom(opener) : 'inset(50% 50% 50% 50%)';
    gsap.timeline({ defaults: { ease: 'expo.inOut' }, onComplete: finish })
      .to(panel, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.75 }, 0)
      .to(wipe, { clipPath: to, duration: 0.8 }, 0.35)
      .set(root, { autoAlpha: 0 });
  };

  triggers.forEach((trigger) => trigger.addEventListener('click', openForm));
  $$('[data-pf-close]', root).forEach((button) => button.addEventListener('click', closeForm));

  // Escape closes; Tab stays inside the dialog.
  document.addEventListener('keydown', (event) => {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); closeForm(); return; }
    if (event.key !== 'Tab') return;
    const focusables = $$('button, input:not([tabindex="-1"]), select, textarea, a[href], iframe', root)
      .filter((el) => !el.closest('[hidden]') && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  /* ---------- Submit ---------- */

  const showError = (message, bad = []) => {
    status.textContent = message;
    status.classList.add('is-error');
    $$('[data-field]', root).forEach((field) => field.classList.toggle('is-invalid', bad.includes(field.dataset.field)));
    const firstBad = bad.length && $(`[data-field="${bad[0]}"] input, [data-field="${bad[0]}"] select, [data-field="${bad[0]}"] textarea`, root);
    firstBad?.focus();
  };

  const showDone = () => {
    form.hidden = true;
    done.hidden = false;
    $('.pf__again', root)?.focus({ preventScroll: true });
    if (reduce || !gsap) return;
    gsap.fromTo($$('.pf__done-item', root), { yPercent: 110, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 1.2, stagger: 0.08, ease: 'expo.out' });
  };

  form.addEventListener('input', (event) => {
    event.target.closest('[data-field]')?.classList.remove('is-invalid');
    if (status.classList.contains('is-error')) { status.textContent = ''; status.classList.remove('is-error'); }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    const bad = [];
    if ((data.name || '').trim().length < 2) bad.push('name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((data.email || '').trim())) bad.push('email');
    if (bad.length) { showError(bad.includes('name') ? 'Please add your name.' : 'Please add a valid email.', bad); return; }

    status.textContent = 'Checking…';
    status.classList.remove('is-error');
    send.classList.add('is-sending');
    if (captchaState !== 'ready' && captchaState !== 'error') await setupCaptcha();
    if (captchaState === 'ready' && !token) await waitForToken(10000);
    send.classList.remove('is-sending');

    if (!token) {
      const why = {
        unconfigured: 'The form isn\'t set up yet — please email me at noahmhzaw@gmail.com.',
        blocked: 'The verification couldn\'t load (an ad blocker may be stopping it). Please email me directly.',
        error: `Verification error ${captchaError}. Please email me directly.`,
      }[captchaState] || 'Please complete the verification above, then press Send again.';
      showError(why);
      if (captchaState === 'error') setupCaptcha(); // reset quietly so the next attempt can pass
      return;
    }

    status.textContent = 'Sending…';
    status.classList.remove('is-error');
    send.classList.add('is-sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ...data, token }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        showError(result.error || 'Could not send right now. Please email me directly.', result.fields || []);
        if (window.turnstile && widgetId !== null) { window.turnstile.reset(widgetId); token = ''; }
        return;
      }
      form.reset();
      status.textContent = '';
      showDone();
    } catch {
      showError('Could not send right now. Please email me directly.');
    } finally {
      send.classList.remove('is-sending');
    }
  });
}
