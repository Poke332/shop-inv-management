import AppRoutes from './router.jsx'

/**
 * The routing seam: the full 14-route tree in src/router.jsx
 * (docs/IMPLEMENTATION.md §route table). The token-smoke check lives on at
 * /dev/token-smoke in dev (the tree's last route), so the token-pipeline
 * proof still works.
 */
export default function App() {
  return <AppRoutes />
}
