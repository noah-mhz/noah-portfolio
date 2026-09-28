# Noah — Portfolio

Static site. No build step. Deploy the folder as-is to Cloudflare Pages
(framework preset: None, build command: empty, output directory: `/`).

## Structure

```
index.html
css/style.css        design tokens (:root) + all styles
js/main.js           boot / orchestration
js/scroll.js         Lenis ↔ GSAP ticker sync, anchor navigation
js/animations.js     intro, reveals, parallax, project scroll, pinned case study,
                     word stack, timeline, page transitions, nav state
js/interactions.js   cursor, magnetic elements, hover choreography, clock
js/split.js          word-split utility for masked text reveals
```

## Replacing placeholders

- Images: swap the Unsplash `src`/`srcset` URLs in `index.html` for local files
  (e.g. `assets/img/ganko-hero.jpg`). Keep the `width`/`height` attributes.
- Project links: Luumens, Voyagaer and Experiments point to `https://example.com`.
- Case-study outcome figures are placeholders (`data-count`, `data-prefix`,
  `data-suffix`, `data-decimals` drive the count-up).
- Email, LinkedIn and GitHub URLs in the contact section and footer.

## Motion tiers (gsap.matchMedia)

- Desktop ≥1024px: full choreography, pinned case study, parallax, cursor, magnetic.
- Tablet: case study unpinned, no custom cursor.
- Mobile <768px: reduced type scale, no parallax or horizontal drift, shorter pin.
- prefers-reduced-motion: no Lenis, no intro, no scroll animation — content static.
