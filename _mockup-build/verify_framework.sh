#!/usr/bin/env bash
# verify_framework.sh — v3-framework conformance gate (entry point).
#
# Validates the current checkout (repo root or git worktree) against the v3
# framework lock (commit 356edf3 by default):
#   [1] docs/design-tokens-round3.md + docs/color-tokens.md byte-identical to the lock
#   [2] 13 out/*.html + 13 docs/<page>/design.md: no hex outside the Sunset Glow 50–950 scale (+ #FFFFFF canvas)
#   [3] no font-weight > 600
#   [4] padding/margin/gap on the 8pt grid (framework-exempt component px values allowed)
#   [5] framework-referencing lines deleted from design.md since the lock must be
#       kept or marked 'intended-redesign' in the same file
#
# The gate is reproducible from a fresh clone / worktree: it regenerates the 13
# out/*.html from tracked generator source (no Chromium, no PNGs) before scanning.
#
# Usage:  _mockup-build/verify_framework.sh
#         LOCK=17da448 COMMIT=HEAD _mockup-build/verify_framework.sh   (overrides)
# Exit:   0 clean · 1 drift found · 2 environment / missing-input error
set -u
cd "$(dirname "$0")/.."   # repo/worktree root

LOCK="${LOCK:-356edf3}"
COMMIT="${COMMIT:-HEAD}"

# --- 0) rebuild out/*.html from the tracked generator source (always — out/ is
#        untracked build noise, so it may be stale or absent on this checkout) ---
PYTHON="$(command -v python3.12 || true)"
[ -z "$PYTHON" ] && PYTHON="$(command -v python3 || true)"
if [ -z "$PYTHON" ]; then
  echo "ERROR: no python3 found (need python3.12 for PEP-701 f-strings)"
  exit 2
fi
echo ">> regenerating _mockup-build/out/*.html from tracked generator source ($PYTHON)"
"$PYTHON" _mockup-build/build_html.py || { echo "ERROR: HTML build failed — cannot gate"; exit 2; }

exec node _mockup-build/verify_framework.cjs --lock "$LOCK" --commit "$COMMIT"
