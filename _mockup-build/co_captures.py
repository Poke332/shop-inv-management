"""Render the 3-step checkout wizard capture set.

Writes _mockup-build/out/checkout-step{1,2,3}.html from the tracked generator
source (pages_storefront._co_page) so each wizard state is independently
screenshot-able. out/checkout.html (build_html.py) IS the step-1 render.

Usage:  python3.12 _mockup-build/co_captures.py
Then screenshot desktop 1312x736 with snap chromium; the 390px mobile
step-3 capture (sticky bottom CTA bar) uses CDP device emulation
(see co_captures_mobile.js).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lib import page_wrap
from pages_storefront import CO_CSS, _co_page

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "_mockup-build", "out")
os.makedirs(OUT, exist_ok=True)

for step in (1, 2, 3):
    html = page_wrap(_co_page(step), CO_CSS, f"Checkout — step {step} of 3")
    path = os.path.join(OUT, f"checkout-step{step}.html")
    with open(path, "w") as f:
        f.write(html)
    print(f"wrote {os.path.relpath(path, os.getcwd())} ({len(html)} bytes)")
