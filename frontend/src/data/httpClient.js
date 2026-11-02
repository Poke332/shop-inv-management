import { API_BASE } from './runtime.js'
import { token, clearAuth } from './authStorage.js'

// Identical in-flight GETs share one fetch: one Promise per URL while the
// request is in flight, dropped the moment it settles (no cache between
// calls, no request abort).
const inflight = new Map()

async function fetchJson(path, { method = 'GET', body, signal } = {}) {
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

/**
 * The data layer's single fetch entry point (every GET/POST/PATCH of the
 * HTTP data source goes through this). A GET with no body and no abort
 * signal reuses an in-flight identical request (one shared Promise);
 * everything else fetches directly.
 * @param {string} path  API path, e.g. "/products".
 * @param {{method?: string, body?: object, signal?: AbortSignal}} [options]
 * @returns {Promise<object|null>} the parsed response body (null on 204).
 */
export async function request(path, { method = 'GET', body, signal } = {}) {
  if (method === 'GET' && body === undefined && signal === undefined) {
    const pending = inflight.get(path)
    if (pending) return pending
    const task = fetchJson(path)
    inflight.set(path, task)
    task.then(
      () => inflight.delete(path),
      () => inflight.delete(path),
    )
    return task
  }
  return fetchJson(path, { method, body, signal })
}
