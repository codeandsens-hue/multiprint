import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog, useContent } from '../../content/context.js'
import { api } from '../api.js'

function Products() {
  const { products, categoryLabel } = useCatalog()
  const { reload } = useContent()
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const save = async (product, changes) => {
    setError('')
    try {
      await api(`/admin/products/${product.id}`, { method: 'PUT', body: { ...product, ...changes } })
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (product) => {
    if (!confirm(`Supprimer « ${product.title} » ? Cette action est irréversible.`)) return
    try {
      await api(`/admin/products/${product.id}`, { method: 'DELETE' })
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const q = query.trim().toLowerCase()
  const visible = products.filter((p) => !q || `${p.title} ${p.eyebrow}`.toLowerCase().includes(q))

  return (
    <>
      <header className="admin-page__header">
        <div>
          <h1>Produits</h1>
          <p>
            {products.length} produits. Les produits en vedette apparaissent dans le carrousel de l’accueil et dans « Derniers produits ».
          </p>
        </div>
        <Link to="/admin/products/new" className="btn btn--primary">
          + Ajouter un produit
        </Link>
      </header>

      {error && <p className="admin-error">{error}</p>}

      <section className="panel panel--flush">
        <div className="table-tools">
          <input
            type="search"
            placeholder="Rechercher un produit…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher un produit"
          />
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>En vedette</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {visible.map((product) => (
              <tr key={product.id}>
                <td>
                  <Link to={`/admin/products/${product.id}`} className="table__product">
                    <img src={product.image?.src} alt="" />
                    <span>
                      <strong>{product.title}</strong>
                      <small>{product.eyebrow}</small>
                    </span>
                  </Link>
                </td>
                <td>{categoryLabel(product.category) || <em>Aucune</em>}</td>
                <td>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={Boolean(product.featured)}
                      onChange={(e) => save(product, { featured: e.target.checked })}
                    />
                    <span className="switch__track" aria-hidden="true" />
                    <span className="visually-hidden">En vedette</span>
                  </label>
                </td>
                <td className="table__actions">
                  <a href={`/products/${product.id}`} target="_blank" rel="noreferrer" className="link">
                    Voir
                  </a>
                  <Link to={`/admin/products/${product.id}`} className="link">
                    Modifier
                  </Link>
                  <button type="button" className="link link--danger" onClick={() => remove(product)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="panel__empty">
                  Aucun produit ne correspond à « {query} ».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}

export default Products
