import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useCatalog, useContent, useSite } from '../content/context.js'
import { useLanguage } from '../i18n/context.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import './ProductsPage.css'

// Lowercase and strip accents, so "etiquette" matches "Étiquette"
const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Everything a product can be found by, in every language (so "étiquette" works on the English site)
const searchableText = (p) => [p?.title, p?.eyebrow, p?.text, ...(p?.features ?? [])]
const buildSearchIndex = (rawProducts, rawCategories) =>
  new Map(
    rawProducts.map((p) => {
      const category = rawCategories.find((c) => c.id === p.category)
      const text = [
        ...searchableText(p),
        ...Object.values(p.i18n ?? {}).flatMap(searchableText),
        category?.label,
        ...Object.values(category?.i18n ?? {}).map((c) => c.label),
      ]
      return [p.id, normalize(text.filter(Boolean).join(' '))]
    }),
  )

function matchesSearch(product, query, searchIndex) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  const haystack = searchIndex.get(product.id) ?? ''
  return words.every((word) => haystack.includes(word))
}

// Sort options: translation key + comparison in the current language's alphabetical order
const sorts = {
  featured: { key: 'catalog.sort.featured', compare: null }, // keeps the catalogue order
  'name-asc': { key: 'catalog.sort.nameAsc', compare: (lang) => (a, b) => a.title.localeCompare(b.title, lang) },
  'name-desc': { key: 'catalog.sort.nameDesc', compare: (lang) => (a, b) => b.title.localeCompare(a.title, lang) },
}

const icons = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  filters: <path d="M4 6h16M7 12h10M10 18h4" />,
}

