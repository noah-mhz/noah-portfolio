# CLAUDE.md — Noah's portfolio

Personal portfolio of Noah (Zaw Min Htut), web designer & developer, Singapore.
Live: https://noah-portfolio.pages.dev · Repo: github.com/noah-mhz/noah-portfolio (branch `main`; previous design on `v1`).
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
- No glows or particles; gradients only where tasteful. No section numbering (project counters like `01 / 04` stay).

## Facts Noah has stated (use as given)

- Every site in the portfolio was designed and built by Noah alone.
- Positioning: independent web designer & developer in Singapore who takes freelance work
  alongside an in-house role (Software Engineer at Pomar Engineering, May 2025 – now).
  Ganko is the only freelance project. Luumens, Voyagaer, Industmarine, Craftism and Evnergy are in-house
  work for Pomar Engineering's brands — never call them clients. Labels: "Freelance" /
  "In-house · Pomar Engineering" / "Concept".
- Services (homepage): New website · Redesign · Custom front-end · Ongoing improvements.
- Replies "within a day or two". The form is the only contact method for now.
- Testimonials: none yet. The "Kind words" section in index.html stays `hidden` until Noah
  supplies real quotes.
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
- Industmarine (industmarine.com, live, © 2026): WordPress + Elementor, custom HTML widgets, GSAP. Eight
  pages laid out like an engineering drawing sheet. Hard part: responsiveness. Proudest: the
  engineering-sheet grid. Next time: a lighter build (fewer page-level overrides, a shared widget library).
- Craftism and Evnergy: real projects, sites and case studies not live yet ("In progress" list,
  no links). No brand colours yet.
- No metrics and no client quotes are available.
- Concepts (`/concepts/`): homepages Noah designed and built to pitch small businesses (two card
  shops, a rösti café, a restaurant, a bakery). Pitched, not commissioned. Shown only anonymised (Pixel Pull, Mochi's Card
  Nook, Little Rösti, Common Table, Crumb & Kin in `concepts/<slug>/`, noindex). The real names, logos, photos, posters,
  addresses and handles must never appear on the site; originals, decks and recordings live in
  the private repo noah-mhz/portfolio-concepts. Design notes on the page come from Noah's own
  notes and code comments only. Mochi's Card Nook is hidden from the page for now (its section
  is in git history, commit 5bbe15a); its files stay in `concepts/mochi-card-nook/`, unlinked. The restaurant's real name
  must never appear, not even in file names or URLs.

## Versions

- **v2 (live)**: the current design (peach / deep teal / apricot). Built on branch `redesign`, launched 2026-11-23.
- **v1**: the previous site (Darkroom / Daylight, mint accent) is kept on branch `v1`. To revert the live
  site, reset `main` to `v1` (or redeploy that commit from Cloudflare Pages → Deployments). Never delete `v1`.

## Design system (v2)

- Palette, 60 / 30 / 10. Light: peach `#F8DBC1` ground, deep teal `#0E1718` ink and bands, apricot
  `#F2A65A` for buttons and fills; burnt apricot `#944810` for accent text and thin marks (apricot is too
  faint on peach). Dark: deep teal ground, peach ink, apricot accent; panels `#15292B`. No pink anywhere.
- Use the tokens in `css/base.css` (`--bg`, `--bg-2`, `--ink`, `--muted`, `--line`, `--pink` = apricot
  fill, `--pink-ink` / `--mark` = accent text and marks, `--teal` = small labels, `--on-pink`), never literal
  colours, except inside illustrations (service scenes) and the blinds (`theme.js` GROUND).
- Type: Archivo variable (width 62–125, weight 100–900) for everything; Geist Mono 400 for labels.
  Self-hosted in `assets/fonts/`.
- Wordmark: lowercase "noah" + square full stop; folds to "n." on scroll (homepage). Favicon unchanged.
- Theme: dark by default; the choice is stored in localStorage `noah-theme` and applied by the inline
  `<head>` script before paint. Switching runs the blinds transition (`js/theme.js`).
- Motion: expo / power curves; small springs only on arrows and dots. Every effect has a touch version and
  a reduced-motion path (instant theme switch, no gallery animation, video posters).

## Stack and conventions

- Static HTML/CSS/JS, no build step, no modules. GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.13 (jsdelivr).
- All paths are absolute (`/css/…`, `/assets/…`), so every page works at any depth (404 included).
- CSS: `css/base.css` (fonts, tokens, resets), `css/home.css` (homepage), `css/site.css` (inner pages),
  `css/contact.css` (project form).
- JS: `js/base.js` (homepage Lenis + helpers), `js/home.js` (homepage), `js/theme.js` (theme + blinds; also the inner-page footer slide-up, styles at the end of `css/site.css`),
  `js/gallery.js` (gallery engine: coverflow, fan, stack, helix, grid, staircase, list + detail view),
  `js/case.js` (case-study galleries; each page lists its screens in `<script type="application/json" id="screens">`),
  `js/concepts.js`, `js/colophon.js`, `js/contact.js` (project form), `js/dot.js` (period portal).
