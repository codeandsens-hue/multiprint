import { useId, useRef, useState } from 'react'
import { uploadImage } from './api.js'

export function TextField({ label, value, onChange, multiline = false, rows = 3, hint, ...props }) {
  const id = useId()
  const Input = multiline ? 'textarea' : 'input'
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={multiline ? rows : undefined}
        {...props}
      />
      {hint && <small className="field__hint">{hint}</small>}
    </div>
  )
}

// On/off switch; stores a boolean
export function ToggleField({ label, value, onChange, hint }) {
  return (
    <div className="field">
      <label className="switch">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch__track" aria-hidden="true" />
        <span className="switch__label">{label}</span>
      </label>
      {hint && <small className="field__hint">{hint}</small>}
    </div>
  )
}

// Image picker: preview + upload button + optional URL; stores the image URL string
export function ImageField({ label, value, onChange, hint }) {
  const id = useId()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      onChange(await uploadImage(file))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="field image-field">
      <span className="field__label" id={`${id}-label`}>
        {label}
      </span>
      <div className="image-field__row">
        <div className="image-field__preview">
          {value ? <img src={value} alt="" /> : <span>Aucune image</span>}
        </div>
        <div className="image-field__controls">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={onFile} />
          <button type="button" className="btn btn--outline btn--sm" onClick={() => fileRef.current.click()} disabled={busy}>
            {busy ? 'Envoi…' : value ? 'Remplacer l’image' : 'Envoyer une image'}
          </button>
          <input
            aria-labelledby={`${id}-label`}
            className="image-field__url"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ou collez l’URL d’une image"
          />
          {hint && <small className="field__hint">{hint}</small>}
          {error && <small className="admin-error">{error}</small>}
        </div>
      </div>
    </div>
  )
}

// Editable list. `renderItem(item, update)` draws one entry; `create()` makes a new one.
export function ListField({ label, items, onChange, renderItem, create, addLabel = 'Ajouter', min = 0 }) {
  const update = (index, value) => onChange(items.map((item, i) => (i === index ? value : item)))
  const remove = (index) => onChange(items.filter((_, i) => i !== index))
  const move = (index, by) => {
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(index + by, 0, item)
    onChange(next)
  }

  return (
    <fieldset className="list-field">
      <legend className="field__label">{label}</legend>
      {items.map((item, i) => (
        <div key={i} className="list-field__item">
          <div className="list-field__body">{renderItem(item, (value) => update(i, value), i)}</div>
          <div className="list-field__tools">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">
              ↑
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Descendre">
              ↓
            </button>
            <button type="button" onClick={() => remove(i)} disabled={items.length <= min} aria-label="Supprimer" className="is-danger">
              ✕
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn--outline btn--sm" onClick={() => onChange([...items, create()])}>
        + {addLabel}
      </button>
    </fieldset>
  )
}

// List of plain strings (features, paragraphs…)
export function StringList({ label, items, onChange, addLabel, multiline = false, placeholder }) {
  return (
    <ListField
      label={label}
      items={items}
      onChange={onChange}
      create={() => ''}
      addLabel={addLabel}
      renderItem={(item, update) =>
        multiline ? (
          <textarea aria-label={label} value={item} rows={3} onChange={(e) => update(e.target.value)} placeholder={placeholder} />
        ) : (
          <input aria-label={label} value={item} onChange={(e) => update(e.target.value)} placeholder={placeholder} />
        )
      }
    />
  )
}

// Sticky save bar shown at the bottom of every editor
export function SaveBar({ dirty, saving, message, onSave, onReset, saveLabel = 'Enregistrer' }) {
  return (
    <div className={`save-bar${dirty ? ' is-dirty' : ''}`}>
      <span className="save-bar__status" role="status">
        {message || (dirty ? 'Modifications non enregistrées' : 'Toutes les modifications sont enregistrées')}
      </span>
      {onReset && dirty && (
        <button type="button" className="btn btn--outline" onClick={onReset} disabled={saving}>
          Annuler
        </button>
      )}
      <button type="button" className="btn btn--primary" onClick={onSave} disabled={!dirty || saving}>
        {saving ? 'Enregistrement…' : saveLabel}
      </button>
    </div>
  )
}
