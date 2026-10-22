# RENDER.md — how to re-render + verify the 13 mockups

Use this to independently verify that the design docs on this branch match a
fresh render of the committed HTML generator, before the draft PR is merged
to `main`. Re-run the whole sequence on a clean checkout of this branch;
everything is reproducible from tracked files only (no `/tmp`, no external
assets).

## Prerequisites

- This branch checked out in a repo clone or git worktree (all commands run
  from the repo/worktree root).
- `/snap/bin/chromium` available (Snap Chromium on Ubuntu). **Snap gotcha:**
  the HTML input and the output PNG must both live under `~` or inside the
  project dir — never in `/tmp`, because Snap's private tmpfs makes Chromium
  see `ERR_FILE_NOT_FOUND`. All commands below render in-place under
  `_mockup-build/`, so they are safe.
- `python3.12` (the generator uses PEP-701 nested f-strings); plain
  `python3` works as fallback.
- `node` (only needed for the conformance gate).

## Step 1 — regenerate the 13 HTML sources from the tracked generator

```sh
python3.12 _mockup-build/build_html.py
```

Writes `_mockup-build/out/<page>.html` for all 13 pages from the tracked
`lib.py` / `pages_*.py`. This guarantees the HTML you render is exactly what
is committed on the branch (never a stale local build).

## Step 2 — re-render all 13 mockups + sync + md5-verify (one command)

```sh
bash _mockup-build/rebuild_docs_png.sh
```

What it does, in order:
1. Renders `out/<page>.html` → `out/<page>.png` (refreshes the committed-
   snapshot slot) for all 13 pages.
2. Renders a second independent pass into `verify/<page>.png` (byte-stability
   check of the render itself).
3. Copies the fresh `out/<page>.png` → `docs/<page>/mockup.png` for all 13.
4. Prints a per-page table: `STABLE`/`drift-note` + `docs-synced`/
   `docs-MISSING` + the md5 prefix.

Pass condition: every row says `docs-synced` and the script prints
`OK: docs/<p>/mockup.png == out/<p>.png == fresh render of out/<p>.html for
all 13 pages` and exits 0.

`drift-note` on a page means two independent Chromium renders of the same
HTML were not byte-identical (sub-pixel PNG re-encoding noise). That is
expected and **not** a sync failure — the hard invariant is
`docs/ == out/ == fresh render of out/*.html`.

### Raw re-render loop (what the script does, by hand)

```sh
for p in cart checkout inventory-dashboard login main-store ongoing-orders \
        orders-placed per-product-dashboard per-product-review-panel \
        product-details register search-browse user-dashboard; do
  /snap/bin/chromium --headless --no-sandbox --disable-gpu \
    --disable-dev-shm-usage --hide-scrollbars \
    --screenshot="$PWD/_mockup-build/out/$p.png" --window-size=1312,736 \
    "file://$PWD/_mockup-build/out/$p.html"
  cp _mockup-build/out/$p.png docs/$p/mockup.png
done
```

## Step 3 — md5-verify the invariant (docs vs out vs fresh render)

```sh
# docs/<p>/mockup.png must md5-match _mockup-build/out/<p>.png (all 13)
for p in cart checkout inventory-dashboard login main-store ongoing-orders \
        orders-placed per-product-dashboard per-product-review-panel \
        product-details register search-browse user-dashboard; do
  a=$(md5sum "docs/$p/mockup.png" | cut -d' ' -f1)
  b=$(md5sum "_mockup-build/out/$p.png" | cut -d' ' -f1)
  [ "$a" = "$b" ] && echo "$p MATCH" || echo "$p MISMATCH"
done
```

All 13 lines must read `MATCH`. (The 3-way check — docs vs out vs a brand-
new render — is exactly what Step 2's script already reports via its
`out/` + `verify/` passes, so this loop plus Step 2 together prove
`docs == out == fresh render`.)

## Step 4 — run the conformance gate

```sh
_mockup-build/verify_framework.sh
```

Exit 0 = green. It re-generates `out/*.html` from the tracked generator
itself, then checks: framework files byte-identical to the 17da448 lock,
no out-of-scale hex, no font-weight > 600, 8pt-grid spacing, and that every
framework line deleted from `design.md` since the lock is still present or
carries the `intended-redesign` marker.

## Step 5 — inspect the git diff before merging

```sh
git status --short -- docs/ _mockup-build/
```

On a clean checkout of this branch you should see **no** modified files
(`out/` and `verify/` are untracked build noise, `.gitignore`d). If a page
shows `M docs/<p>/mockup.png`, the docs were out of date — re-run Step 2,
commit the refresh, and re-verify.

## Known caveat (main-store hero)

The tracked generator on this branch renders **main-store grid-only** (no
hero banner, no 6-tile category rail). The v4 hero + rail generator HTML
lives on the unmerged orphan chain `f7ca077→680850e→b80abfe→11612b9`, so a
re-render here intentionally shows grid-only; the hero remains spec + asset
(`docs/main-store/hero-banner.png`), documented at the VISUALIZATION section
of `docs/main-store/design.md`. No other page has this issue — the other
12 mockups reproduce byte-faithfully from the tracked generator.

---

**Re-run this whole sequence (Steps 1–5) before merging the draft to
`main`** — it takes about a minute and proves the committed docs match what
the committed generator renders.
