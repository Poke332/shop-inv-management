import { RoleSelect } from './RoleSelect.jsx'
import { StatusToggle } from './StatusToggle.jsx'

/**
 * UserTable — the user dashboard's row list (docs/user-dashboard
 * "UserTable"): name (blueSlate-950 14/600, min-width 190px) + email,
 * the role badge pill (color-tokens §5: accent-100 fill + accent-700
 * text + 1px accent-300 border), the status pill (Active
 * willowGreen-100 / Disabled strawberryRed-100 — text label always
 * present), the "last active N" line, then StatusToggle + RoleSelect
 * right-aligned. A disabled row carries the 3px strawberryRed-500
 * left bar. SELF-PROTECTION: the signed-in admin's own row renders NO
 * controls at all (absent, not disabled — a disabled admin could not
 * re-enable). Mobile <768px: the table becomes a card list with the
 * controls.
 * @param {{users: object[], loading: boolean, currentUsername: string,
 *   onRoleCommit: (user: object, newRole: string) => void,
 *   onStatusCommit: (user: object, active: boolean) => void}} props
 * @returns {object} the table (or its mobile card variant).
 */
export function UserTable({ users, loading, currentUsername, onRoleCommit, onStatusCommit }) {
  if (loading) {
    return (
      <div className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding" aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-blueSlate-200 last:border-0">
            <div className="skeleton skeleton-line-sm flex-1" />
            <div className="skeleton skeleton-line-sm w-20" />
            <div className="skeleton skeleton-line-sm w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (!users.length) {
    return (
      <div className="state-empty bg-canvas border border-blueSlate-200 rounded-xl">
        <h2>No users match</h2>
        <p>Try a different name or email.</p>
      </div>
    )
  }

  // the row's right-aligned control cluster — ABSENT on the signed-in
  // admin's own row (self-protection), not disabled
  const controls = (u) => {
    if (u.username === currentUsername) return null
    return (
      <div className="flex items-center justify-end gap-4 flex-wrap">
        <StatusToggle user={u} onCommit={onStatusCommit} />
        <RoleSelect user={u} onCommit={onRoleCommit} />
      </div>
    )
  }

  const statusPill = (u) => (
    <span
      className="stock-pill"
      style={{ background: u.active ? 'var(--willowGreen-100)' : 'var(--strawberryRed-100)' }}
    >
      {u.active ? 'Active' : 'Disabled'}
    </span>
  )

  // zebra utility classes come BEFORE the user-row-disabled hook so the
  // 3px left bar is never overridden by a zebra background
  const zebra = (i) => (i % 2 ? 'bg-blueSlate-50' : 'bg-canvas')

  return (
    <div>
      {/* desktop table (≥768px) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-blueSlate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blueSlate-50">
              <th scope="col" className="text-left text-badge font-semibold text-blueSlate-700 px-4 py-3" style={{ minWidth: 190 }}>
                Name
              </th>
              <th scope="col" className="text-left text-badge font-semibold text-blueSlate-700 px-4 py-3">Role</th>
              <th scope="col" className="text-left text-badge font-semibold text-blueSlate-700 px-4 py-3">Status</th>
              <th scope="col" className="text-left text-badge font-semibold text-blueSlate-700 px-4 py-3">Last active</th>
              <th scope="col" className="text-right text-badge font-semibold text-blueSlate-700 px-4 py-3">Controls</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr
                key={u.username}
                className={`border-b border-blueSlate-200 last:border-0 ${zebra(i)} ${u.active ? '' : 'user-row-disabled'}`}
              >
                <td className="px-4 py-3 align-top">
                  <span className="text-body font-semibold text-ink block">{u.username}</span>
                  <span className="text-meta text-blueSlate-700">{u.email}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`role-badge role-${u.role}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">{statusPill(u)}</td>
                <td className="px-4 py-3 text-meta text-blueSlate-700">last {u.lastActiveAt}</td>
                <td className="px-4 py-3 text-right">{controls(u)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile (<768px): cards with the toggle + role select */}
      <ul className="md:hidden flex flex-col gap-3">
        {users.map((u) => (
          <li
            key={u.username}
            className={`bg-canvas border border-blueSlate-200 rounded-xl p-4 flex flex-col gap-3 ${
              u.active ? '' : 'user-row-disabled'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-body font-semibold text-ink">{u.username}</span>
              <span className={`role-badge role-${u.role}`}>{u.role}</span>
              {statusPill(u)}
            </div>
            <p className="text-meta text-blueSlate-700">
              {u.email} · last {u.lastActiveAt}
            </p>
            {controls(u)}
          </li>
        ))}
      </ul>
    </div>
  )
}
