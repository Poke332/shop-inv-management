import {
  FiHeadphones,
  FiTv,
  FiCpu,
  FiMonitor,
  FiBox,
  FiWatch,
  FiTablet,
} from 'react-icons/fi'

/*
 * P0 token smoke page.
 *
 * Purpose (not a shipping page): prove on the live dev server that the full
 * Tailwind theme extension + the CSS component layer compiled and resolved.
 * It renders the 60:30:10 ground, the type scale, the 7-color x 11-step scale,
 * semantic aliases, and every component-layer class from docs/design-tokens-round3.md
 * + docs/control-panel/design.md (v4 ops-shell gutter). P1 moved this to
 * /dev/token-smoke (this file) and added the real 14-route tree in
 * src/router.jsx; it stays available in dev as the theme-pipeline proof.
 *
 * Discipline check baked into the markup (gate references):
 *   - no out-of-scale hex (all color via token keys)
 *   - font-weight never above 600
 *   - 8pt spacing
 */

/* The 7 families x 11 steps, in display order (50..950). Values are the
   scale keys; the hex lives in tailwind.config.js / tokens.css. */
const FAMILIES = [
  { name: 'strawberryRed', icon: FiWatch },
  { name: 'atomicTangerine', icon: FiCpu },
  { name: 'carrotOrange', icon: FiBox },
  { name: 'tuscanSun', icon: FiHeadphones },
  { name: 'willowGreen', icon: FiTv },
  { name: 'seagrass', icon: FiMonitor },
  { name: 'blueSlate', icon: FiCpu },
]
const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

/**
 * The 7 families x 11 steps swatch grid — every `bg-{family}-{step}` utility
 * class, so a missing scale step shows as an empty swatch on the live page.
 */
