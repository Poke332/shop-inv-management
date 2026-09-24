import AppRoutes from './router.jsx'

/**
 * P1: the routing seam is now the full 14-route tree in src/router.jsx
 * (docs/IMPLEMENTATION.md §route table). P0's TokenSmokePage lives on at
 * /dev/token-smoke in dev (the tree's last route), so the token-pipeline
 * proof still works.
 */
export default function App() {
  return <AppRoutes />
}
