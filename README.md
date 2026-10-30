# Noah — Portfolio

Static site. No build step. Deploy the folder as-is to Cloudflare Pages
(framework preset: None, build command: empty, output directory: `/`).

## Structure

```
index.html
css/style.css        design tokens (:root) + all styles
js/main.js           boot / orchestration
js/scroll.js         Lenis ↔ GSAP ticker sync, anchor navigation
js/split.js          line / word / char splitting for masked reveals
js/animations.js     intro, text reveals, project choreography, pinned Ganko
                     sequence, discipline stack, timeline, section transitions
js/navigation.js     section-aware navigation + page progress
js/interactions.js   cursor, magnetic elements, hover choreography, clock
js/project.js        entry for case-study pages: hero, media reveals, scroll-through
css/project.css      case-study page styles
work/ganko/          Ganko.sg case study (template for further project pages)
work/luumens/        Luumens case study
work/voyagaer/       Voyagaer case study
js/transition.js     homepage → case study page transition (image expands, then settles)
js/contact.js        "Start a project" popup form (animation, validation, Turnstile)
functions/api/contact.js  Cloudflare Pages Function: verifies Turnstile, emails via Resend
```

## Visual system

- **Index** — projects are `01 / 05` … `05 / 05` in the project heads, the
  pinned sequence and the navigation status. Selected Work opens with a label only.
- **Sections** — mono labels led by a short mint rule; no numbering.
- **Coordinates** — bookends only: hero metadata and footer.
- **Grid** — four fixed columns; the discipline words start on its lines and
  the capability preview travels along the third. At contact each line redraws.
- **Viewfinder marks** — corner ticks frame what the page points at: project
  images (on hover), the pinned case image, the capability preview, the CTA.
- **Text** — `data-split="lines|words|chars"` + `data-reveal="text"`. Lines for
  statements, words for short headings, chars only for project titles and the index.

## Replacing placeholders

- Ganko.sg uses real captures: `assets/images/ganko-home-*.webp` and the looping
  `assets/video/ganko-scroll.mp4` (plays only in view; poster for reduced motion).
- Luumens uses real captures: `assets/images/luumens-*.webp` (homepage card: `luumens-card-poster.webp` + `assets/video/luumens-card.mp4`, plays on hover / when centred on touch)
  and `assets/video/luumens-*.mp4` (hero, scroll, menu, tabs, htmfc).
- Voyagaer uses real captures: `assets/images/voyagaer-*.webp` (homepage card: `voyagaer-card-poster.webp` + `assets/video/voyagaer-card.mp4`)
  and `assets/video/voyagaer-scroll.mp4`.
- Images: Craftism and Evnergy are still Unsplash placeholders (marked with a comment).
  Replace with screenshots of each live site, e.g. `assets/images/craftism.webp`,
  keep the `width`/`height` attributes and update the `alt` text.
- LinkedIn and GitHub URLs in the footer.

## Motion tiers (gsap.matchMedia)

- Hero: a project reel sits inside the headline (`.hero__reel`; swap its video to
  feature another project). Desktop: the hero holds briefly while the headline
  clears, and a copy of the reel (`.reel-flyer`) grows — smoothed, across the
  whole trip — into the Ganko case image's pinned spot, then hands over to it
  (`initReelHandoff`). Tablet/mobile: the reel stays in the headline and each
  line fades before it reaches the nav. Fine pointers: title weight follows the
  cursor (variable Inter Tight, `[data-weight]`).
- Desktop ≥1024px: pinned Ganko sequence with the next project rising over its
  release, scrubbed project paths, parallax, scroll-velocity response, cursor,
  magnetic elements, grid-locked capability preview.
- Tablet: sequences unpinned and revealed in place; no cursor or velocity.
- Mobile <768px: reduced type scale, once-only reveals, no parallax or drift,
  shorter discipline pin; the nav status opens the links on tap.
- prefers-reduced-motion: no Lenis, no intro, no scroll animation — content static.

## Contact form

"Start a project" opens a popup form that posts to `/api/contact`, a Cloudflare
Pages Function. It checks a Cloudflare Turnstile token and sends the enquiry to
your inbox through Resend. Set these in Cloudflare Pages → Settings → Variables
and Secrets: `RESEND_API_KEY` (secret), `TURNSTILE_SECRET_KEY` (secret),
`TURNSTILE_SITE_KEY`, `CONTACT_TO`. Without JavaScript the button is a plain
mailto link.

## Design system notes

- Fonts are self-hosted in `assets/fonts/` (Inter Tight variable 100–900, JetBrains Mono 400/500, Latin).
- Type scale tokens: `--fs-meta`, `--fs-small`, `--fs-body`, `--fs-lead`, `--fs-title`, `--fs-section`,
  `--fs-hero`, `--fs-display`. Mono (`.label`) is for metadata only; readable content uses Inter Tight.
- Mint (`--accent`) marks things you can act on, plus one accent per section. Each case study sets
  its own `--accent` on `<body>` (Ganko #F0453B, Luumens #E33F4D, Voyagaer #48BDA9).

