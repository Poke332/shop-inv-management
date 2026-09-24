/**
 * Tailwind v3 theme extension — transcribes docs/color-tokens.md + docs/design-tokens-round3.md
 * (7 families x 11 steps, 50-950; semantic aliases; type scale; spacing/ops/gutter tokens;
 * component-layer classes live in src/styles). Plain JS, ESM (package.json "type":"module").
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // The P0 smoke page (src/pages/TokenSmokePage.jsx) renders the full 7 x 11
  // scale by iterating the family/step names at runtime, so Tailwind's static
  // scanner never sees those class names in source. The safelist below emits
  // exactly the 77 scale utilities (+ the 30% white surface) so the smoke
  // grid actually paints, plus the fixed category-tile set: the real P3 pages
  // also select a .tile-<category> class by dynamic mapping (category slug ->
  // class), so these 8 known classes are pinned here rather than relying on
  // the content scanner to discover them. Hand-written @layer components CSS
  // is subject to the same purge as utilities, hence the safelist.
  safelist: [
    {
      pattern: /^bg-(strawberryRed|atomicTangerine|carrotOrange|tuscanSun|willowGreen|seagrass|blueSlate)-(50|100|200|300|400|500|600|700|800|900|950)$/,
    },
    'bg-canvas',
    'tile',
    'tile-audio',
    'tile-smart-home',
    'tile-gaming',
    'tile-laptops',
    'tile-accessories',
    'tile-wearables',
    'tile-unmapped',
    'tile-fallback',
    'tile-outstock',
  ],
  theme: {
    extend: {
      colors: {
        strawberryRed: {
          '50': '#FEE6E7', '100': '#FDCECE', '200': '#FC9C9E', '300': '#FA6B6D',
          '400': '#F9393C', '500': '#F7080C', '600': '#C60609', '700': '#940507',
          '800': '#630305', '900': '#310202', '950': '#230102',
        },
        atomicTangerine: {
          '50': '#FEEFE7', '100': '#FCDFCF', '200': '#F9BE9F', '300': '#F79E6E',
          '400': '#F47E3E', '500': '#F15D0E', '600': '#C14B0B', '700': '#913808',
          '800': '#602506', '900': '#301303', '950': '#220D02',
        },
        carrotOrange: {
          '50': '#FEF3E6', '100': '#FDE8CE', '200': '#FCD19C', '300': '#FABA6B',
          '400': '#F9A339', '500': '#F78B08', '600': '#C67006', '700': '#945405',
          '800': '#633803', '900': '#311C02', '950': '#231401',
        },
        tuscanSun: {
          '50': '#FEF7E6', '100': '#FDEFCE', '200': '#FBDF9D', '300': '#FACF6B',
          '400': '#F8BF3A', '500': '#F6AF09', '600': '#C58C07', '700': '#946905',
          '800': '#624604', '900': '#312302', '950': '#221801',
        },
        willowGreen: {
          '50': '#F2F7ED', '100': '#E4EFDC', '200': '#C9DFB9', '300': '#AFD095',
          '400': '#94C072', '500': '#79B04F', '600': '#618D3F', '700': '#496A2F',
          '800': '#304620', '900': '#182310', '950': '#11190B',
        },
        seagrass: {
          '50': '#EDF8F4', '100': '#DBF0EA', '200': '#B6E2D5', '300': '#92D3C0',
          '400': '#6DC5AB', '500': '#49B695', '600': '#3A9278', '700': '#2C6D5A',
          '800': '#1D493C', '900': '#0F241E', '950': '#0A1A15',
        },
        blueSlate: {
          '50': '#EFF2F5', '100': '#DFE6EC', '200': '#BFCDD9', '300': '#9FB4C6',
          '400': '#809BB3', '500': '#60829F', '600': '#4D6880', '700': '#394E60',
          '800': '#263440', '900': '#131A20', '950': '#0D1216',
        },
        // semantic aliases (point at scale steps above - no new colors)
        primary: { DEFAULT: '#F15D0E', '600': '#C14B0B' }, // atomicTangerine
        secondary: '#F78B08',   // carrotOrange-500
        accent: '#F6AF09',      // tuscanSun-500
        destructive: '#C60609', // strawberryRed-600
        success: '#79B04F',     // willowGreen-500
        info: '#60829F',        // blueSlate-500
        ink: '#0D1216',         // blueSlate-950 - body text
        inkMuted: '#394E60',    // blueSlate-700
        surface: '#EFF2F5',     // blueSlate-50 - soft panels
        border: '#BFCDD9',      // blueSlate-200
        canvas: '#FFFFFF',      // declared neutral white (30% surface, design-tokens §11/§12)
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // Single-family system: hierarchy is carried by size + weight (the
        // fontSize scale below -> text-* utilities), never by a second
        // typeface. These aliases exist so the `font-h1` form also resolves
        // (each maps back to the same Roboto/sans stack; weight/size still come
        // from the paired text-* token). No new font files or deps.
        h1: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        section: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        card: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        body: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        price: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        meta: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        badge: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        h1: ['26px', { lineHeight: '36px', fontWeight: '600' }],
        section: ['16px', { lineHeight: '24px', fontWeight: '600', letterSpacing: '0.05em' }],
        card: ['15px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '20px', fontWeight: '500' }],
        price: ['14px', { lineHeight: '20px', fontWeight: '600' }],
        meta: ['13px', { lineHeight: '20px', fontWeight: '400' }],
        badge: ['12px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.02em' }],
      },
      spacing: {
        '4.5': '18px',
        'card-gutter': 'var(--card-gutter)',
        'card-padding': 'var(--card-padding)',
        'section-rhythm': 'var(--section-rhythm)',
        'section-label-gap': 'var(--section-label-gap)',
        touch: '44px',
      },
      maxWidth: {
        content: '1200px',
      },
      borderRadius: {
        pill: '999px',
      },
    },
  },
  plugins: [],
}
