import { Navigate, Route, Routes } from 'react-router'
import TokenSmokePage from './pages/TokenSmokePage.jsx'

/**
 * P0 scaffold: a single tokenized smoke route proving the theme pipeline.
 * The full 14-route tree lands in P1 (docs/IMPLEMENTATION.md) — this file
 * is the routing seam that P1 extends.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TokenSmokePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
