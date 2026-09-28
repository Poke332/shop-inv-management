import { useEffect, useMemo, useState } from 'react'

import { ToastHost } from '../components/ToastHost.jsx'
import { UserTable } from '../components/user-dashboard/UserTable.jsx'
import { mockApi } from '../data'
import { useAuth } from '../hooks/useAuth.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useToasts } from '../hooks/useToasts.js'

/**
 * User dashboard (docs/user-dashboard). Route /ops/users — admin only
 * (requireAdmin): the user table with per-row RoleSelect + StatusToggle,
 * the confirm dialogs (inside UserTable), the "Role updated to <role> ·
 * <username>" success flash, the 50-per-page "Load more" list, and SELF-
 * PROTECTION — the signed-in admin's own row carries no controls (absent,
 * not disabled). Role/status changes are optimistic in the row, reverted
 * on failure with the error toast.
 * @returns {object} the page.
 */
export function UsersPage() {
  const user = useAuth().user
  const [users, setUsers] = useState(null)
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search.trim().toLowerCase(), 300)
  const [limit, setLimit] = useState(50)
  const [flash, setFlash] = useState(null)
  const { toasts, toast, dismiss } = useToasts()

  useEffect(() => {
    let alive = true
    setUsers(null)
    setCounts(null)
    setError(false)
    mockApi
      .getUsers()
      .then((d) => {
        if (!alive) return
        setUsers(d.items)
        setCounts({ total: d.items.length, ...d.counts })
      })
      .catch(() => {
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [retry])

  const filtered = useMemo(() => {
    if (!users) return null
    if (!debounced) return users
    return users.filter(
      (u) => u.username.toLowerCase().includes(debounced) || u.email.toLowerCase().includes(debounced),
    )
  }, [users, debounced])

  // Optimistic role/status patch: apply in state, confirm via mockApi,
  // revert + toast on failure (the page re-queries on navigation, so no
  // cross-page state survives).
  const patchUser = async (username, next, apiCall, onDone) => {
    const prev = users.find((u) => u.username === username)
    if (!prev) return
    setUsers((us) => (us ? us.map((u) => (u.username === username ? next(u) : u)) : us))
    try {
      await apiCall(username)
      onDone()
    } catch {
      setUsers((us) => (us ? us.map((u) => (u.username === username ? prev : u)) : us))
      toast('Update failed — retry')
    }
  }

  const showFlash = (text) => {
    setFlash({ text })
    setTimeout(() => setFlash(null), 4000)
  }

  const visible = filtered ? filtered.slice(0, limit) : null
  const remaining = filtered ? filtered.length - limit : 0

  return (
    <div className="ops-page">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-h1 font-h1 text-ink">Users</h1>
        <span className="badge bg-blueSlate-100 text-blueSlate-900">Admin only</span>
      </div>

      {error ? (
        <div className="state-error mt-5" role="alert">
          The user list could not be loaded.{' '}
          <button type="button" className="underline font-semibold" onClick={() => setRetry((r) => r + 1)}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / email…"
              aria-label="Search users"
              className="h-11 w-full sm:w-[320px] rounded-lg border border-blueSlate-200 bg-canvas px-4 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2"
            />
            {counts ? (
              <span className="text-meta text-blueSlate-700 sm:ml-auto">
                {counts.total} users · {counts.staff} staff · {counts.managers} managers · {counts.admin} admin
              </span>
            ) : null}
          </div>

          {flash ? (
            <div className="flash-banner mt-4" role="status">
              {flash.text}
            </div>
          ) : null}

          <div className="mt-5">
            <UserTable
              users={visible || []}
              loading={!users && !error}
              currentUsername={user?.username}
              onRoleCommit={(row, newRole) =>
                patchUser(
                  row.username,
                  (u) => ({ ...u, role: newRole }),
                  (id) => mockApi.setUserRole(id, newRole),
                  () => showFlash(`Role updated to ${newRole} · ${row.username}`),
                )
              }
              onStatusCommit={(row, active) =>
                patchUser(
                  row.username,
                  (u) => ({ ...u, active }),
                  (id) => mockApi.setUserActive(id, active),
                  () =>
                    showFlash(active ? `${row.username} re-enabled` : `${row.username} disabled`),
                )
              }
            />
            {remaining > 0 ? (
              <button type="button" className="btn-primary btn-loadmore mt-4" onClick={() => setLimit((l) => l + 50)}>
                Load more
              </button>
            ) : filtered && filtered.length > 1 ? (
              <p className="loadmore-done mt-4">{filtered.length} users shown</p>
            ) : null}
          </div>

          <p className="text-meta text-blueSlate-700 mt-5">
            Toggle = disable / enable account — a disabled user cannot log in (their next attempt shows
            the "Account not available" banner). Disabling is not deleting.
          </p>
        </>
      )}

      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
