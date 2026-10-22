# Final Project UI system

The implemented visual layer is [frontend/src/styles/redesign.css](../frontend/src/styles/redesign.css), loaded after the existing base styles. Component utilities and status colors remain in the existing token foundation.

| Foundation | Current value |
| --- | --- |
| Canvas | #FAF9F6 |
| Ink | #252821 |
| Primary orange | #C64A22 |
| Primary hover | #A73B18 |
| Divider | #E5E5DD |
| Sage surface | #E8ECE3 |
| UI font | DM Sans with system fallback |
| Editorial accent | Georgia italic |
| Desktop content maximum | 1400px |
| Desktop/mobile gutter | 56px / 20px |

## Shared components

- Storefront header: Home, Shop now, six-category dropdown, My orders, search, account and bag.
- Categories dismisses on selection, outside click, Escape or focus leaving; links reuse category URL filters.
- Auth pages share product photography and the two-panel composition.
- Operations uses the dark sidebar and role-specific controls. Back to storefront remains disabled.
- Checkout circles display 1, 2, 3 in current, completed and upcoming states.
- Mobile navigation targets are at least 44px high. Existing keyboard focus, skip link and reduced-motion rules remain.

Desktop mockups use 1440×1000; mobile uses 390×844. Content and counts can vary with browser mock state. [Browse all current mockups](README.md).
