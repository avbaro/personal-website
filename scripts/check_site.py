#!/usr/bin/env python3
"""Pre-deploy checks for the static site in site/.

1. Size budget: no image over 500 KB, and the whole site under 5 MB.
2. Local references: every src/href in the HTML files and every url() in the
   CSS files that points at this site must resolve to a file in site/.
   External links (https://other-host, mailto:) are not checked.

Exits non-zero and lists every problem if anything fails.
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

SITE = Path(__file__).resolve().parent.parent / "site"
OWN_HOSTS = {"www.alexanderbaro.com", "alexanderbaro.com"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico"}
IMAGE_MAX = 500 * 1024
SITE_MAX = 5 * 1024 * 1024


class RefCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ("src", "href") and value:
                self.refs.append(value)


def resolve(ref, page):
    """Return the site path a reference points at, or None if it's external."""
    u = urlparse(ref)
    if u.scheme in ("mailto", "tel", "data", "javascript"):
        return None
    if u.scheme in ("http", "https"):
        if u.hostname not in OWN_HOSTS:
            return None
        path = u.path
    elif u.scheme:
        return None
    else:
        path = u.path
    if not path or path.startswith("#"):
        return None
    if path.startswith("/"):
        target = SITE / path.lstrip("/")
    else:
        target = page.parent / path
    if path.endswith("/") or target == SITE:
        target = SITE / "home.html"
    return target


def main():
    problems = []

    files = [p for p in SITE.rglob("*") if p.is_file()]
    total = sum(p.stat().st_size for p in files)
    for p in files:
        size = p.stat().st_size
        if p.suffix.lower() in IMAGE_EXT and size > IMAGE_MAX:
            problems.append(f"too large: {p.relative_to(SITE)} is {size // 1024} KB (limit {IMAGE_MAX // 1024} KB)")
    if total > SITE_MAX:
        problems.append(f"site is {total // 1024} KB in total (limit {SITE_MAX // 1024} KB)")

    checked = 0
    for page in SITE.rglob("*.html"):
        collector = RefCollector()
        collector.feed(page.read_text(encoding="utf-8"))
        for ref in collector.refs:
            target = resolve(ref, page)
            if target is None:
                continue
            checked += 1
            if not target.is_file():
                problems.append(f"broken reference in {page.relative_to(SITE)}: {ref}")
    for css in SITE.rglob("*.css"):
        for ref in re.findall(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", css.read_text(encoding="utf-8")):
            target = resolve(ref, css)
            if target is None:
                continue
            checked += 1
            if not target.is_file():
                problems.append(f"broken reference in {css.relative_to(SITE)}: {ref}")

    print(f"{len(files)} files, {total // 1024} KB total, {checked} local references checked")
    if problems:
        print("\n".join(f"FAIL {p}" for p in problems))
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
