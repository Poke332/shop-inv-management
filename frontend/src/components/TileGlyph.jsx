/**
 * The tile glyph: one 40px stroke-1.5 blueSlate-900 line shape per category
 * (decorative, aria-hidden). The P0 smoke check expects these on tiles.
 * @param {string} category  a category slug (or anything -> the generic tile).
 * @returns {import('react').ReactElement} the <svg> glyph.
 */
export function TileGlyph({ category }) {
  const p = {
    width: 40,
    height: 40,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    className: 'tile-glyph',
  }
  switch (category) {
    case 'audio': // headphones
      return (
        <svg {...p}>
          <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
          <rect x="2.5" y="13.5" width="4" height="6.5" rx="2" />
          <rect x="17.5" y="13.5" width="4" height="6.5" rx="2" />
        </svg>
      )
    case 'smart-home': // plug + socket
      return (
        <svg {...p}>
          <path d="M9 7.5v4M15 7.5v4" />
          <path d="M7 11.5h10v2a5 5 0 0 1-10 0v-2Z" />
          <path d="M12 18.5v2.5" />
        </svg>
      )
    case 'gaming': // gamepad
      return (
        <svg {...p}>
          <path d="M7 8h10a4.5 4.5 0 0 1 4.4 5.4l-.8 3.4a2.8 2.8 0 0 1-4.8 1.2L14.6 16H9.4l-1.2 2a2.8 2.8 0 0 1-4.8-1.2l-.8-3.4A4.5 4.5 0 0 1 7 8Z" />
          <path d="M8 11.5v3M6.5 13h3" />
          <circle cx="15.5" cy="12" r="0.4" />
          <circle cx="18" cy="13.5" r="0.4" />
        </svg>
      )
    case 'laptops':
      return (
        <svg {...p}>
          <rect x="4" y="5" width="16" height="11" rx="1.5" />
          <path d="M2.5 18.5h19" />
        </svg>
      )
    case 'accessories': // battery
      return (
        <svg {...p}>
          <rect x="3" y="8" width="15" height="8" rx="1.5" />
          <path d="M21 10.5v3" />
          <path d="M6 11l2 2-2 2" />
        </svg>
      )
    case 'wearables': // watch
      return (
        <svg {...p}>
          <rect x="7" y="7" width="10" height="10" rx="3" />
          <path d="M9.5 7 10 3h4l.5 4M9.5 17l.5 4h4l.5-4" />
          <path d="M12 9.5V12l1.5 1.5" />
        </svg>
      )
    default:
      return (
        <svg {...p}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      )
  }
}
