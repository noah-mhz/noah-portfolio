/*
 * Cloudflare Pages Function — /api/contact
 *
 * GET  → returns the public Turnstile site key so the page needs no rebuild
 *        when keys change.
 * POST → validates the enquiry, verifies Turnstile server-side and sends it
 *        to your inbox through Resend. Secrets never reach the browser.
 *
 * Environment variables (Cloudflare Pages → Settings → Variables and Secrets):
 *   RESEND_API_KEY       secret  Resend key with "Sending access" only
 *   TURNSTILE_SECRET_KEY secret  Turnstile widget secret key
 *   TURNSTILE_SITE_KEY   text    Turnstile widget site key (public)
 *   CONTACT_TO           text    Inbox that receives enquiries (your Resend account email)
 *   CONTACT_FROM         text    Optional. Defaults to "Noah Portfolio <onboarding@resend.dev>"
 */

const TYPES = ['a new website', 'a redesign', 'something else'];
const BUDGETS = ['under S$3k', 'S$3k–8k', 'S$8k–15k', 'S$15k+', 'not sure yet'];
const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]{1,190}\.[a-z]{2,24}$/i;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  },
});

// Plain text only: strip control characters, collapse whitespace, cap length.
const clean = (value, max, multiline = false) => {
  if (typeof value !== 'string') return '';
  let text = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  text = multiline ? text.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n') : text.replace(/\s+/g, ' ');
  return text.trim().slice(0, max);
};

export async function onRequestGet({ env }) {
  // Public: the site key, and whether everything is set (never the secrets themselves).
  return json({
    siteKey: env.TURNSTILE_SITE_KEY || '',
    configured: Boolean(env.RESEND_API_KEY && env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY && env.CONTACT_TO),
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !env.CONTACT_TO) {
    return json({ ok: false, error: 'The form is not configured yet.' }, 503);
  }

  // Only accept submissions from this site.
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return json({ ok: false, error: 'Forbidden.' }, 403);
    } catch {
      return json({ ok: false, error: 'Forbidden.' }, 403);
    }
  }
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    return json({ ok: false, error: 'Unsupported request.' }, 415);
  }

  const raw = await request.text();
  if (raw.length > 12000) return json({ ok: false, error: 'Message too long.' }, 413);

  let body;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'Invalid request.' }, 400); }

  // Honeypot: real people never fill this hidden field. Pretend success for bots.
  if (typeof body.website === 'string' && body.website.trim() !== '') return json({ ok: true });

  const data = {
    name: clean(body.name, 80),
    company: clean(body.company, 100),
    type: clean(body.type, 40),
    budget: clean(body.budget, 40),
    email: clean(body.email, 254),
    message: clean(body.message, 2000, true),
  };

  const problems = [];
  if (data.name.length < 2) problems.push('name');
  if (!EMAIL.test(data.email)) problems.push('email');
  if (!TYPES.includes(data.type)) problems.push('type');
  if (data.budget && !BUDGETS.includes(data.budget)) problems.push('budget');
  if ((data.message.match(/https?:\/\//gi) || []).length > 3) problems.push('message');
  if (problems.length) return json({ ok: false, error: 'Please check the highlighted fields.', fields: problems }, 422);

  // Verify the Turnstile token with Cloudflare (server-side, with the secret).
  const token = typeof body.token === 'string' ? body.token.slice(0, 2048) : '';
  if (!token) return json({ ok: false, error: 'Please complete the verification.' }, 400);
  const verify = new FormData();
  verify.append('secret', env.TURNSTILE_SECRET_KEY);
  verify.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) verify.append('remoteip', ip);
  const outcome = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: verify })
    .then((r) => r.json()).catch(() => ({ success: false }));
  if (!outcome.success) return json({ ok: false, error: 'Verification failed. Please try again.' }, 403);

  const text = [
    `Name:     ${data.name}`,
    `Company:  ${data.company || '—'}`,
    `Needs:    ${data.type}`,
    `Budget:   ${data.budget || '—'}`,
    `Email:    ${data.email}`,
    '',
    data.message || '(No extra message.)',
    '',
    '—',
    'Sent from the contact form on noah-portfolio.pages.dev. Reply to this email to answer directly.',
  ].join('\n');

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'Noah Portfolio <onboarding@resend.dev>',
      to: [env.CONTACT_TO],
      reply_to: data.email,
      subject: `New project enquiry — ${data.name}${data.company ? ` (${data.company})` : ''}`,
      text,
    }),
  }).catch(() => null);

  if (!sent || !sent.ok) return json({ ok: false, error: 'Could not send right now. Please email me directly.' }, 502);
  return json({ ok: true });
}

export async function onRequest() {
  return json({ ok: false, error: 'Method not allowed.' }, 405);
}
