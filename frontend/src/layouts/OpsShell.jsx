import { useEffect, useState } from 'react'

import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { FiChevronDown, FiLogOut, FiMenu, FiX } from 'react-icons/fi'

import { mockApi } from '../data'
import { useAuth } from '../hooks/useAuth.js'
import { OPS_NAV_ITEMS } from '../routePaths.js'

/**
 * One sidebar nav row: label + optional role annotation + nbadge count.
 * @param {string} to  the ops route the row links to.
 * @param {string} label  the row text.
 * @param {number} [badge]  the nbadge count (null = no badge).
 * @param {string} [annotation]  the "read-only" hint (staff view, decision #8).
 * @param {boolean} [end]  exact-match NavLink (used for /ops/orders so the
 *   detail route doesn't keep the list row active).
 */
function NavItem({ to, label, badge, annotation, end }) {
  const active = ({ isActive }) => (isActive ? 'ops-nav-item active' : 'ops-nav-item')
  return (
    <NavLink to={to} end={end} className={active}>
      <span>{label}</span>
      {annotation ? <span className="text-meta text-blueSlate-300">{annotation}</span> : null}
      {badge > 0 ? <span className="nbadge">{badge}</span> : null}
    </NavLink>
  )
}

/**
 * OpsShell — the shared layout wrapper for every /ops/* route
 * (docs/control-panel/IMPLEMENTATION.md + design.md QA):
 *
 *   <div class="ops-shell">          flex row, min-height 100dvh
 *     <header class="ops-topbar">    mobile only (<768px): 56px bar + drawer toggle
 *     <aside class="ops-sidebar">    230px blueSlate-900, role-gated nav (NavLink)
 *       + footer sign-out button (always visible: desktop foot, drawer foot)
 *     <main class="ops-content">     the gutter: padding var(--ops-page-pad)
 *
 * The gutter is the `.ops-content` class padding (specificity 0,1,0) — reset-
 * proof against `*{padding:0}` and the Tailwind preflight. Sidebar = flex
 * none, content = flex 1, so the two never overlap. Mobile: the sidebar is
 * an off-canvas drawer (transform 150ms; reduced-motion = instant) opened by
 * the top bar's 44x44 menu button; it resets closed on navigation.
 *
 * The sidebar is a flex column: the nav block (.ops-sidebar-nav, flex-1)
 * scrolls when it overflows while the foot (a "Sign out" button, FiLogOut,
 * 44px min tap target, 1px blueSlate-800 top border, 16px padding) stays
 * pinned to the sidebar bottom — reachable on desktop and inside the open
 * mobile drawer alike. The mobile topbar's username chip carries the same
 * sign-out action (title="Sign out") plus a FiLogOut icon so the chip reads
 * as logout, not a profile menu. Both call signOutAndGoHome(): signOut()
 * (clears the AuthContext session + sessionStorage) + navigate('/',
 * {replace:true}) — the post-sign-out state is the guest session, which
 * '/' renders as the guest main store (Sign in / Create account header).
 *
 * Nav items + role gates come from src/routePaths.js (OPS_NAV_ITEMS); the
 * "read-only" annotation is a visibility hint for staff (v1 keeps the
 * control-panel spec's staff read-only view — see the decision #8 note).
 * nbadge counts read lazily from the same mockApi feeds the pages use
 * (Ongoing Orders = open pending+processing; Inventory = items at/below
 * threshold) — a shared "counts" fetch is out of scope for the shell.
 *
 * The mobile topbar is inline (<header class="ops-topbar">: 44px menu
 * button + sign-out row), not a separate component — it renders only
 * under <768px where the sidebar becomes the off-canvas drawer.
 *
 * Route context: every /ops/* route nests inside this shell under
 * RequireOps (+ the per-route role tiers in router.jsx). Consumes useAuth
 * for the role-gated nav rows; the drawer state is in-page (mobile).
 * @returns {object} the .ops-shell (topbar + sidebar + .ops-content
 *   gutter wrapping the nested <Outlet/>).
 */
