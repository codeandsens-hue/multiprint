import { useState } from 'react'
import { useCatalog, useContent } from '../../content/context.js'
import { api } from '../api.js'

function CategoryRow({ category, count, onError }) {
  const { reload } = useContent()
  const [label, setLabel] = useState(category.label)
  const [fr, setFr] = useState(category.i18n?.fr?.label ?? '')
  const [ar, setAr] = useState(category.i18n?.ar?.label ?? '')
  const [busy, setBusy] = useState(false)
  const changed =
    label !== category.label ||
    fr !== (category.i18n?.fr?.label ?? '') ||
    ar !== (category.i18n?.ar?.label ?? '')

  const run = async (fn) => {
    setBusy(true)
    onError('')
    try {
      await fn()
      await reload()
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const rename = () =>
    run(() =>
      api(`/admin/categories/${category.id}`, {
        method: 'PUT',
        body: { label, i18n: { fr: { label: fr }, ar: { label: ar } } },
      }),
    )

  const remove = () => {
    if (!confirm(`Delete the category “${category.label}”?`)) return
    run(() => api(`/admin/categories/${category.id}`, { method: 'DELETE' }))
  }

  return (
    <tr>
      <td>
        <input
          aria-label="Category name in English"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && changed && rename()}
        />
      </td>
      <td>
        <input
          aria-label="Category name in French"
          lang="fr"
          value={fr}
          placeholder={label}
          onChange={(e) => setFr(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && changed && rename()}
        />
      </td>
      <td>
        <input
          aria-label="Category name in Arabic"
          lang="ar"
          dir="rtl"
          value={ar}
          placeholder={label}
          onChange={(e) => setAr(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && changed && rename()}
        />
      </td>
      <td>
        {count} product{count === 1 ? '' : 's'}
      </td>
      <td className="table__actions">
        <button
          type="button"
          className="link"
          onClick={rename}
          disabled={busy || !label.trim() || !changed}
        >
          Save
        </button>
        <button
          type="button"
          className="link link--danger"
          onClick={remove}
          disabled={busy || count > 0}
          title={count > 0 ? 'Move or delete its products first' : undefined}
        >
          Delete
        </button>
      </td>
    </tr>
  )
}

function Categories() {
  const { categories, products } = useCatalog()
  const { reload } = useContent()
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')

  const add = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api('/admin/categories', { method: 'POST', body: { label } })
      setLabel('')
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <header className="admin-page__header">
        <div>
          <h1>Categories</h1>
          <p>
            Used by the filters on the products page. Empty translations show the English name. A category with
            products can’t be deleted.
          </p>
        </div>
      </header>

      {error && <p className="admin-error">{error}</p>}

      <section className="panel panel--flush">
        <table className="table">
          <thead>
            <tr>
              <th>English</th>
              <th>Français</th>
              <th>العربية</th>
              <th>Products</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <CategoryRow
                key={`${category.id}|${category.label}|${JSON.stringify(category.i18n ?? {})}`}
                category={category}
                count={products.filter((p) => p.category === category.id).length}
                onError={setError}
              />
            ))}
          </tbody>
        </table>
        <form className="table-tools table-tools--bottom" onSubmit={add}>
          <input
            aria-label="New category name"
            placeholder="New category name"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
          <button type="submit" className="btn btn--primary btn--sm">
            + Add category
          </button>
        </form>
      </section>
    </>
  )
}

export default Categories
