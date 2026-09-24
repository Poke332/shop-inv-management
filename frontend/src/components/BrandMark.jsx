/**
 * P1 SunLogo / BrandMark — the pure-CSS "Sunset Glow" sun mark
 * (docs/login/IMPLEMENTATION.md decision: a circle with a two-stop tuscanSun
 * radial gradient + 6–8 short 2px tuscanSun-500 ray strokes; no asset file,
 * no icon — a React Icon would only be a static glyph, not a sunmark).
 *
 * `size` = the sun CIRCLE's diameter, per the login doc: 96px on the desktop
 * brand panel, 48px on the 64px mobile logo strip, 32px in the storefront
 * header. The mark's box is the sun plus a little room for the ray strokes
 * (only when `rays` is on, so the small marks stay tight).
 *
 * @param {number} [size]  the sun circle's diameter in px (default 96).
 * @param {boolean} [rays]  draw the 8 ray strokes (default false — the small
 *   marks stay tight).
 * @param {string} [className]  extra utility classes on the mark's box.
 * @returns {import('react').ReactElement} the aria-hidden mark.
 */
export default function BrandMark({ size = 96, rays = false, className = '' }) {
  const sun = size
  const pad = rays ? Math.max(6, Math.round(size * 0.16)) : 0 // room for the rays
  const box = sun + pad * 2
  const rayH = Math.max(5, Math.round(size * 0.14)) // ray stroke length
  const rayR = sun / 2 + pad + 1 // ray center distance from the mark center
  const rayCount = 8

  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: box, height: box }}
    >
      {/* the sun: two-stop radial gradient (tuscanSun-300 core -> -400 edge) */}
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: sun,
          height: sun,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 35%, var(--tuscanSun-300), var(--tuscanSun-400))',
        }}
      />
      {rays ? (
        Array.from({ length: rayCount }, (_, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 2,
              height: rayH,
              marginLeft: -1,
              transform: `translate(-50%, -50%) rotate(${i * (360 / rayCount)}deg) translateY(${-rayR}px)`,
              background: 'var(--tuscanSun-500)',
              borderRadius: 1,
            }}
          />
        ))
      ) : null}
    </span>
  )
}
