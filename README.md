# alexanderbaro.com

Source for [www.alexanderbaro.com](https://www.alexanderbaro.com), a static single-page site (v3).

## Layout

```
site/                          Everything in here is published to the site root
  home.html                    Landing page (CloudFront default root object)
  error.html                   404 page
  style.css, script.js
  AVBaro_Resume.pdf
  personal-website-v3-assets/  Fonts, images, favicons, wordmarks
```

## Hosting

- S3 bucket `www.alexanderbaro.com` (us-east-1) holds the files.
- CloudFront distribution `EDDWWKADONCMF` serves `www.alexanderbaro.com` and `alexanderbaro.com`.
- The CloudFront function `apex-to-www-redirect` sends `alexanderbaro.com` to `https://www.alexanderbaro.com` with a 301.
- DNS and the TLS certificate are in Route 53 and ACM.

## Deploying

GitHub Actions (`.github/workflows/site.yml`) handles everything:

- **Every pull request** runs the checks: an image size budget (500 KB per image, 5 MB total), a check that local links and asset paths resolve (`scripts/check_site.py`), and HTML validation.
- **Every push to `master`** runs the checks, then deploys:
  - It syncs `site/` to S3 with cache headers by file type: HTML always revalidates, CSS/JS/PDF cache for 1 hour, and images and fonts for 7 days.
  - It invalidates CloudFront and runs a smoke test against the live site.
- **Manual redeploy:** Actions → Site → Run workflow.

The workflow signs in to AWS with GitHub OIDC, so there are no stored keys. It uses the role `github-deploy-personal-website`, which only the `master` branch of this repo can assume. That role can only write to the site bucket and invalidate this one distribution. The one-time setup is in `infra/setup.sh`, which an admin runs (for example, in AWS CloudShell).

**Rolling back:** revert the commit on `master`. S3 versioning also keeps old file versions for 30 days.

## History

The 2020 version of the site (v1) is kept on the `archive/v1` branch.
