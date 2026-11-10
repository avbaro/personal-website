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

## History

The 2020 version of the site (v1) is kept on the `archive/v1` branch.
