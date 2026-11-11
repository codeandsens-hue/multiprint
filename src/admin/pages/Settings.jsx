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
    if (next !== confirm) return setStatus({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' })
    try {
      await api('/admin/password', { method: 'PUT', body: { current, next } })
      setCurrent('')
      setNext('')
      setConfirm('')
      setStatus({ type: 'ok', text: 'Mot de passe modifié. Les autres appareils ont été déconnectés.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    }
  }

  return (
    <>
      <header className="admin-page__header">
        <div>
          <h1>Paramètres</h1>
          <p>Sécurité du tableau de bord.</p>
        </div>
      </header>

      <section className="panel panel--narrow">
        <h2 className="panel__title">Changer le mot de passe</h2>
        <form onSubmit={onSubmit} className="stack">
          <TextField label="Mot de passe actuel" type="password" autoComplete="current-password" value={current} onChange={setCurrent} required />
          <TextField
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={setNext}
            required
            minLength={8}
            hint="Au moins 8 caractères"
          />
          <TextField label="Confirmer le nouveau mot de passe" type="password" autoComplete="new-password" value={confirm} onChange={setConfirm} required />
          {status.text && (
            <p className={status.type === 'ok' ? 'admin-ok' : 'admin-error'} role="status">
              {status.text}
            </p>
          )}
          <button type="submit" className="btn btn--primary">
            Mettre à jour le mot de passe
          </button>
        </form>
      </section>
    </>
  )
}

export default Settings