- Period portal: `<a class="dotp" href="…" data-bleed="work|talk|concepts" aria-label="…"><span class="dotp__sq" aria-hidden="true"></span></a>`
  placed as the last child of a heading. Every homepage period (hero DISTINCTIVE WEBSITES, More work, Services, Concepts, Timeline, and the footer's DISCUSS A PROJECT `.press .sq.dotp`) leads to `/other-side/`; it cycles base → Fable → Neon → Hollow marks (`data-w`) and shows a glitching "To the other side" tag on hover/focus and once on first view. Styles at the end of `css/base.css` (colours per `data-bleed`); `js/dot.js`
  injects the SVG ink filters and bleed layers and runs the click flood. Add `data-pf-open` to open the form instead.
- Pages: `/`, `/work/{ganko,luumens,voyagaer,industmarine}/`, `/concepts/` (+ the concept homepages,
  self-contained), `/colophon/`, `/404.html`. Case studies run 01 / 04 Ganko → Luumens → Voyagaer →
  Industmarine; the homepage deck (`WORK` in `js/home.js`) and the "Next project" footers follow that order.
- Contact: any `[data-pf-open]` link opens the form in place (base.js's Lenis anchor scroll skips them), which `js/contact.js` builds on the page. It posts to
  `functions/api/contact.js` (Turnstile + Resend). Field names must match the function.
- Images are WebP. `_headers` sets caching (CSS/JS always revalidate) and security headers.
- Every repo file deploys. `functions/_middleware.js` returns the 404 page for working files
  (CLAUDE.md, READMEs, .gitignore); `_routes.json` limits which paths run functions. Add any new
  function route (e.g. `/api/*`) and any new private file to both.
- Search: titles name "Noah Zaw Min Htut"; Person/WebSite JSON-LD on the homepage; canonical
  URLs on every page; update `sitemap.xml` lastmod when pages change.

## The Other Side (live at /other-side/)

- Self-contained page in `other-side/` (own css/js/fonts/assets, absolute paths, no GSAP/Lenis): a selector and three
  worlds on hash routes (#fable, #neon, #hollow). The Fable: Little Rösti, Common Table, Crumb & Kin. Neon District:
  Pixel Pull + build notes. The Hollow: three studies made for the page + an honest "opening" note. No invented projects.
- Neon building: `other-side/js/district.js` (ES module, Three.js r170 self-hosted in `other-side/vendor/`), loaded by app.js
  when Neon opens and WebGL2 exists; GLSL floor material; talks to app.js via `data-on` and `floor` events; CSS floors are the fallback.
- Hollow Study 3 "Ink": `other-side/js/ink.js`, raw WebGL2 fragment shader (exported `FRAG` is shown on the page).
- Screens in `other-side/assets/` are captures of the anonymised concept builds; each project links to `/concepts/<slug>/`.
- Portal handshake kept: reads `os-from` on arrival, writes `os-return` on "Back to the portfolio" / Esc on the selector.
- Not linked from the live homepage yet (the full-stop portal is on `redesign-5`).

## Pitfalls already hit (don't repeat)

- The Ganko pin (`stageIn` / `stageOut` / `total` and `end: '+=160%'` in `js/home.js`) keeps its last stage
  on screen; don't add an exit or the section ends on an empty screen.
- The hero headline is measured at its resting width (`fit()` includes margins); measure after fonts load.
- Industmarine screenshots were rendered from saved pages without photos (the sandbox can't reach the live
  site). Replace `assets/images/industmarine-*.webp` with real captures when available.
- Homepage performance: never read layout (getBoundingClientRect, scrollHeight, scrollY) after writing
  styles in a ticker or scroll handler. Use `sy()` (Lenis scroll), cached measurements refreshed on
  ScrollTrigger refresh, and transforms only for anything that moves every frame (the reel flyer).
  Videos play only while on screen. No backdrop-filter on moving elements.
- Loader (homepage, first visit per session, motion allowed): `.has-loader` from the head script, markup
  at the top of `<body>`, styles at the end of `css/home.css`, timeline `runLoader()` in `js/home.js`. Its final
  word is a copy of the hero's first line placed over it; keep the hero's first line and the loader in step.
  Fallbacks: removed on `load` if GSAP is missing; CSS hides it after 4.5s; a 7s timer forces the end.
- The top nav collapses into the Menu pill below 1280px; the six links don't fit beside the buttons.
- Test scripts must not write files into the repo.

## Testing before pushing

- Serve locally: `python3 -m http.server 8766` in the repo root.
- Playwright (Chromium is preinstalled). Route the CDN scripts to local copies of the same
  versions if the CDNs are unreachable.
- Check 2560, 1920, 1440, 1280, 1024 (touch), 820 (touch), 390 and 360; both themes; reduced
  motion. Look for console errors, horizontal overflow (`scrollWidth - innerWidth`), nav
  collisions, and compare screenshots scrolling down vs up for scroll-driven work.
- `node --check` every changed JS file.
