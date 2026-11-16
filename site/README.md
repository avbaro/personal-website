# alexbaro.com — v4

A static site: plain HTML, CSS and JavaScript. No build step, no dependencies.

```
index.html         Page markup and content
styles.css          All styling, light and dark themes, including the
                     flash animation and the tablet (721–1023px) layout
main.js              Theme toggle (persisted + favicon sync), drifting
                     aurora blobs, binary background, live spec labels,
                     scroll-driven footer blobs, smooth in-page scrolling,
                     contact-box flash, coffee status
404.html, 403.html   Self-contained error pages (styles/script inlined
                     so they work from any URL depth or on their own)
AVBaro_Resume.pdf
assets/portrait.webp
assets/fonts/        JetBrains Mono (self-hosted, SIL OFL 1.1)
assets/favicon-light.svg, favicon-dark.svg, favicon-theme.js
                      Favicon follows the theme toggle, not just OS
                     preference — favicon-theme.js swaps the <link> on
                     every data-theme change
assets/*.png, favicon.ico, assets/favicon.svg, site.webmanifest
                      Fallback icons
```

## Run locally
Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000

## Deploy
See the root `README.md` for the actual pipeline (GitHub Actions → S3 +
CloudFront). In short: `site/` is synced to the bucket root as-is, so
`index.html` must stay the entry point and absolute paths (`/styles.css`,
`/assets/...`) must stay valid from the site root.

The résumé link points at `https://www.alexanderbaro.com/AVBaro_Resume.pdf`,
so keep that file at the same path, or drop it into `assets/` and update the
link in `index.html`.

## Editing
- **Text and experience:** edit `index.html` directly (each role is an
  `<article class="role">`).
- **Colours:** the CSS variables at the top of `styles.css` — `--accent`
  (purple) and `--accent-2` (teal), each theme overridden under
  `[data-theme="dark"]`.
- **Shell prompts:** the decorative `%` in front of each command (`% ping
  alex`, `% theme --`, `% open ...`) is a zsh-style prompt — literal text in
  `index.html`/`403.html`/`404.html`, not generated.
- **Coffee hours:** `updateStatus()` in `main.js` — caffeinated 7 AM–6 PM
  Pacific, checked once a minute.
- **Aurora drift:** each blob in the `blobs` array in `main.js` has a `home`
  position and a wander `range` (both in % of the hero box); `waves()`
  layers three sine waves per axis with random 28–75s periods so the path
  never repeats. Pauses automatically when the hero scrolls off-screen, and
  is disabled for `prefers-reduced-motion`.
- **Contact-box flash:** triggered from the smooth-scroll handler in
  `main.js` once the "% ping alex" jump lands; the look (iteration count,
  duration, tint colour) is all in the `.contact-list.flash` /
  `@keyframes contact-flash` rule in `styles.css`.
- **Smooth-scroll duration/easing:** `duration` and the `ease()` function in
  the in-page-jump handler in `main.js` (currently 700ms, ease-in-out cubic).

**Important:** `index.html`, `403.html`, and `404.html` each have one inline
`<script>` in `<head>` that prevents a flash of the wrong theme before first
paint. Their exact text is allowlisted by SHA-256 hash in a CloudFront
Function that is *not* part of this repo (see the root `README.md`'s CSP
section) — if you edit that inline script's content, you must update the
hash there too, or the browser will silently block it.

## Error pages (404 / 403)
`404.html` and `403.html` are self-contained (styles and script inlined), so
they work from any URL depth and can be uploaded on their own. They show the
path the visitor asked for, and the usual theme toggle/favicon/aurora
behavior all work the same as on the homepage.

As currently wired on this site's CloudFront distribution, **both** HTTP 403
and HTTP 404 errors map to `/404.html` (not `/403.html`) — see the root
README for why and how to change it.

### S3 static website hosting
Bucket → Properties → Static website hosting → Error document: `404.html`.
(S3 website hosting supports one error document for every error code.)

### CloudFront (recommended)
Distribution → Error pages → Create custom error response:

| HTTP error code | Response page path | HTTP response code | Error caching min TTL |
|---|---|---|---|
| 404 | `/404.html` | 404 | 10 |
| 403 | `/404.html` *or* `/403.html` | 404 *or* 403 | 10 |

With a private S3 bucket behind CloudFront (Origin Access Control), S3 answers
**403** for files that don't exist, because CloudFront isn't allowed to list
the bucket. So a missing page arrives as a 403. Most sites map 403 →
`/404.html` with a 404 response. Use `/403.html` only if you have paths that
really are off-limits.
