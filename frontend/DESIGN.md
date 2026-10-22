# Design direction

Sunset Electronics keeps its warm brand character while using a calmer ivory and sage setting. Burnt orange highlights purchasing and navigation actions. Product photography carries the visual focus.

## Foundations

| Token | Value | Purpose |
| --- | --- | --- |
| Paper | #FAF9F6 | Main page background |
| Ink | #252821 | Main text |
| Orange | #C64A22 | Primary action |
| Orange dark | #A73B18 | Hover action |
| Line | #E5E5DD | Quiet borders |
| Sage | #E8ECE3 | Secondary surfaces |
| Typeface | DM Sans, system fallback | Interface text |
| Accent typeface | Georgia italic, serif fallback | Editorial hero accent |
| Desktop width | 1400px | Content container |
| Desktop gutter | 56px | Outer spacing |
| Mobile gutter | 20px | Outer spacing |

## UX changes

- The homepage introduces the collection and provides category shortcuts before the catalog.
- Product tabs filter the homepage in place. Browse filters remain encoded in the URL for shareable searches.
- Product images open details, product names can wrap, and out-of-stock actions remain disabled.
- Account menus dismiss on outside click, Escape, and route changes.
- A skip link, focus outlines, reduced-motion support, and image alt text support keyboard and assistive technology use.
- Mobile product actions have a 44px height; cards use larger text at narrow widths.
- The operations workspace shows computed total products, available units, low stock, and out of stock.
- Sign-in keeps demo account shortcuts and uses simpler customer-facing copy.

The existing route guards, checkout steps, review flows, and mock data facade remain available. Shared styles apply across their screens; the largest layout changes are the homepage, collection header, auth shell, and operations shell.

## Editing

Change the variables and component selectors in `src/styles/redesign.css`. Typography families in `tailwind.config.js` and `index.html` must match any font changes. Figma captures are editable references rather than an automatic synchronization pipeline.
