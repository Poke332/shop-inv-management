import { Link } from 'react-router'

/**
 * 404 Not Found — the top-level catch-all for unknown routes (P1.1 router
 * amendment, user ruling: unknown routes render this page, NOT a redirect to
 * home). It is a bare full-page render OUTSIDE the layout/guard groups, so it
 * is reachable regardless of auth state: an anonymous user typing a bad URL
 * sees this page, never a forced /login. The known-route RBAC redirects in
 * guards.jsx are untouched.
 *
 * Design (design-tokens §11/§12, 8pt spacing, Roboto 400/500/600): the warm
 * tuscanSun-50 ground (60% allocation — also the <body> background), a
 * centered 30% white surface card (border blueSlate-200, radius 12px,
 * card padding 24px), the '404' mark + the 'Page not found' h1 (26/36 w600
 * blueSlate-950), a one-line helper (blueSlate-700), and the primary CTA
 * (btn-primary, 44px floor) back to the Main Store. Everything is existing
 * component tokens only — no new assets, no one-off type/color values.
 */
export default function NotFoundPage() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center bg-tuscanSun-50 p-6"
      role="alert"
    >
      <div className="w-full max-w-sm bg-canvas border border-blueSlate-200 rounded-[12px] p-card-padding text-center">
        {/* the 404 mark: the featured pill badge (existing component token) */}
        <span className="badge badge-featured">404</span>
        <h1 className="text-h1 font-h1 text-ink mt-4">Page not found</h1>
        <p className="text-body text-blueSlate-700 mt-4">
          The page you are looking for does not exist or has moved.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Back to Main Store
        </Link>
      </div>
    </div>
  )
}
