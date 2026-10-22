import { Link, Outlet } from 'react-router'
import { FiArrowLeft, FiSun } from 'react-icons/fi'
export default function AuthLayout() {
  return <main className="auth-layout"><section className="auth-story"><Link to="/" className="wordmark"><span className="logo-symbol"><FiSun /></span><span>sunset.<small>ELECTRONICS</small></span></Link><div><span className="eyebrow">YOUR EVERYDAY, UPGRADED</span><h2>Good to<br />have you <em>here.</em></h2><p>Your favorites, your orders, your next little upgrade.<br />All in one place.</p></div><img src="/products/p-231.png" alt="Wireless earbuds in warm sunset light" /><span className="auth-caption">GOOD TECH. BETTER EVERYDAY.</span></section><section className="auth-form-side"><Link to="/" className="text-link"><FiArrowLeft /> Back to the shop</Link><div className="auth-form-card"><Outlet /></div><p className="auth-footnote">A little more possibility starts here.</p></section></main>
}
