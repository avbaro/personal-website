# alexanderbaro.com

Source for [www.alexanderbaro.com](https://www.alexanderbaro.com) — a static,
single-page site (v4). Plain HTML, CSS and JavaScript: no build step, no
framework, no dependencies to install.

## Layout

```
site/                 Everything in here is published to the site root
  index.html           The page (hero, experience, contact)
  404.html, 403.html   Self-contained error pages (styles/script inlined)
  styles.css           All styling, light and dark themes
  main.js              Theme toggle, drifting aurora, binary background,
                        live spec labels, smooth in-page scrolling,
                        contact-box flash, coffee status
  AVBaro_Resume.pdf
  assets/              Fonts, icons, the portrait, the email wordmark images
scripts/check_site.py  Pre-deploy checks (see below)
infra/                 One-time AWS setup for the deploy role (see below)
.github/workflows/     CI + deploy
```

See `site/README.md` for how the page itself is put together and how to edit it.

## Hosting

- S3 bucket `www.alexanderbaro.com` (us-east-1) holds the files. Versioning is
  on, with a 30-day lifecycle rule that expires noncurrent versions — this is
  the rollback mechanism (see below).
- CloudFront distribution `EDDWWKADONCMF` serves both `www.alexanderbaro.com`
  and `alexanderbaro.com`, with `index.html` as the default root object.
- Two CloudFront Functions run on every request:
  - `apex-to-www-redirect` (viewer request) sends `alexanderbaro.com` to
    `https://www.alexanderbaro.com` with a 301.
  - `alexanderbaro-security-headers` (viewer response) sets the security
    headers: a strict CSP, `Strict-Transport-Security`, `X-Frame-Options`,
    and `Permissions-Policy`.
- Custom error responses: both HTTP 403 and HTTP 404 currently map to
  `/404.html` (returned as a 404). This is because the bucket sits behind an
  Origin Access Control with no public listing, so a missing object comes
  back from S3 as a 403 — CloudFront's error-response mapping is what turns
  that into the visitor-facing 404 page. `site/403.html` still exists and is
  reachable by its direct URL, but nothing currently routes an error to it.
- DNS and the TLS certificate are in Route 53 and ACM.

### Content-Security-Policy and the inline scripts

The CSP is **not** part of this repo or the deploy workflow — it's set by
hand on the `alexanderbaro-security-headers` CloudFront Function, directly in
the AWS console/CLI. It allowlists exactly four inline `<script>` blocks by
SHA-256 hash (`script-src 'self' 'sha256-...' ...`): the theme-flash-prevention
script that runs in `<head>` of each HTML file.

**If you ever edit the text of an inline `<script>` block** in `index.html`,
`403.html`, or `404.html`, its hash changes and the browser will silently
block it under the existing CSP. Recompute the hash and update the
CloudFront Function's code before (or right after) deploying:

```python
import hashlib, base64
script_text = "...exact inline script contents, no <script> tags..."
print("sha256-" + base64.b64encode(hashlib.sha256(script_text.encode()).digest()).decode())
```

Editing `main.js` or `styles.css` (external files) never touches the CSP —
only literal edits to inline `<script>` content do.

## Deploying

GitHub Actions (`.github/workflows/site.yml`) handles everything:

- **Every pull request** runs the checks: an image size budget (500 KB per
  image, 5 MB total for the whole site) and a check that every local
  `href`/`src`/`url()` resolves to a real file (`scripts/check_site.py`), then
  HTML validation (`html-validate`).
- **Every push to `master`** runs the same checks, then deploys:
  - Syncs `site/` to S3 with cache headers by file type: images/fonts/icons
    cache 7 days, CSS/JS/PDF cache 1 hour, HTML always revalidates.
  - Invalidates the whole CloudFront distribution and waits for it to finish.
  - Runs a smoke test against the live site (`/`, `/styles.css`, `/main.js`,
    `/assets/portrait.webp`, `/AVBaro_Resume.pdf`, and a 404 check).
- **Manual redeploy:** Actions → Site → Run workflow.

The workflow signs in to AWS with GitHub OIDC, so there are no stored keys.
It assumes the role `github-deploy-personal-website`, which only the
`master` branch of this repo can assume, and which can only write to the
site bucket and invalidate this one distribution. The one-time setup is in
`infra/setup.sh`, which an admin runs once (for example, in AWS CloudShell);
it reads the account ID from the signed-in session rather than from a file.

The AWS account ID itself is deliberately kept out of this public repo. The
two policy files under `infra/` use the placeholder `ACCOUNT_ID_PLACEHOLDER`
instead of the real number — `setup.sh` substitutes it in at apply time,
into a temp copy that's never written back to the repo. The workflow needs
the account ID too (to build the role ARN it assumes), so it's stored as a
repository **Variable** (Settings → Secrets and variables → Actions →
Variables) named `AWS_ACCOUNT_ID`, referenced as `${{ vars.AWS_ACCOUNT_ID }}`
— a Variable, not a Secret, since nothing about it is sensitive enough to
need redaction, but it still keeps the digits out of the diff-able, grep-able
source. Note this isn't a hard security boundary: the Actions run logs for a
public repo are themselves public, and the "configure AWS credentials" step
can end up echoing the assumed role ARN (account ID included) into them
regardless of where the ARN's text lives in this repo.

**Rolling back:** revert the commit on `master` and let the pipeline
redeploy, or restore a previous object version directly in S3 — versioning
keeps noncurrent versions for 30 days.

## History

The 2020 version of the site (v1) is kept on the `archive/v1` branch.
