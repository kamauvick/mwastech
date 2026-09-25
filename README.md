# MWASTECH Technologies — Website

Static marketing site for MWASTECH Technologies, focused on water purification and water vending machines. Plain HTML, CSS and JavaScript: no build step, no backend.

## Files

| Path | Purpose |
|---|---|
| `index.html` | The whole page: hero, machines (cut-out photos), How it works (machine picker with isometric drawings), process, earnings estimator, FAQ, contact |
| `styles.css` | All styling. Colour and font tokens are at the top in `:root` |
| `script.js` | Navigation, scroll reveals, the machine picker, the estimator and the WhatsApp form |
| `images/` | Optimised photos, the logo mark and the favicon. `images/cutouts/` holds the background-removed machine photos (transparent WebP) |
| `logo/`, `*.jpg` in root | Original source images (not used directly by the site) |
| `tools/isometric.mjs` | Generates the isometric machine drawings (run with Node) |
| `legacy/` | Earlier versions: the original site, `v2-scroll-lens/`, `v3-isometric/`, and `v4-clean/` (before the scroll-flow work) |

## Editing common things

- **Phone / WhatsApp number**: search `index.html` and `script.js` for `254790019763` and `0790 019 763`.
- **Email**: search for `info@mwastech.com`.
- **Social links**: search for `facebook.com`, `youtube.com` and `tiktok.com`.
- **Machines row**: each `<li class="shop-item">` in `#machines` is one cut-out photo with a name and an "Ask for price" WhatsApp link. New photos should be background-removed PNG/WebP with a transparent background, trimmed tight to the machine.
- **How it works**: each machine has a `.machine-tab` button and a `.machine-panel` (drawing, steps and the short Inside / Your customer / You notes), linked by `data-machine`. The tab's `data-product` must match an option in `<select id="fProduct">`.
- **Drawings**: edit the scene functions in `tools/isometric.mjs`, run `node tools/isometric.mjs`, and paste the new SVG from `tools/iso.json` into that machine's `.iso-art`. The step badges (01, 02...) in each drawing should match its step list.
- **Colours**: change `--blue`, `--aqua` and `--sun` in `:root` in `styles.css`.

## Scroll flow

Everything tied to scroll position runs in one `requestAnimationFrame` loop in `script.js` ("Scroll flow"):

- **Page colour**: each light section has a `data-tone` (`white` or `stone`), and the page background glides between neighbouring tones as you scroll. Add `data-tone` to a new section to include it.
- **Contact sheet**: the dark contact block (`data-tone="ink"`) keeps its own colour and rises in with rounded shoulders that widen to full width.
- **Hero hand-off**: the headline lifts away, the drawing lags behind and the orange line finishes drawing.
- **Header**: tucks away when scrolling down, returns when scrolling up, with an orange progress line.
- **Reveals**: add `class="reveal"` to one element, or `data-stagger` to a container to stagger its children.

With "reduce motion" turned on, the movement is skipped and only the colour change and plain reveals remain.

## How enquiries work

The quote form doesn't need a server. It opens WhatsApp (`wa.me/254790019763`) with the customer's name, location, phone, chosen machine and message already filled in. There is also an option to send the same text by email.

## Running and deploying

Open `index.html` in a browser to preview. The live site is GitHub Pages at https://kamauvick.github.io/mwastech/. The `gh-pages` branch holds only the served files (`index.html`, `styles.css`, `script.js`, the images the page uses, and `.nojekyll`), and `main` holds this source.

**Every deploy:** change the `?v=` tag on the `styles.css` and `script.js` links in `index.html` (for example `?v=20261002`). Browsers cache these files for about 10 minutes and would otherwise pair the new page with an old stylesheet.
