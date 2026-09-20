"""Render 13 mockups: build HTML, screenshot via headless Chromium, check bytes."""
import sys, os, subprocess, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ROOT = "/home/richie/projects/web-mobile-project"
OUT = os.path.join(ROOT, "_mockup-build", "out")
os.makedirs(OUT, exist_ok=True)

from pages_ops import PAGES  # pulls in pages_storefront + pages_auth too

PAGES_ORDER = [
    "login", "register", "main-store", "search-browse", "product-details",
    "cart", "checkout", "orders-placed", "inventory-dashboard",
    "per-product-dashboard", "per-product-review-panel", "ongoing-orders",
    "user-dashboard",
]

CHROMIUM = "/snap/bin/chromium"
ARGS = ["--headless", "--no-sandbox", "--disable-gpu",
        "--disable-dev-shm-usage", "--hide-scrollbars"]

results = []
for p in PAGES_ORDER:
    html_path = os.path.join(OUT, p + ".html")
    png_path = os.path.join(OUT, p + ".png")
    with open(html_path, "w") as f:
        f.write(PAGES[p])
    cmd = [CHROMIUM] + ARGS + [f"--screenshot={png_path}",
                                "--window-size=1312,736", "file:///" + html_path]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    ok = r.returncode == 0 and os.path.exists(png_path) and os.path.getsize(png_path) > 20000
    size = os.path.getsize(png_path) if os.path.exists(png_path) else 0
    results.append((p, ok, size, r.stdout.strip()[-80:] if r.stdout else r.stderr.strip()[-200:]))
    print(f"{p:28s} {'OK ' if ok else 'FAIL'} {size:>8d}  {r.stdout.strip()[-40:]}")

failed = [r for r in results if not r[1]]
print("\nDONE:", len(results) - len(failed), "/", len(results), "ok")
if failed:
    print("FAILED:", [r[0] for r in failed])
    for p, _, _, err in failed:
        print(f"--- {p} ---\n{err}")