export default function OpsShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [badges, setBadges] = useState({ orders: null, stock: null })

  // Lazy nbadge counts from the same feeds the ops pages consume.
  useEffect(() => {
    let alive = true
    mockApi.getOrders().then((d) => {
      if (alive) setBadges((b) => ({ ...b, orders: (d.tabs.pending || 0) + (d.tabs.processing || 0) }))
    }).catch(() => {})
    mockApi.getStockOverview().then((d) => {
      if (alive) setBadges((b) => ({ ...b, stock: d.total || 0 }))
    }).catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // Drawer open/closed is in-page state (mobile); reset it when the route
  // changes — the render-phase "adjust state when a prop changes" pattern
  // (React docs), which avoids a sync setState-in-effect.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname)
    setDrawerOpen(false)
  }

  const role = user ? user.role : 'staff'
  const visibleItems = OPS_NAV_ITEMS.filter((i) => i.roles.includes(role))

  const signOutAndGoHome = () => {
    signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="ops-shell">
      {/* mobile top bar (<768px only; display:none on desktop) */}
      <header className="ops-topbar">
        <button
          type="button"
          className="rounded-lg flex items-center justify-center text-ink bg-canvas border border-blueSlate-200"
          style={{ height: 'var(--touch-min)', width: 'var(--touch-min)' }}
          aria-expanded={drawerOpen}
          aria-controls="ops-sidebar"
          onClick={() => setDrawerOpen((o) => !o)}
        >
          {drawerOpen ? <FiX /> : <FiMenu />}
        </button>
        <button
          type="button"
          className="ml-auto h-11 rounded-lg flex items-center gap-2 px-3 bg-canvas border border-blueSlate-200 text-meta text-ink max-w-[48vw]"
          onClick={signOutAndGoHome}
          title="Sign out"
        >
          <span className="truncate">{user ? user.username : 'sign out'}</span>
          <FiLogOut />
          <FiChevronDown />
        </button>
      </header>

      {/* 230px blueSlate-900 sidebar: static on desktop, off-canvas drawer <768px.
          Flex column so the foot (sign-out) pins to the sidebar bottom — the nav
          block scrolls inside (.ops-sidebar-nav) while the foot stays reachable. */}
      <aside
        id="ops-sidebar"
        className={`ops-sidebar flex flex-col ${drawerOpen ? 'open' : ''}`}
        aria-label="Ops navigation"
      >
        <div className="ops-sidebar-nav p-4 flex-1 min-h-0 overflow-y-auto">
          <p className="text-badge text-blueSlate-50 mb-3" style={{ letterSpacing: '0.1em' }}>
            OPS
          </p>
          <div className="flex flex-col gap-1">
            {visibleItems.map((i) => (
              <NavItem
                key={i.to}
                to={i.to}
                label={i.label}
                badge={i.badge ? badges[i.badge] : null}
                annotation={i.readOnlyFor && i.readOnlyFor.includes(role) ? 'read-only' : null}
                end={i.to === '/ops/orders'}
              />
            ))}
          </div>
        </div>
        {/* sidebar foot: sign-out pinned below the nav list — 1px blueSlate-800
            top border, 16px padding (8pt grid); the nav block scrolls inside */}
        <div className="border-t border-blueSlate-800 p-4">
          <button
            type="button"
            onClick={signOutAndGoHome}
            aria-label={`Sign out of ${user?.username || 'account'}`}
            className="w-full rounded-lg flex items-center gap-2 px-3.5 text-blueSlate-50 hover:bg-blueSlate-800"
            style={{ minHeight: 'var(--touch-min)' }}
          >
            <FiLogOut />
            <span className="text-sm font-medium">Sign out</span>
          </button>
        </div>
      </aside>

      <main className="ops-content">
        <Outlet />
      </main>
    </div>
  )
}