const Icon = ({ name, className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    {icons[name]}
  </svg>
)

function ProductsPage() {
  const { lang, t } = useLanguage()
  usePageTitle(`${t('title.products')} – Multiprint`)
  const { products, categories, categoryLabel } = useCatalog()
  const { pages } = useSite()
  const raw = useContent()
  const searchIndex = useMemo(
    () => buildSearchIndex(raw.products, raw.categories),
    [raw.products, raw.categories],
  )

  // All filters live in the URL (?q=…&category=a,b&sort=…) so results can be shared and survive reloads
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const selected = (params.get('category') ?? '')
    .split(',')
    .filter((id) => categories.some((c) => c.id === id))
  const sort = sorts[params.get('sort')] ? params.get('sort') : 'featured'

  const updateParams = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    setParams(next, { replace: true })
  }

  const setCategories = (ids) => updateParams({ category: ids.join(',') })
  const toggleCategory = (id) =>
    setCategories(selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id])
  const clearAll = () => updateParams({ q: '', category: '' })

  const searched = useMemo(
    () => products.filter((p) => matchesSearch(p, query, searchIndex)),
    [products, query, searchIndex],
  )

  // Counts follow the current search, so each checkbox says how many results it would add
  const counts = useMemo(() => {
    const byCategory = Object.fromEntries(categories.map((c) => [c.id, 0]))
    searched.forEach((p) => {
      if (p.category in byCategory) byCategory[p.category]++
    })
    return byCategory
  }, [searched, categories])

  const filtered = selected.length
    ? searched.filter((p) => selected.includes(p.category))
    : searched
  const results = sorts[sort].compare ? [...filtered].sort(sorts[sort].compare(lang)) : filtered
  const activeCount = selected.length + (query ? 1 : 0)

  // ---------- Mobile drawer ----------
  const [drawerOpen, setDrawerOpen] = useState(false)
  const panelRef = useRef(null)
  const openerRef = useRef(null)

  useEffect(() => {
    if (!drawerOpen) return
    const opener = openerRef.current
    document.body.style.overflow = 'hidden' // no page scroll behind the drawer
    panelRef.current?.querySelector('.filters-panel__close')?.focus() // not the search box: avoids popping the keyboard
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
      opener?.focus() // give focus back to the "Filters" button
    }
  }, [drawerOpen])

  return (
    <>
      <PageHeader crumbs={[{ label: t('nav.products') }]} title={pages.products.title}>
        {pages.products.subtitle}
      </PageHeader>

      <section className="catalog">
        <div className="container catalog__layout">
          {/* Sidebar on desktop, slide-in drawer on small screens */}
          <div
            className={`catalog__backdrop${drawerOpen ? ' is-open' : ''}`}
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            ref={panelRef}
            id="catalog-filters"
            className={`filters-panel${drawerOpen ? ' is-open' : ''}`}
            aria-label={t('catalog.productFilters')}
          >
            <div className="filters-panel__head">
              <h2>{t('catalog.filters')}</h2>
              <button
                type="button"
                className="filters-panel__close"
                aria-label={t('catalog.closeFilters')}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>

            <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="product-search" className="filters-panel__label">
                {t('catalog.search')}
              </label>
              <div className="search__box">
                <Icon name="search" className="search__icon" />
                <input
                  id="product-search"
                  type="search"
                  placeholder={t('catalog.searchPlaceholder')}
                  value={query}
                  onChange={(e) => updateParams({ q: e.target.value })}
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    className="search__clear"
                    aria-label={t('catalog.clearSearch')}
                    onClick={() => updateParams({ q: '' })}
                  >
                    <Icon name="close" />
                  </button>
                )}
              </div>
            </form>

            <fieldset className="category-list">
              <legend className="filters-panel__label">{t('catalog.categories')}</legend>
              {categories.map((category) => (
                <label key={category.id} className="category-option">
                  <input
                    type="checkbox"
                    checked={selected.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                  />
                  <span className="category-option__box" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="m6 12.5 4 4 8-9" />
                    </svg>
                  </span>
                  <span className="category-option__label">{category.label}</span>
                  <span className="category-option__count">{counts[category.id]}</span>
                </label>
              ))}
            </fieldset>

            {activeCount > 0 && (
              <button type="button" className="filters-panel__reset" onClick={clearAll}>
                Reset filters
              </button>
            )}

            <div className="filters-panel__footer">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setDrawerOpen(false)}
              >
                {t('catalog.show', { n: results.length })}
              </button>
            </div>
          </aside>

          <div className="catalog__results">
            <div className="results-bar">
              <button
                ref={openerRef}
                type="button"
                className="results-bar__filters"
                aria-expanded={drawerOpen}
                aria-controls="catalog-filters"
                onClick={() => setDrawerOpen(true)}
              >
                <Icon name="filters" />
                {t('catalog.filters')}
                {activeCount > 0 && <span className="results-bar__badge">{activeCount}</span>}
              </button>

              <p className="results-bar__count" aria-live="polite">
                {t('catalog.count', { n: results.length })}
              </p>

              <label className="sort">
                <span>{t('catalog.sortBy')}</span>
                <select
                  value={sort}
                  onChange={(e) =>
                    updateParams({
                      sort: e.target.value === 'featured' ? '' : e.target.value,
                    })
                  }
                >
                  {Object.entries(sorts).map(([id, option]) => (
                    <option key={id} value={id}>
                      {t(option.key)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {activeCount > 0 && (
              <ul className="active-filters" aria-label={t('catalog.activeFilters')}>
                {query && (
                  <li>
                    <button type="button" onClick={() => updateParams({ q: '' })}>
                      <bdi>{query}</bdi>
                      <Icon name="close" />
                      <span className="visually-hidden">{t('catalog.removeSearch')}</span>
                    </button>
                  </li>
                )}
                {selected.map((id) => (
                  <li key={id}>
                    <button type="button" onClick={() => toggleCategory(id)}>
                      {categoryLabel(id)}
                      <Icon name="close" />
                      <span className="visually-hidden">{t('catalog.removeFilter')}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" className="active-filters__clear" onClick={clearAll}>
                    {t('catalog.clearAll')}
                  </button>
                </li>
              </ul>
            )}

            {results.length > 0 ? (
              // key changes with the filters so the cards replay their entrance animation
              <ul key={`${selected.join()}|${query}|${sort}`} className="products-grid">
                {results.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    className="products-grid__item"
                    style={{ '--i': i }}
                  />
                ))}
              </ul>
            ) : (
              <div className="products-empty">
                <Icon name="search" />
                <h2>{t('catalog.noResults')}</h2>
                <p>
                  {query ? (
                    <>
                      {t('catalog.nothingMatches', { query })}
                      {selected.length > 0 && t('catalog.inCategories')}.
                    </>
                  ) : (
                    t('catalog.emptyCategories')
                  )}
                </p>
                <button type="button" className="btn btn--primary" onClick={clearAll}>
                  {t('catalog.resetAll')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default ProductsPage
