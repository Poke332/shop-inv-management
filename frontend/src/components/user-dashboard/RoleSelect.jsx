import { useState } from 'react'

import { ConfirmDialog } from '../../components/ConfirmDialog.jsx'
import { roleNote } from '../../utils/utils.js'

/**
 * RoleSelect — the per-user role control (docs/user-dashboard
 * "RoleSelect"): a labelled native <select> (buyer/staff/manager/admin,
 * 44px min height, 8px radius, blueSlate-200 border; the admin value
 * renders in atomicTangerine-600). Changing the value opens the
 * confirm dialog naming the user + old → new role and the new role's
 * capability note; confirming fires onCommit (the page applies the
 * optimistic update + success flash). The current row's badge stays as
 * the select's visual context.
 * @param {{user: object, onCommit: (user: object, newRole: string) => void}} props
 * @returns {object} the select + its confirm dialog.
 */
export function RoleSelect({ user, onCommit }) {
  const [value, setValue] = useState(user.role)
  const [pending, setPending] = useState(null)

  const confirm = () => {
    const next = pending
    setPending(null)
    setValue(next)
    onCommit(user, next)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <label htmlFor={`role-${user.username}`} className="text-meta text-blueSlate-700">
        Role
      </label>
      <div className="flex items-center gap-2">
        <span className={`role-badge role-${user.role}`}>{user.role}</span>
        <select
          id={`role-${user.username}`}
          className="h-11 rounded-lg border border-blueSlate-200 bg-canvas px-3 text-body font-medium min-w-[110px]"
          style={value === 'admin' ? { color: 'var(--atomicTangerine-600)' } : undefined}
          value={value}
          onChange={(e) => setPending(e.target.value)}
          aria-label={`Role for ${user.username}`}
        >
          {['buyer', 'staff', 'manager', 'admin'].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <ConfirmDialog
        open={pending != null}
        title={`Change ${user.username} from ${user.role} to ${pending}?`}
        body={roleNote(pending)}
        confirmLabel="Change role"
        tone="default"
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
