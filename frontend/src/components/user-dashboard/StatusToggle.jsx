import { useState } from 'react'

import { ConfirmDialog } from '../../components/ConfirmDialog.jsx'

/**
 * StatusToggle — the enable/disable switch (docs/user-dashboard
 * "StatusToggle"): a 40×24 track inside a 44px hit area (on-state
 * willowGreen-500, off-state blueSlate-200, white 20px thumb;
 * role="switch" + aria-checked, keyboard-operable). Disabling is a
 * danger ConfirmDialog ("Disable <name>? They will not be able to log
 * in." — strawberryRed confirm); enabling is the lighter willowGreen
 * confirm. Confirming fires onCommit (the page applies the optimistic
 * update; the disabled row then carries the 3px strawberryRed-500
 * left bar in UserTable).
 * @param {{user: object, onCommit: (user: object, active: boolean) => void}} props
 * @returns {object} the switch + its confirm dialog.
 */
export function StatusToggle({ user, onCommit }) {
  const [pending, setPending] = useState(null) // true = enable, false = disable

  const confirm = () => {
    const next = pending
    setPending(null)
    onCommit(user, next)
  }

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={user.active}
        aria-label={`${user.active ? 'Disable' : 'Enable'} ${user.username}`}
        className="switch"
        onClick={() => setPending(!user.active)}
      >
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
        <span className="switch-label" aria-hidden="true">
          {user.active ? 'Active' : 'Disabled'}
        </span>
      </button>
      <ConfirmDialog
        open={pending != null}
        title={pending ? `Enable ${user.username}?` : `Disable ${user.username}?`}
        body={
          pending
            ? 'Their account will be active again and they can log in.'
            : 'They will not be able to log in.'
        }
        confirmLabel={pending ? 'Enable account' : 'Disable account'}
        tone={pending ? 'success' : 'danger'}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
