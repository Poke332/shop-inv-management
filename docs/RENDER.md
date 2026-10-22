# Capture the current React UI

The current mockups are screenshots of the running frontend, saved as JPEG without compositing or altering the page contents. Dimensions and routes are recorded in [capture-manifest.json](capture-manifest.json).

## Run the app

From the repository root:

```powershell
cd frontend
npm ci
npm run dev -- --port 5174 --strictPort
```

Open the URL printed by Vite. Use a dedicated browser profile/session with fictional demo data.

## Capture sequence

1. Set a 1440×1000 viewport. Wait for fonts, images and product/order data to finish loading before taking screenshots.
2. Capture guest home, login, register, catalog and Sony P-231 detail.
3. Use the demo buyer button on login, then capture cart and My orders after their records are visible.
4. Enter checkout using Proceed to checkout in cart. Capture personal info, shipping, payment and receipt in order. Use fictional contact/address data and the local mock payment flow; no live payment service is involved.
5. Use the demo admin account to capture inventory, order queue/detail, products/editor, reviews and users. Capture only the UI; do not change stock, roles, moderation or products for screenshots.
6. Set 390×844 for mobile home/category navigation and checkout. Verify the viewport has applied before capture.
7. Save the files under the matching docs page directory. Update the manifest and the gallery when adding a state.

## Reference data

The receipt screenshot uses one fictional local mock checkout. Other views can reflect that session's changed stock/order counts. Values are example state, not required fixed values. No backend database is read or modified for these captures.

## Historical renderer

The Python/Chromium pipeline in `_mockup-build/` renders the original midterm HTML design. Its output belongs to the [historical documentation](legacy-midterm/README.md); it does not regenerate the current React mockups. Running its old sync script can overwrite current docs, so use the React capture workflow above for this branch.
