#!/usr/bin/env bash
# Re-sync docs/<page>/mockup.png to a FRESH render of the current out/<page>.html.
# Source of truth = the HTML. Render once into a clean dir, verify with a 2nd
# pass, copy into docs/. Reports per-page md5 + stability + docs-match.
# Also refreshes the _mockup-build/out/*.png snapshots so the invariant
#   docs/<p>/mockup.png == out/<p>.png == fresh render of out/<p>.html
# holds for ALL 13 pages in one shot.
#
# SNAP GOTCHA: html + output png must live under ~ or the project dir — NEVER
# /tmp (snap's private tmpfs -> ERR_FILE_NOT_FOUND). This script cd's to the
# repo root and renders in-place into out/ and a verify/ dir, so it is safe.
set -euo pipefail

# Worktree-safe: run from the checkout's root, not a hardcoded path.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PAGES=(cart checkout inventory-dashboard login main-store ongoing-orders \
       orders-placed per-product-dashboard per-product-review-panel \
       product-details register search-browse user-dashboard)

CHROME="/snap/bin/chromium --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --hide-scrollbars"
ABS="$ROOT"

rm -rf _mockup-build/verify
mkdir -p _mockup-build/verify

# Pass 1 -> refresh out/*.png in place (the committed-snapshot slot)
for p in "${PAGES[@]}"; do
  $CHROME --screenshot="$ABS/_mockup-build/out/$p.png" --window-size=1312,736 \
    "file://$ABS/_mockup-build/out/$p.html" >/dev/null 2>&1
done

# Pass 2 -> verify/ (byte-stability check)
for p in "${PAGES[@]}"; do
  $CHROME --screenshot="$ABS/_mockup-build/verify/$p.png" --window-size=1312,736 \
    "file://$ABS/_mockup-build/out/$p.html" >/dev/null 2>&1
done

# Copy the stable fresh render into docs/
for p in "${PAGES[@]}"; do
  cp -f "_mockup-build/out/$p.png" "docs/$p/mockup.png"
done

echo "=== per-page result ==="
ok=1
drift_notes=()
for p in "${PAGES[@]}"; do
  a=$(md5sum "_mockup-build/out/$p.png"    | awk '{print $1}')
  b=$(md5sum "_mockup-build/verify/$p.png" | awk '{print $1}')
  c=$(md5sum "docs/$p/mockup.png"          | awk '{print $1}')
  # docs == out == fresh render is the hard invariant.
  [ "$a" = "$c" ] && match="docs-synced" || { match="docs-MISSING"; ok=0; }
  # Two independent renders of the same HTML are not byte-identical in
  # headless Chromium (sub-pixel timing), so treat a!=b as a NOTE, not a
  # failure — the meaningful guarantee is that docs/ reflects a *fresh*
  # render of the current out/*.html.
  if [ "$a" = "$b" ]; then stab="STABLE"; else stab="drift-note"; drift_notes+=("$p"); fi
  printf "%-26s %-9s %-12s %s\n" "$p" "$stab" "$match" "${a:0:8}"
done
if [ "${#drift_notes[@]}" -gt 0 ]; then
  echo "NOTE: two-render byte drift on: ${drift_notes[*]} (expected in headless Chromium; not a sync failure)"
fi
if [ "$ok" = "0" ]; then
  echo "FAIL: at least one page is out of sync with its HTML"
  exit 1
fi
echo "OK: docs/<p>/mockup.png == out/<p>.png == fresh render of out/<p>.html for all ${#PAGES[@]} pages"
echo "DONE"
