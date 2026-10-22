import { API_BASE } from './runtime.js'
import { token, clearAuth } from './authStorage.js'

export async function request(path, { method = 'GET', body, signal } = {}) {
  const accessToken = token()
  let response
  try {
    response = await fetch(API_BASE + path, {
      method, signal,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (cause) {
    if (cause.name === 'AbortError') throw cause
    throw Object.assign(new Error('The backend is not reachable.'), { status: 0 })
  }
  const raw = response.status === 204 ? '' : await response.text()
  let data
  try { data = raw ? JSON.parse(raw) : null } catch {
    throw Object.assign(new Error('The backend does not return valid JSON.'), { status: response.status })
  }
  if (!response.ok) {
    if (accessToken && response.status === 401 && !['/auth/login','/auth/register'].includes(path)) clearAuth()
    if (accessToken && response.status === 403 && path !== '/auth/me') {
      window.dispatchEvent(new Event('sunset-auth-refresh'))
    }
    throw Object.assign(new Error(data?.message || 'Request failed.'), {
      status: response.status, code: data?.code, conflicts: data?.conflicts,
    })
  }
  return data
}
