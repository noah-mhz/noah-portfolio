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
```

## Visual system

- **Index** — projects are `01 / 05` … `05 / 05`; the same index appears in the
  project heads, the pinned sequence and the navigation status.
- **Sections** — `(01)` … `(06)` labels in mono, accent on the number.
- **Coordinates** — bookends only: hero metadata and footer.
- **Grid** — four fixed columns; the discipline words start on its lines and
  the capability preview travels along the third. The grid lights at contact.
- **Viewfinder marks** — corner ticks frame what the page points at: project
  images (on hover), the pinned case image, the capability preview, the CTA.
- **Text** — `data-split="lines|words|chars"` + `data-reveal="text"`. Lines for
  statements, words for short headings, chars only for project titles and the index.

## Replacing placeholders

- Images: every project image is an Unsplash placeholder (marked with a comment).
  Replace with screenshots of each live site, e.g. `assets/img/luumens.jpg`,
  keep the `width`/`height` attributes and update the `alt` text.
- LinkedIn and GitHub URLs in the footer.

## Motion tiers (gsap.matchMedia)

- Desktop ≥1024px: pinned Ganko sequence with the next project rising over its
  release, scrubbed project paths, parallax, scroll-velocity response, cursor,
  magnetic elements, grid-locked capability preview.
- Tablet: sequences unpinned and revealed in place; no cursor or velocity.
- Mobile <768px: reduced type scale, once-only reveals, no parallax or drift,
  shorter discipline pin; the nav status opens the links on tap.
- prefers-reduced-motion: no Lenis, no intro, no scroll animation — content static.
