import { useState } from 'react'

import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { FiChevronDown, FiLogOut, FiShoppingCart, FiUser } from 'react-icons/fi'

import { useAuth } from '../contexts/AuthContext.jsx'
import { useCart } from '../contexts/CartContext.jsx'
import BrandMark from '../components/BrandMark.jsx'

/**
 * P1 StorefrontHeader — the 56px white bar of the buyer-facing pages
 * (docs/main-store/design.md): logo -> /; pill search -> /search?query=;
 * cart icon with count badge (CartStore); account menu per role.
 *
 * The header is ONLY the chrome bar — the routed page renders as a sibling
 * via <Outlet/> below it, never inside the <header> landmark. Bar geometry
 * follows the token layer: 56px height (h-14), content centered on the
 * 1200px page column with the page-gutter padding so the bar aligns with
 * the .page containers below it.
 *
 * Mobile (<768px): logo left, cart + account right, the search pill drops
 * to its own full-width line below (44px min — the header wraps per
 * docs/main-store/design.md).
 *
 * Consumes useAuth() + useCart() from the P1 context pair. The cart count
 * badge shows only when the session user is a buyer (staff+ get the
 * read-only storefront variant, which hides the cart/Cart link per the
 * main-store role-gating note in docs). The account menu routes buyer ->
 * /orders and staff/manager/admin -> their respective ops home
 * (postLoginHome).
 * @returns {import('react').ReactElement} the header + the nested Outlet.
 */
export default function StorefrontHeader() {
  const { user, signOut } = useAuth()
  const { count, loaded } = useCart()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const submitSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/search?query=${encodeURIComponent(q)}` : '/search')
  }

  const onLogout = () => {
    setMenuOpen(false)
    signOut()
    navigate('/login', { replace: true })
  }

  const accountLabel = user ? user.username : 'Sign in'

  const searchInput = (
    <input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search products…"
      aria-label="Search products"
      className="h-11 w-full rounded-pill border border-blueSlate-200 bg-surface px-4 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2"
    />
  )

  return (
    <>
      <header className="sticky top-0 z-30 bg-canvas border-b border-blueSlate-200">
        {/* 56px bar row (spec-exact height; pinned so no preflight math can
            shift it — the 56px bar is the storefront header's QA line) */}
        <div
          className="flex items-center gap-4 mx-auto max-w-content"
          style={{ height: '56px', paddingInline: 'var(--page-gutter)' }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="Sunset Electronics — Main Store"
          >
            <BrandMark size={32} />
            <span className="text-card text-ink">Sunset</span>
          </Link>

          {/* desktop pill search (hidden on mobile — drops to its own row) */}
          <form onSubmit={submitSearch} role="search" className="hidden md:block flex-1 max-w-md">
            {searchInput}
          </form>

          <div className="md:ml-auto flex items-center gap-2">
            {/* cart: item-count badge from CartStore. Hidden for staff+ —
                the read-only storefront variant carries no cart/Cart link
                (docs/main-store/design.md role-gating note). */}
            {!(user && user.role !== 'buyer') ? (
              <Link
                to="/cart"
                aria-label={count > 0 ? `Cart, ${count} items` : 'Cart'}
                className="relative h-11 w-11 rounded-lg flex items-center justify-center text-ink"
              >
                <FiShoppingCart size={22} />
                {loaded && count > 0 ? (
                  <span className="nbadge absolute -top-0.5 -right-0.5">{count}</span>
                ) : null}
              </Link>
            ) : null}

            {/* account menu: buyer -> Orders Placed; staff+ -> ops console */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                className="h-11 rounded-lg flex items-center gap-2 px-3 text-meta text-ink border border-blueSlate-200 bg-canvas max-w-[120px] md:max-w-none"
              >
                <FiUser size={18} />
                <span className="truncate hidden sm:inline">{accountLabel}</span>
                <FiChevronDown size={14} />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-blueSlate-200 bg-canvas shadow-lg py-1 z-40">
                  {user ? (
                    <div className="px-4 py-2 text-meta text-blueSlate-700">
                      {user.username}
                      <span className="text-meta text-blueSlate-500"> · {user.role}</span>
                    </div>
                  ) : null}
                  {user && user.role === 'buyer' ? (
                    <NavLink
                      to="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-body text-ink hover:bg-surface"
                    >
                      Orders placed
                    </NavLink>
                  ) : null}
                  {user && user.role !== 'buyer' ? (
                    <NavLink
                      to={user.role === 'staff' ? '/ops/orders' : '/ops/inventory'}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-body text-ink hover:bg-surface"
                    >
                      Open ops console
                    </NavLink>
                  ) : null}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2.5 text-body text-ink hover:bg-surface flex items-center gap-2"
                  >
                    <FiLogOut size={16} />
                    {user ? 'Sign out' : 'Sign in'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* mobile search row (<768px only) */}
        <form
          onSubmit={submitSearch}
          role="search"
          className="md:hidden"
          style={{ padding: '0 var(--page-gutter) 12px' }}
        >
          {searchInput}
        </form>
      </header>

      {/* the routed storefront page (P3–P6 fill these slots) */}
      <Outlet />
    </>
  )
}
