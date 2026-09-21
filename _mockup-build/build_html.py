"""HTML-only rebuild of the 13 out/*.html files from tracked generator source.

Used by verify_framework.sh so the conformance gate always scans HTML that
matches the *committed* lib.py / pages_*.py on the branch it runs on — even on
a fresh clone or a git worktree where _mockup-build/out/ has never been built.
No Chromium, no PNGs (those stay in render.py).

Worktree-safe: ROOT is derived from this file's location, not hardcoded.
Requires python3.12 (the generator uses PEP-701 nested f-strings).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pages_ops import PAGES  # pulls in pages_storefront + pages_auth

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "_mockup-build", "out")
os.makedirs(OUT, exist_ok=True)

for p, html in PAGES.items():
    with open(os.path.join(OUT, p + ".html"), "w") as f:
        f.write(html)
print(f"build_html: {len(PAGES)} HTML written to _mockup-build/out/")
