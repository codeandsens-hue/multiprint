import { useState } from 'react'
import { api } from '../api.js'
import { TextField } from '../fields.jsx'

function Settings() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState({ type: '', text: '' })

  const onSubmit = async (e) => {
    e.preventDefault()
    if (next !== confirm) return setStatus({ type: 'error', text: 'The new passwords don’t match' })
    try {
      await api('/admin/password', { method: 'PUT', body: { current, next } })
      setCurrent('')
      setNext('')
      setConfirm('')
      setStatus({ type: 'ok', text: 'Password changed. Other devices have been signed out.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    }
  }

  return (
    <>
      <header className="admin-page__header">
        <div>
          <h1>Settings</h1>
          <p>Dashboard security.</p>
        </div>
      </header>

      <section className="panel panel--narrow">
        <h2 className="panel__title">Change password</h2>
        <form onSubmit={onSubmit} className="stack">
          <TextField label="Current password" type="password" autoComplete="current-password" value={current} onChange={setCurrent} required />
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={setNext}
            required
            minLength={8}
            hint="At least 8 characters"
          />
          <TextField label="Repeat new password" type="password" autoComplete="new-password" value={confirm} onChange={setConfirm} required />
          {status.text && (
            <p className={status.type === 'ok' ? 'admin-ok' : 'admin-error'} role="status">
              {status.text}
            </p>
          )}
          <button type="submit" className="btn btn--primary">
            Update password
          </button>
        </form>
      </section>
    </>
  )
}

export default Settings
