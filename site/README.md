# alexbaro.com — v4

A static site: plain HTML, CSS and JavaScript. No build step, no dependencies.

```
index.html        page markup and content
styles.css        all styling, light and dark themes
main.js           theme toggle, drifting aurora blobs, binary background, live spec labels,
                  scroll blobs, coffee status
assets/portrait.webp
assets/fonts/      JetBrains Mono (self-hosted, SIL OFL 1.1)
assets/*.png, favicon.ico, assets/favicon.svg, site.webmanifest   icons
```

## Run locally
Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000

## Deploy
Upload the whole folder to any static host (GitHub Pages, Netlify, Cloudflare Pages,
S3 + CloudFront, or your current host). `index.html` is the entry point.

The résumé link points to `https://www.alexanderbaro.com/AVBaro_Resume.pdf`, so keep
that file at the same path, or drop it into `assets/` and update the link in `index.html`.

## Editing
- Text and experience: edit `index.html` directly (each role is an `<article class="role">`).
- Colours: the CSS variables at the top of `styles.css` (`--accent` purple, `--accent-2` teal).
- Coffee hours: `updateStatus()` in `main.js` (7 AM – 6 PM Pacific).
- Cursor lag / return speed: `LAG` and `RETURN` in `main.js`.

## Error pages (404 / 403)
`404.html` and `403.html` are self-contained (styles and script inlined), so they work from
any URL depth and can be uploaded on their own. They show the path the visitor asked for.

### S3 static website hosting
Bucket → Properties → Static website hosting → Error document: `404.html`.
(S3 website hosting supports one error document for every error code.)

### CloudFront (recommended)
Distribution → Error pages → Create custom error response:

| HTTP error code | Response page path | HTTP response code | Error caching min TTL |
|---|---|---|---|
| 404 | `/404.html` | 404 | 10 |
| 403 | `/404.html` *or* `/403.html` | 404 *or* 403 | 10 |

With a private S3 bucket behind CloudFront (Origin Access Control), S3 answers **403**
for files that don't exist, because CloudFront isn't allowed to list the bucket. So a
missing page arrives as a 403. Most sites map 403 → `/404.html` with a 404 response.
Use `/403.html` only if you have paths that really are off-limits.
