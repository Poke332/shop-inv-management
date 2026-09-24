import { Outlet } from 'react-router'

import BrandMark from '../components/BrandMark.jsx'

/**
 * P1 AuthLayout — the shared two-panel shell of /login + /register
 * (docs/login/design.md: the brand panel is blueSlate-900 with the CSS
 * sunset-sun mark + blueSlate-50 tagline; the form card is the 30% white
 * surface on the tuscanSun-50 warm ground). Mobile <768px: the brand panel
 * collapses to a 64px logo strip and the card goes full-bleed with 24px
 * gutters. Pages P3 fill the form card; P1 leaves it a placeholder.
 */
export default function AuthLayout() {
  return (
    <div className="min-h-dvh bg-tuscanSun-50">
      {/* mobile: 64px logo strip (the desktop brand panel is hidden) */}
      <div className="md:hidden h-16 bg-blueSlate-900 flex items-center px-6">
        <BrandMark size={48} />
        <span className="ml-3 text-card text-blueSlate-50">Sunset Electronics</span>
      </div>

      <div className="md:grid md:grid-cols-2 min-h-[calc(100dvh-4rem)] md:min-h-dvh">
        {/* desktop brand panel */}
        <div className="hidden md:flex flex-col justify-between bg-blueSlate-900 p-10">
          <BrandMark size={96} rays />
          <div>
            <p className="text-h1 text-blueSlate-50">Sunset Electronics</p>
            <p className="mt-3 text-body text-blueSlate-50/70 max-w-sm">
              Every light, loud and long-lasting. The warm end of the spectrum, shipped.
            </p>
          </div>
          <p className="text-meta text-blueSlate-50/50">Sunset Electronics · mock store</p>
        </div>

        {/* the form card: 30% white surface, border blueSlate-200, radius 12px */}
        <div className="flex items-start md:items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md bg-canvas border border-blueSlate-200 rounded-xl p-6 md:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
