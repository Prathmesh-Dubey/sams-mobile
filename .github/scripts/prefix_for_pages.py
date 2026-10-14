"""Prefix root-absolute links with the GitHub Pages project path.

A project site is served at https://<user>.github.io/<repo>/, so links like
/css/style2.css would resolve to https://<user>.github.io/css/style2.css (404).
Run on the publish copy only; the source files stay identical to the live site.

usage: prefix_for_pages.py <site_dir> <base_path, e.g. /sams-mobile>
"""
import os
import re
import sys

root, base = sys.argv[1], sys.argv[2].rstrip("/")

# names that live at the top level of the site (css, js, img, markets, ...)
top = sorted(os.listdir(root), key=len, reverse=True)
top_names = [re.escape(os.path.splitext(n)[0] if n.endswith(".html") else n) for n in top if not n.startswith(".")]
top_alt = "|".join(top_names)

# attributes whose value is a single URL (action is left alone: /api/ has no backend on Pages)
attr_re = re.compile(r'''(\b(?:href|src|poster|data-img|data-src|data-poster)\s*=\s*)(["'])/(?!/)''')
srcset_re = re.compile(r'''(\b(?:srcset|imagesrcset)\s*=\s*)(["'])(.*?)\2''', re.S)
css_url_re = re.compile(r'''(url\(\s*)(["']?)/(?!/)''')
# string literals in JS that point at a top-level folder/page of the site
js_re = re.compile(r'''(["'`])/(?=(?:%s)(?:[/?#"'`]|\.))''' % top_alt)


def fix_srcset(m):
    parts = []
    for item in m.group(3).split(","):
        s = item.strip()
        if s.startswith("/") and not s.startswith("//"):
            s = base + s
        parts.append(s)
    return m.group(1) + m.group(2) + ", ".join(parts) + m.group(2)


def process(text, ext):
    if ext in (".html", ".htm"):
        text = attr_re.sub(lambda m: m.group(1) + m.group(2) + base + "/", text)
        text = srcset_re.sub(fix_srcset, text)
        text = css_url_re.sub(lambda m: m.group(1) + m.group(2) + base + "/", text)
        text = js_re.sub(lambda m: m.group(1) + base + "/", text)  # inline <script>
    elif ext == ".css":
        text = css_url_re.sub(lambda m: m.group(1) + m.group(2) + base + "/", text)
    elif ext == ".js":
        text = js_re.sub(lambda m: m.group(1) + base + "/", text)
    elif ext in (".webmanifest", ".json"):
        text = re.sub(r'("(?:src|start_url|scope|url)"\s*:\s*")/(?!/)', lambda m: m.group(1) + base + "/", text)
    return text


changed = 0
for dp, dn, fn in os.walk(root):
    for f in fn:
        ext = os.path.splitext(f)[1].lower()
        if ext not in (".html", ".htm", ".css", ".js", ".webmanifest", ".json"):
            continue
        p = os.path.join(dp, f)
        with open(p, encoding="utf-8", newline="") as fh:
            t = fh.read()
        n = process(t, ext)
        if n != t:
            with open(p, "w", encoding="utf-8", newline="") as fh:
                fh.write(n)
            changed += 1
print(f"prefixed {changed} files with {base}")
