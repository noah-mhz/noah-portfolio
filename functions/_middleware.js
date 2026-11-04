/*
 * Keeps the repo's working files off the public site. With no build step,
 * Cloudflare Pages deploys every file in the repo, so notes like CLAUDE.md
 * and the READMEs would otherwise open by URL. Those paths get the site's
 * 404 page instead; every other request passes straight through.
 * _routes.json limits which requests run this function at all.
 */
const BLOCKED = [
  /^\/(claude|readme)\.md$/i,
  /^\/\.gitignore$/i,
  /^\/concepts\/[^/]+\/readme\.md$/i,
];

function isBlocked(pathname) {
  let path = pathname;
  try { path = decodeURIComponent(pathname); } catch { /* keep the raw path */ }
  return BLOCKED.some((rule) => rule.test(path));
}

export async function onRequest(context) {
  const { request, env, next } = context;
  if (!isBlocked(new URL(request.url).pathname)) return next();

  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
  };
  try {
    const page = await env.ASSETS.fetch(new URL('/404', request.url));
    if (page.ok) return new Response(page.body, { status: 404, headers });
  } catch { /* fall through to the plain response */ }
  return new Response('Not found', { status: 404, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' } });
}
