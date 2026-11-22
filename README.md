# Noah — Portfolio

Static site. No build step. Deploy the folder as-is to Cloudflare Pages
(framework preset: None, build command: empty, output directory: `/`).

**Versions:** this is v2. The previous design is kept on the `v1` branch; reset `main` to it
(or roll back in Cloudflare Pages → Deployments) to bring it back.

## Structure

```
index.html                 homepage
work/<slug>/index.html     case studies: ganko, luumens, voyagaer, industmarine
concepts/index.html        concepts archive (the concept homepages live in concepts/<slug>/)
colophon/index.html        how the site was made
404.html                   not found (absolute paths; served at any depth)

css/base.css               fonts, palette tokens (light + dark), resets
css/home.css               homepage
css/site.css               inner pages: header, galleries, detail view, text sections
css/contact.css            project form

js/base.js                 homepage: Lenis ↔ ScrollTrigger, anchors, splitChars, magnet, scramble
js/home.js                 homepage: hero, Ganko sequence, work deck, services scenes, timeline
js/theme.js                light / dark switch with the blinds transition (every page)
js/gallery.js              gallery engine: arrangements, drag/wheel/keys, detail view
js/case.js                 case-study galleries (screens listed in each page's #screens JSON)
js/concepts.js             concepts lookbook / archive
js/colophon.js             type specimen, clock, reveals
js/contact.js              project form (built on the page, opened by any [data-pf-open] link)

functions/api/contact.js   Cloudflare Pages Function: verifies Turnstile, emails via Resend
functions/_middleware.js   keeps repo notes (CLAUDE.md, READMEs) off the public site
```

## Adding a case study

Copy `work/industmarine/index.html`, change the head, the text sections and the `#screens` JSON
(`base` path prefix, `screens: [file, title, sub, caption]`, optional `href` / `cta`), add screenshots
to `assets/images/`, add the project to `WORK` in `js/home.js`, update the "Next project" footers
and `sitemap.xml`.

## Contact form

"Discuss a project" / "Start a project" open the form, which posts to `/api/contact`. Set these in
Cloudflare Pages → Settings → Variables and Secrets: `RESEND_API_KEY` (secret), `TURNSTILE_SECRET_KEY`
(secret), `TURNSTILE_SITE_KEY`, `CONTACT_TO`. Without JavaScript the links go to the homepage's contact
section.
