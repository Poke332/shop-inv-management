# Sunset Electronics — Final Project Frontend

This branch contains the Final Project React UI in `frontend/`, based on the existing shop-inv-management application. The original project documentation remains at the repository root.

## Run

Use Node.js 22.12+ compatible with Vite 8 and the installed dependencies.

```powershell
cd frontend
npm ci
npm run dev -- --port 5174
```

Open the local URL printed by Vite.

```powershell
npm run build
npm run preview -- --port 4174
```

## Changes

- Sunset storefront, catalog, auth and operations UI redesign.
- Shop now navigation and a working six-category dropdown.
- Numbered checkout steps (1–2–3) and responsive navigation.
- Existing roles, routing, cart, checkout validation and mock API flows preserved.
- Staff storefront navigation remains disabled according to the existing access rules.

The app uses the browser mock data layer. Backend implementation, local environment files, databases, node_modules and generated build output are not included in this frontend checkpoint.

## Editable design

[Figma: Sunset Electronics UI](https://www.figma.com/design/B6wD9LAN70E4nrLjoJQPsQ)

See `DESIGN.md` for visual design decisions. Changes to Figma do not automatically update React.

## Fictional demo accounts

Use the account buttons on the login page. All local mock passwords are `sunset123`.

| Role | Email |
| --- | --- |
| Buyer | buyer_102@mock.local |
| Staff | marta@mock.local |
| Manager | rina@mock.local |
| Admin | ria@mock.local |

These accounts belong to the fictional browser mock, not a live authentication service.

## Updated mockups

[Current mockup gallery and screen specifications](../docs/README.md) · [UI system](../docs/UI-SYSTEM.md) · [Capture workflow](../docs/RENDER.md).
