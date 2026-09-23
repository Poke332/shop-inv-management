"""Build the 4-state checkout-wizard capture set from the tracked generator.

Writes _mockup-build/out/*.html for each wizard state by reusing the
module-level builders (page_wrap / _co_page / CO_CSS) — no duplicated markup.

States -> out names (rendered by render.py-style headless Chromium into
docs/checkout/*.png; see docs/checkout/design.md VISUALIZATION):
  1 -> checkout.html                  (step 1 — Personal info)
  2 -> checkout-step2-shipping.html   (step 2 — Shipping)
  3 -> checkout-step3-payment.html    (step 3 — Payment, "Place order" visible)
  4 -> checkout-receipt.html          (step 4 — receipt confirmation)

Usage:  python3.12 _mockup-build/capture_checkout.py
Then:   /snap/bin/chromium --headless --no-sandbox --disable-gpu \
          --disable-dev-shm-usage --hide-scrollbars --virtual-time-budget=5000 \
          --screenshot=<docs/checkout/mockup[-suffix].png> --window-size=1312,736 \
          file://<ROOT>/_mockup-build/out/<name>.html
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lib import page_wrap
from pages_storefront import CO_CSS, _co_page, _STEP  # noqa: F401

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "_mockup-build", "out")
os.makedirs(OUT, exist_ok=True)

CAPTURES = [
    (1, "checkout.html"),
    (2, "checkout-step2-shipping.html"),
    (3, "checkout-step3-payment.html"),
    (4, "checkout-receipt.html"),
]

for step, outname in CAPTURES:
    html = page_wrap(_co_page(step), CO_CSS, "Checkout")
    path = os.path.join(OUT, outname)
    with open(path, "w") as f:
        f.write(html)
    print(f"step {step} -> {outname} ({len(html)} bytes)")
print(f"capture_checkout: {len(CAPTURES)} HTML written to _mockup-build/out/")
