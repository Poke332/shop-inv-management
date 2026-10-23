import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  FiArrowUpRight, FiSearch, FiShoppingBag, FiUser,
  FiChevronDown, FiLogOut, FiSun,
} from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth.js'
import { useCart } from '../hooks/useCart.js'

const categories = [['audio', 'Audio'], ['wearables', 'Wearables'], ['laptops', 'Laptops & PC'], ['gaming', 'Gaming'], ['smart-home', 'Smart home'], ['accessories', 'Accessories']]

export default function StorefrontLayout() {
  const { user, signOut } = useAuth()
  const { count: cartCount } = useCart()
  const count = user?.role === 'buyer' ? cartCount : 0
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('query') || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const accountRef = useRef(null)
  const categoriesRef = useRef(null)
  const categoriesButtonRef = useRef(null)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const categorySelected = location.pathname === '/search' && new URLSearchParams(location.search).has('category')

  const route = location.pathname + location.search
  const [previousRoute, setPreviousRoute] = useState(route)
  if (route !== previousRoute) {
    setPreviousRoute(route)
    setMenuOpen(false)
    setCategoriesOpen(false)
    setQuery(new URLSearchParams(location.search).get('query') || '')
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname, location.search])

  useEffect(() => {
    const close = (event) => {
      if (!accountRef.current?.contains(event.target)) setMenuOpen(false)
      if (!categoriesRef.current?.contains(event.target)) setCategoriesOpen(false)
    }
    const escape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setCategoriesOpen(false)
        if (categoriesRef.current?.contains(document.activeElement)) categoriesButtonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [])

  const submit = (event) => {
    event.preventDefault()
    navigate(query.trim() ? '/search?query=' + encodeURIComponent(query.trim()) : '/search')
  }

  return (
    <>
      <a href="#route-content" className="skip-link">Skip to content</a>
      <div className="announcement">
        <span>A brighter everyday starts with a little upgrade.</span>
        <Link to="/search">Discover the collection <FiArrowUpRight /></Link>
      </div>
      <header className="store-header">
        <div className="store-header-inner">
          <Link to="/" className="wordmark" aria-label="Sunset Electronics home">
            <span className="logo-symbol"><FiSun /></span>
            <span>sunset<span className="wordmark-dot">.</span><small>ELECTRONICS</small></span>
          </Link>
          <nav className="store-nav" aria-label="Main navigation">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/search" className={({ isActive }) => isActive && !categorySelected ? 'active' : ''}>Shop now</NavLink>
            <div className="categories-wrap" ref={categoriesRef} onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setCategoriesOpen(false)
            }}>
              <button ref={categoriesButtonRef} type="button"
                className={'categories-trigger' + (categorySelected || categoriesOpen ? ' active' : '')}
                aria-expanded={categoriesOpen} aria-controls="header-categories"
                onClick={() => { setCategoriesOpen(!categoriesOpen); setMenuOpen(false) }}>
                Categories <FiChevronDown aria-hidden="true" />
              </button>
              {categoriesOpen && (
                <div className="categories-popover" id="header-categories">
                  <small>SHOP BY CATEGORY</small>
                  {categories.map(([slug, label]) => (
                    <Link key={slug} to={'/search?category=' + slug}
                      aria-current={categorySelected && new URLSearchParams(location.search).get('category') === slug ? 'page' : undefined}
                      onClick={() => setCategoriesOpen(false)}>
                      {label}<FiArrowUpRight aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <NavLink to="/orders">My orders</NavLink>
          </nav>
          <form onSubmit={submit} className="header-search" role="search">
            <FiSearch aria-hidden="true" />
            <input
              aria-label="Search products"
              placeholder="Find your next favorite"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
            />
            <button type="submit" aria-label="Submit search"><FiArrowUpRight /></button>
          </form>
          <div className="header-tools">
            <div className="account-wrap" ref={accountRef}>
              <button
                type="button"
                className="account-button"
                aria-expanded={menuOpen}
                aria-controls="account-menu"
                onClick={() => { setMenuOpen(!menuOpen); setCategoriesOpen(false) }}
              >
                <FiUser /><span>{user ? user.username : 'Sign in'}</span><FiChevronDown size={12} />
              </button>
              {menuOpen && (
                <div id="account-menu" className="account-popover">
                  {user ? (
                    <>
                      <small>Signed in as {user.username}</small>
                      <Link to={user.role === 'buyer' ? '/orders' : '/ops/inventory'}>
                        {user.role === 'buyer' ? 'My orders' : 'Open workspace'}
                      </Link>
                      <button type="button" onClick={() => { signOut(); navigate('/'); setMenuOpen(false) }}>
                        <FiLogOut /> Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login">Sign in</Link>
                      <Link to="/register">Create an account</Link>
                    </>
                  )}
                </div>
              )}
            </div>
            {(!user || user.role === 'buyer') && (
              <Link to="/cart" className="bag-button" aria-label={'Shopping bag, ' + count + ' items'}>
                <FiShoppingBag /><span>{count}</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      <div id="route-content" tabIndex={-1}><Outlet /></div>
      <footer className="store-footer">
        <div className="footer-main">
          <div>
            <Link to="/" className="wordmark">
              <span className="logo-symbol"><FiSun /></span>
              <span>sunset.<small>ELECTRONICS</small></span>
            </Link>
            <p>Good tech. Better everyday.<br />Find a little more possibility.</p>
          </div>
          <div>
            <strong>Explore</strong>
            <Link to="/search">All products</Link>
            <Link to="/search?category=audio">Audio essentials</Link>
            <Link to="/search?category=gaming">For your downtime</Link>
          </div>
          <div>
            <strong>Your Sunset</strong>
            <Link to="/orders">Your orders</Link>
            <Link to="/cart">Shopping bag</Link>
            <Link to="/login">Your account</Link>
          </div>
          <div className="footer-statement">A brighter<br /><span>kind of tech.</span><FiArrowUpRight /></div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sunset Electronics</span>
          <span>Made for your everyday. <FiSun /></span>
        </div>
      </footer>
    </>
  )
}

