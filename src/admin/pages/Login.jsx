import { useState } from 'react'
import { api } from '../api.js'

function Login({ onSignedIn }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/auth/login', { method: 'POST', body: { password } })
      onSignedIn()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={onSubmit}>
        <div className="admin__brand">
          Multi<span>print</span>
          <small>Admin</small>
        </div>
        <h1>Sign in to the dashboard</h1>
        <div className="field">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </div>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <a href="/" className="login__back">
          ← Back to the website
        </a>
      </form>
    </div>
  )
}

export default Login
