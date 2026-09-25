import { useContext } from 'react'

import { AuthContext } from '../contexts/AuthContext.jsx'

/**
 * P3.1 REV 10 (code-org rule: one custom hook per file) — the useAuth
 * accessor, moved out of contexts/AuthContext.jsx so every custom hook
 * lives in src/hooks/. Reads the auth context value (session user + role,
 * signIn, signOut). Throws when called outside <AuthProvider>.
 * @returns {{user: ({username: string, role: string}|null), role: (string|null),
 *            signIn: (user: object, role: string) => string,
 *            signOut: () => void}}
 * @throws {Error} when called outside <AuthProvider>
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