function ScaleSwatches() {
  return (
    <div className="flex flex-col gap-section-label-gap">
      {FAMILIES.map(({ name }) => (
        <div key={name}>
          <p className="text-badge text-inkMuted mb-1">{name}</p>
          <div className="flex gap-1 flex-wrap">
            {STEPS.map((step) => (
              <div
                key={step}
                title={`${name}-${step}`}
                className={`h-8 w-8 rounded bg-${name}-${step}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Route /dev/token-smoke — dev-only theme-pipeline proof (P0, `import.meta.env.DEV`
 * in router.jsx; not part of the 14-route table). Renders the 60:30:10 ground,
 * the type scale, the 7x11 scale swatches, semantic aliases, and every
 * component-layer class (buttons, badges, tiles, skeletons, receipt table) +
 * the ops-shell v4 gutter proof, from the file doc above.
 */
export default function TokenSmokePage() {
  return (
    <div className="page">
      {/* 60% warm ground is on <body>; this card = the 30% white surface layer */}
      <div className="bg-canvas border border-blueSlate-200 rounded-lg p-card-padding">
        <h1 className="text-h1 font-h1 text-ink">Sunset Electronics</h1>
        <p className="text-section text-inkMuted mt-section-label-gap">
          P0 scaffold - token theme smoke test
        </p>

        {/* type scale (text-* carry the size+weight hierarchy; font-* are the
            single-family aliases that also resolve - both must compile) */}
        <section className="mt-section-rhythm">
          <h2 className="text-section text-ink">Type scale (w600 cap)</h2>
          <div className="mt-section-label-gap flex flex-col gap-2">
            <p className="text-h1 text-ink">h1 - 26/36 w600</p>
            <p className="text-section text-ink">Section - 16/24 w600</p>
            <p className="text-card text-ink">Card - 15/24 w600</p>
            <p className="text-body text-ink">Body - 14/20 w500</p>
            <p className="text-price text-atomicTangerine-600">Price - 14/20 w600</p>
            <p className="text-meta text-inkMuted">Metadata - 13/20 w400</p>
            <p className="text-badge text-ink">Badge - 12/16 w600</p>
          </div>
        </section>

        {/* semantic aliases */}
        <section className="mt-section-rhythm">
          <h2 className="text-section text-ink">Semantic aliases</h2>
          <div className="mt-section-label-gap flex flex-wrap gap-card-gutter">
            <span className="text-meta text-ink">
              <span className="inline-block h-8 w-8 rounded bg-primary mr-1 align-middle" /> primary
            </span>
            <span className="text-meta text-ink">
              <span className="inline-block h-8 w-8 rounded bg-secondary mr-1 align-middle" /> secondary
            </span>
            <span className="text-meta text-ink">
              <span className="inline-block h-8 w-8 rounded bg-accent mr-1 align-middle" /> accent
            </span>
            <span className="text-meta text-ink">
              <span className="inline-block h-8 w-8 rounded bg-destructive mr-1 align-middle" /> destructive
            </span>
            <span className="text-meta text-ink">
              <span className="inline-block h-8 w-8 rounded bg-success mr-1 align-middle" /> success
            </span>
            <span className="text-meta text-ink">
              <span className="inline-block h-8 w-8 rounded bg-info mr-1 align-middle" /> info
            </span>
            <span className="text-meta text-ink">
              <span className="inline-block h-8 w-8 rounded bg-blueSlate-900 mr-1 align-middle" /> ops panel
            </span>
          </div>
        </section>

        {/* component layer: buttons */}
        <section className="mt-section-rhythm">
          <h2 className="text-section text-ink">Button stacks (44px floor)</h2>
          <div className="mt-section-label-gap flex flex-wrap items-center gap-card-gutter">
            <button className="btn-primary" type="button">Buy now</button>
            <button className="btn-secondary" type="button">Add to cart</button>
            <button className="btn-destructive" type="button">Delete</button>
            <button className="btn-primary" type="button" disabled>Disabled</button>
          </div>
        </section>

        {/* component layer: badges, chips, role badges */}
        <section className="mt-section-rhythm">
          <h2 className="text-section text-ink">Pill badges - status chips - role badges</h2>
          <div className="mt-section-label-gap flex flex-wrap items-center gap-3">
            <span className="badge badge-sale">-15%</span>
            <span className="badge badge-featured">Featured</span>
            <span className="badge badge-lowstock">Only 5 left</span>
            <span className="badge badge-out">Out of stock</span>
            <span className="chip chip-pending">pending</span>
            <span className="chip chip-processing">processing</span>
            <span className="chip chip-shipped">shipped</span>
            <span className="chip chip-delivered">delivered</span>
            <span className="role-badge role-buyer">buyer</span>
            <span className="role-badge role-staff">staff</span>
            <span className="role-badge role-manager">manager</span>
            <span className="role-badge role-admin">admin</span>
          </div>
        </section>

        {/* component layer: product tiles (gradient, category-mapped) */}
        <section className="mt-section-rhythm">
          <h2 className="text-section text-ink">Product tiles (4:3 gradient + glyph)</h2>
          <div className="mt-section-label-gap grid grid-cols-2 sm:grid-cols-3 gap-card-gutter">
            {[
              ['audio', FiHeadphones],
              ['smart-home', FiTv],
              ['gaming', FiMonitor],
              ['laptops', FiTablet],
              ['accessories', FiBox],
              ['wearables', FiWatch],
            ].map(([cat, Icon]) => (
              <div key={cat} className={`tile tile-${cat}`}>
                <Icon aria-hidden="true" />
              </div>
            ))}
          </div>
        </section>

        {/* component layer: skeletons + stepper + receipt table */}
        <section className="mt-section-rhythm">
          <h2 className="text-section text-ink">Skeletons - stepper - receipt table</h2>
          <div className="mt-section-label-gap flex flex-col gap-card-gutter">
            <div className="skeleton skeleton-tile" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line-sm" />
            <div className="stepper">
              <button type="button" aria-label="Decrease quantity">-</button>
              <span className="stepper-val">1</span>
              <button type="button" aria-label="Increase quantity">+</button>
            </div>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th className="receipt-num">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sony WF-C710N</td>
                  <td>1</td>
                  <td className="receipt-num">Rp 1.290.000</td>
                </tr>
                <tr>
                  <td>Anker 735 Power Bank</td>
                  <td>1</td>
                  <td className="receipt-num">Rp 380.000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ops-shell v4 gutter proof */}
        <section className="mt-section-rhythm">
          <h2 className="text-section text-ink">Ops shell v4 (230px sidebar + --ops-page-pad gutter)</h2>
          <div className="mt-section-label-gap">
            <div className="ops-shell border border-blueSlate-200 rounded-lg overflow-hidden">
              <aside className="ops-sidebar" aria-label="Ops navigation">
                <div className="p-3">
                  <p className="text-badge text-blueSlate-50 mb-2">OPS</p>
                  <a className="ops-nav-item active" href="#/ops/orders">
                    <span>Ongoing Orders</span>
                  </a>
                  <a className="ops-nav-item" href="#/ops/inventory">
                    <span>Inventory</span>
                  </a>
                  <a className="ops-nav-item" href="#/ops/users">
                    <span>Users</span>
                    <span className="nbadge">3</span>
                  </a>
                </div>
              </aside>
              <main className="ops-content">
                <div className="bg-canvas border border-blueSlate-200 rounded-lg p-card-padding">
                  <p className="text-card text-ink">Content panel</p>
                  <p className="text-meta text-inkMuted mt-2">
                    Gutter = .ops-content padding (--ops-page-pad: 32px desktop / 24px mobile).
                  </p>
                </div>
              </main>
            </div>
          </div>
        </section>

        {/* static asset proof: copied hero-banner */}
        <section className="mt-section-rhythm">
          <h2 className="text-section text-ink">Static asset (/public resolved)</h2>
          <div className="mt-section-label-gap">
            <img
              src="/hero-banner.png"
              alt="Sunset Electronics hero banner"
              className="w-full max-w-content rounded-lg"
            />
          </div>
        </section>

        {/* full 7 x 11 scale ledger */}
        <section className="mt-section-rhythm">
          <h2 className="text-section text-ink">Full 7-family x 11-step scale</h2>
          <div className="mt-section-label-gap">
            <ScaleSwatches />
          </div>
        </section>
      </div>
    </div>
  )
}
