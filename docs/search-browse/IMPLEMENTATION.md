# Catalog — Current implementation

Status: implemented in the Final Project frontend checkpoint.

- Route: `/search`
- Access: Guest / buyer
- Source: [SearchPage.jsx](../../frontend/src/pages/SearchPage.jsx)
- [Current layout, behavior and screenshots](design.md)

- Collection introduction, category/brand filters, chips, result count, sort and product grid.
- Search and category state remain in URL query parameters. Shop now opens the unfiltered catalog.
- Mobile exposes the existing filter panel; product cards retain their purchase actions.

The frontend build and 32 existing mock API smoke tests passed for source commit 8e639d9. Current screenshots were captured on 22 October 2026. Screenshot review is not an exhaustive functional or accessibility audit.

Backend work is excluded from this branch. Historical phase notes are available in [the midterm archive](../legacy-midterm/search-browse/IMPLEMENTATION.md).
