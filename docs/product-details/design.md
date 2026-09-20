# Page: Product Details — Design Spec (Sunset Glow)

Palette: `docs/color-tokens.md`. Roles: `Sheets-report.md`.
Matrix: "view product details" T for **all 4 roles** — this page is the only storefront
page that staff/manager/admin legitimately open (e.g. to check stock or see pending
reviews). The two variants are in §INTERACTIONS.

## FEATURES

- Single product view: image, description, price, **stock**, reviews + Add to Cart
  (buyer). Stock display: "In stock" / "Only N left" / "Out of stock" (exact number
  public for buyers — most likely interpretation; a "low stock" threshold of 5 assumed).
- **Review placement (open decision #9, conflict: notes say order-history page, page
  list attaches it here):** this doc designs reviews **read-only on Product Details**
  (list, average, moderation state) and the **review form** living on Orders Placed.
  Marked **TBD** — if the team flips it, the review list component (`ReviewList`)
  moves; the form stays on Orders Placed either way (purchase-gating is cleaner there).
- **Rating scale (open decision #10): TBD.** Most likely interpretation: 1–5 star
  scale, half-star display, average shown as `4.3 / 5 (128)`. Component
  `StarRating` is built scale-agnostic (props: `value`, `count`, `readOnly`, `onRate`).
- Related products strip — optional assumption, low priority (flagged).

## LINKS / NAVIGATION

- Arrivals: Main Store card, Search/Browse card, direct deep-link `/products/:id`.
- In-page: back link → last catalog page (history-aware, falls back to Main Store).
- Add-to-Cart success → toast with "View cart" action → Cart.
- No review submission here (see §FEATURES TBD).

## VISUALIZATION

`TODO: request image generation —` "product detail page, white background, large square product
image left, product info column right with price, stock line, quantity selector and warm
orange 'Add to cart' button, review section below with star ratings, sharp borders,
desktop 1440px" — save to `docs/product-details/`.

ASCII wireframe (desktop):

```
+------------------------------------------------------------------+
| LOGO  [ search bar................. ]   (cart:2)  (account)      |
+------------------------------------------------------------------+
|  ← Back to shop                                                   |
| +------------------+  +---------------------------------------+ |
| |                  |  | Name (blueSlate-950, 24px)            | |
| |    [ image ]      |  | ★★★★★ 4.3 (128 reviews)              | |
| |                    |  | Rp 129.000          (price)          | |
| |                    |  | In stock · 34 left  (stock line)    | |
| |  thumb · thumb ·…  |  | [ 1 -] [+] qty    [ Add to cart ]   | |
| +------------------+  +---------------------------------------+ |
| +----------------------------------------------------------------+|
| | Description (collapsible, 4-line clamp + "Read more")          ||
| +----------------------------------------------------------------+|
| REVIEWS (128)  [ filter: all / ★1..5 ]                            |
|  ★★★★☆  "title"   12 Sep 2026  [Hidden chip]                     |
|  ...                                                               |
+------------------------------------------------------------------+
```

Mobile: image stacks on top (4:3 crop), info column below, sticky bottom bar
[ price + Add to cart ] under <768px.

## COLOR USAGE

| Element | Token |
|---|---|
| Canvas | `#FFFFFF` |
| Product name / price | `blueSlate-950` / `carrotOrange-600` (price 24px semibold) |
| Stock line: in-stock / low / out | `willowGreen-600` / `strawberryRed-600` / `strawberryRed-600` |
| Stars filled / empty | `tuscanSun-500` / `tuscanSun-200` |
| Quantity stepper border / minus-disabled | `blueSlate-200`; disabled side `blueSlate-100` bg, `blueSlate-500` text |
| Add to cart button | `atomicTangerine-500` → hover `atomicTangerine-600`, white label |
| Review card | border `blueSlate-200`, hidden-review tint `blueSlate-50` + "Hidden" chip `blueSlate-700` on `blueSlate-100` |
| Image thumbnails: active ring | `atomicTangerine-500` |
| "Read more" link | `atomicTangerine-600` |

## INTERACTIONS

(React: `ProductDetail`, `ProductImageGallery`, `QuantityStepper`, `AddToCartButton`,
`ReviewList`, `StarRating`.)

**Buyer variant (default):**

- **Idle:** one hero image + thumbnails (swap on click, `aria-live` announcement).
- **Quantity stepper:** min 1, max = stock; at max the "+" disables
  (`blueSlate-100` bg, `blueSlate-500` icon) — prevents ordering past stock.
- **Add to cart:** out of stock → button replaced by disabled "Out of stock"
  (`strawberryRed-600` text on `strawberryRed-100` bg, `cursor-not-allowed`).
  In stock → optimistic add, toast "Added — View cart" (`willowGreen-100` bg,
  `willowGreen-600` text); on failure → `strawberryRed` toast, stock line refetched
  (stock may have dropped → quantity clamped, stepper shows why).
- **Loading:** image skeleton + line skeletons. **Error:** panel + "Try again".
- **Reviews:** only approved reviews render (moderation handled server-side — most
  likely). Hidden reviews are invisible to buyers (not "shown as hidden").
- **a11y:** stock line has `aria-live="polite"`; image swap updates
  `alt` text; stars have `aria-label="Rated 4.3 out of 5, 128 reviews"`.

**Staff/manager/admin variant (variant B, read-only storefront view):**

- Same layout, minus: Add to Cart, quantity stepper, cart badge in header.
- Stock line gets a link "Manage stock →" → Per Product Dashboard (manager/admin) or
  Ongoing Orders (staff). Reviews with `pending` status show an extra
  "Awaiting moderation" chip (`tuscanSun-100` bg, `blueSlate-900` text).
- No purchase CTA of any kind — matrix: "purchase product" F for all non-buyers.
