import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { FiArrowUpRight, FiArrowRight, FiBox, FiShield, FiHeadphones } from 'react-icons/fi'
import { mockApi } from '../data'
import { ProductGrid } from '../components/ProductGrid.jsx'
import { ProductCardSkeleton } from '../components/ProductCardSkeleton.jsx'
import { TileGlyph } from '../components/TileGlyph.jsx'

const categories = [['audio', 'Audio'], ['wearables', 'Wearables'], ['laptops', 'Laptops & PC'], ['gaming', 'Gaming'], ['smart-home', 'Smart home'], ['accessories', 'Accessories']]

export default function HomePage() {
  const [products, setProducts] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [category, setCategory] = useState('all')
  useEffect(() => {
    let alive = true
    mockApi.getProducts({ sort: 'catalog' }).then(({ items }) => {
      if (alive) setProducts(items)
    }).catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [retry])
  const items = products?.filter(p => category === 'all' || p.category === category).slice(0, 8)

  return (
    <main id="main-content" className="home-page">
      <section className="hero-wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow"><span className="live-dot" /> A LITTLE UPGRADE. A BIG DIFFERENCE.</span>
          <h1 id="hero-title">Good tech.<br />Better <span>everyday.</span></h1>
          <p>Your next favorite, from the brands you love.<br className="desktop-break" /> Discover tech that fits the way you live.</p>
          <div className="hero-actions"><Link to="/search" className="btn-primary">Find your next upgrade <FiArrowUpRight /></Link><Link to="/search?category=audio" className="text-link">Explore audio <FiArrowRight /></Link></div>
          <div className="hero-note"><span className="mini-sun" aria-hidden="true">•</span><span>Thoughtfully picked. Ready for your everyday.</span></div>
        </div>
        <div className="hero-visual">
          <img src="/products/p-231.png" alt="Wireless earbuds in their charging case, lit by a warm sunset" fetchPriority="high" />
          <span className="hero-sticker">SOUND ON.<br />WORLD OFF.<span>↗</span></span>
          <Link to="/products/P-231" className="hero-product"><span><small>THE EVERYDAY EDIT / 01</small><strong>Sony WF-C710N</strong><span>Wireless. Effortless. Yours.</span></span><span className="round-arrow"><FiArrowUpRight /></span></Link>
        </div>
      </section>
      <section className="brand-strip" aria-label="Featured brands"><span>GOOD COMPANY.<br /><b>GREAT TECH.</b></span><strong>SONY</strong><strong>Anker</strong><strong>logitech</strong><strong className="brand-samsung">SAMSUNG</strong><strong>JBL.</strong><strong>ASUS</strong></section>
      <section className="home-section" aria-labelledby="category-title"><div className="section-heading"><div><span className="eyebrow">FIND YOUR THING</span><h2 id="category-title">A little something for every day.</h2></div><Link className="text-link" to="/search">All categories <FiArrowUpRight /></Link></div><div className="category-grid">{categories.map(([slug, label]) => <Link key={slug} to={'/search?category=' + slug} className="category-card"><span className="category-icon"><TileGlyph category={slug} size={32} /></span><span>{label}</span><FiArrowUpRight className="category-arrow" /></Link>)}</div></section>
      <section className="home-section product-section" id="shop-all" aria-labelledby="products-title"><div className="section-heading"><div><span className="eyebrow">THE GOOD STUFF</span><h2 id="products-title">Meet your next favorites.</h2></div><Link className="text-link" to="/search">Shop everything <FiArrowUpRight /></Link></div><div className="catalog-tabs" aria-label="Filter featured products">{[['all', 'All picks'], ...categories].map(([slug, label]) => <button key={slug} type="button" aria-pressed={category === slug} className={category === slug ? 'selected' : ''} onClick={() => setCategory(slug)}>{label}</button>)}</div><div aria-live="polite">{error ? <div className="state-error">We couldn’t load the collection. <button className="btn-secondary" onClick={() => { setError(false); setRetry((n) => n + 1) }}>Try again</button></div> : !products ? <ProductCardSkeleton n={8} /> : items.length ? <ProductGrid items={items} /> : <div className="state-empty">More favorites are on the way. <Link to="/search">Browse all products</Link></div>}</div></section>
      <section className="editorial-banner"><div><span className="eyebrow">MAKE ROOM FOR BETTER</span><h2>Small upgrades.<br />A whole new feeling.</h2><p>For the desk, the commute, and everything in between.</p><Link className="btn-primary" to="/search?category=accessories">Upgrade your everyday <FiArrowUpRight /></Link></div><img src="/hero-banner.png" alt="A collection of electronics in warm sunset light" loading="lazy" /></section>
      <section className="service-strip" aria-label="Shopping benefits"><div><FiBox /><span><strong>Everything in one place</strong><small>From daily essentials to your next upgrade.</small></span></div><div><FiShield /><span><strong>Shop with clarity</strong><small>Clear specs, real stock, and transparent pricing.</small></span></div><div><FiHeadphones /><span><strong>Find your perfect fit</strong><small>Explore details and reviews before you decide.</small></span></div></section>
    </main>
  )
}

