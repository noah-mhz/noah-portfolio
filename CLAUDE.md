# CLAUDE.md — Noah's portfolio

Personal portfolio of Noah (Zaw Min Htut), web designer & developer, Singapore.
Live: https://noah-portfolio.pages.dev · Repo: github.com/noah-mhz/noah-portfolio (branch `main`).
README.md has the file-by-file structure and the motion tiers; read it before larger changes.

## How Noah works

- Communication: direct and terse. Clean, professional output over explanation.
- Push finished changes straight to `main`; Noah pulls locally. Cloudflare Pages deploys on push.
- Commits are authored as `Claude <noreply@anthropic.com>` and end with the attribution
  lines the session provides (Co-Authored-By / Claude-Session).
- For design or layout changes with more than one reasonable direction, suggest options
  first and build after he picks. Clear bug fixes: just fix them.
- He reviews in Chrome desktop with DevTools; after CSS/JS changes, tell him to hard-refresh
  if something looks unchanged.

## Never

- Never put the Resend API key or Turnstile secret in code or messages (Cloudflare env vars only).
- Never publish contact details: no email or phone anywhere on the site, and nothing from the
  lecturer reference (name, phone, email).
- Never invent facts, metrics, client quotes or outcomes. Use only what Noah has stated.
- No gradients, glows or particles. No section numbering (project counters like `01 / 05` stay).

## Facts Noah has stated (use as given)

- Every site in the portfolio was designed and built by Noah alone.
- Ganko.sg (2025): the restaurant's first website, from scratch. GoDaddy Website Builder was the
  client's choice; mix of builder layouts and custom HTML sections; Chope booking embedded.
  Hard part: GoDaddy's limits (functionality, layouts, fonts). Proudest: the story from Osaka
  to the Singapore interior. Next time: recommend a different builder.
- Luumens (2026): WordPress + Elementor, custom HTML widgets only, CSS + GSAP. Hard parts:
  responsiveness (widescreen/tablet/mobile) and a layout that represents the company. Reworked
  the homepage for flow. Proudest: the bento product page. Next time: pin down client
  expectations early.
- Voyagaer: WordPress + Elementor, custom widgets. Live site not launched yet (no outbound
  link). Hard part: content/photos arriving in pieces and planning the flow. Proudest: product
  pages with all specs in tabs. Next time: settle flow and narrative before design.
- Craftism and Evnergy: real projects, sites and case studies not live yet ("In progress" list,
  no links). No brand colours yet.
- No metrics and no client quotes are available.
- Concepts (`/concepts/`): homepages Noah designed and built to pitch small businesses (two card
  shops, a rösti café). Pitched, not commissioned. Shown only anonymised (Pixel Pull, Mochi's Card
  Nook, Little Rösti in `concepts/<slug>/`, noindex). The real names, logos, photos, posters,
  addresses and handles must never appear on the site; originals, decks and recordings live in
  the private repo noah-mhz/portfolio-concepts. Design notes on the page come from Noah's own
  notes and code comments only.

## Design system

- Darkroom (default): bg `#0A0A0A`, text `#F2F2F0`, accent mint `#A6FFCB`.
- Daylight: paper `#F2F2F0`, ink `#0A0A0A`, accent deep green `#0B7A53`.
- Use tokens (`--bg`, `--text`, `--muted`, `--accent`, `--fg-rgb`, `--border`…), never literal
  colours, except inside the difference-blended nav and over photos/video (fixed light colours;
  the nav's daylight accent is the inverse `#E7789D`).
- Case colours via body vars `--case / --case-day / --case-inv`; homepage project titles via
  `--brand / --brand-day` on the article.
- Type: Inter Tight (display/body), JetBrains Mono (labels). Viewfinder corner marks (`.marks`)
  frame what the page points at. Motion is slow and deliberate (expo / power curves).
- Every effect needs a reduced-motion path and a touch path (`gsap.matchMedia`, `MEDIA` tiers
  in animations.js, `TOUCH_MOTION` in touch.js).

## Stack and conventions

- Static HTML/CSS/JS, no build step. GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.13 (jsdelivr).
- Entry points: `js/main.js` (home), `js/project.js` (case studies + colophon),
  `js/notfound.js` (404, absolute paths because it is served at any depth).
- Every page has the inline `<head>` boot script that applies a saved Daylight theme before paint.
- Images are WebP. `_headers` sets caching (CSS/JS always revalidate) and security headers.
- Contact: `functions/api/contact.js` (Turnstile + Resend). The form is in each page's markup;
  `js/contact.js` + `js/formfx.js` (custom dropdowns, placeholders, error shake).
- Search: titles name "Noah Zaw Min Htut"; Person/WebSite JSON-LD on the homepage; canonical
  URLs on every page; update `sitemap.xml` lastmod when pages change.

## Pitfalls already hit (don't repeat)

- The Ganko pin length, its stage timings (`initCaseStudy`) and `.project.is-overlapping`
  margin are linked; change them together and compare scrolling down vs up.
- Pages can be restored from the back/forward cache mid-transition; `transition.js` resets
  this on `pageshow`. Anything that pauses Lenis must be undone there too.
- Inside the nav (`mix-blend-mode: difference`) use fixed light colours.
- Test scripts must not write files into the repo.
- Unsplash downloads are blocked from the sandbox; external images are hotlinked.

## Testing before pushing

- Serve locally: `python3 -m http.server 8766` in the repo root.
- Playwright (Chromium is preinstalled). Route the CDN scripts to local copies of the same
  versions if the CDNs are unreachable.
- Check 2560, 1920, 1440, 1280, 1024 (touch), 820 (touch), 390 and 360; both themes; reduced
  motion. Look for console errors, horizontal overflow (`scrollWidth - innerWidth`), nav
  collisions, and compare screenshots scrolling down vs up for scroll-driven work.
- `node --check` every changed JS file.
