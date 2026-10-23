const TOKEN_KEY = 'sunset.final-project.access-token'
const USER_KEY = 'sunset.final-project.http-user'
const listeners = new Set()

export function token() { return sessionStorage.getItem(TOKEN_KEY) }
export function profile() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null') } catch { return null }
}
export function saveAuth(result) {
  sessionStorage.setItem(TOKEN_KEY, result.token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(result.user))
}
export function saveProfile(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  for (const notify of listeners) notify()
}
export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  for (const notify of listeners) notify()
}
export function onAuthChange(notify) {
  listeners.add(notify)
  return () => listeners.delete(notify)
}
