import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../../content/context.js'
import { api } from '../api.js'

const ranges = [7, 30, 90]

const formatDay = (day, options = { day: 'numeric', month: 'short' }) =>
  new Date(`${day}T00:00:00`).toLocaleDateString('fr-FR', options)

// "+12%" compared with the previous period of the same length
function Delta({ now, before }) {
  if (!before) return <span className="kpi__delta">Pas de données pour la période précédente</span>
  const change = Math.round(((now - before) / before) * 100)
  const tone = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  return (
    <span className={`kpi__delta kpi__delta--${tone}`}>
      {change > 0 ? '▲' : change < 0 ? '▼' : '■'} {Math.abs(change)}% vs période précédente
    </span>
  )
}

function Kpi({ label, value, children }) {
  return (
    <div className="kpi">
      <span className="kpi__label">{label}</span>
      <strong className="kpi__value">{value}</strong>
      {children}
    </div>
  )
}

// Column chart of visitors per day: one series, so no legend (the title names it)
function VisitorsChart({ daily }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...daily.map((d) => d.visitors), 1)
  // Round the axis up to a "nice" number and draw 4 grid lines
  const step = 10 ** Math.floor(Math.log10(max))
  const top = Math.ceil(max / step) * step || 1
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(top * t))
  const labelEvery = daily.length > 31 ? 14 : daily.length > 7 ? 5 : 1

  return (
    <div className="chart" onMouseLeave={() => setHover(null)}>
      <div className="chart__plot">
        {ticks.map((tick) => (
          <div key={tick} className="chart__grid" style={{ bottom: `${(tick / top) * 100}%` }}>
            <span>{tick}</span>
          </div>
        ))}
        <div className="chart__bars" style={{ '--count': daily.length }}>
          {daily.map((d, i) => (
            <div
              key={d.day}
              className={`chart__col${hover === i ? ' is-hover' : ''}`}
              onMouseEnter={() => setHover(i)}
            >
              <div className="chart__bar" style={{ height: `${(d.visitors / top) * 100}%` }} />
              {hover === i && (
                <div className={`chart__tooltip${i > daily.length * 0.7 ? ' is-left' : ''}`} role="tooltip">
                  <strong>{formatDay(d.day, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                  <span>
                    {d.visitors} visiteur{d.visitors > 1 ? 's' : ''}
                  </span>
                  <span>{d.views} pages vues</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="chart__axis" style={{ '--count': daily.length }}>
        {daily.map((d, i) => (
          <span key={d.day}>{i % labelEvery === 0 || i === daily.length - 1 ? formatDay(d.day) : ''}</span>
        ))}
      </div>

      {/* Same data as a table, for screen readers and exact numbers */}
      <details className="chart__table">
        <summary>Afficher sous forme de tableau</summary>
        <table>
          <thead>
            <tr>
              <th>Jour</th>
              <th>Visiteurs</th>
              <th>Pages vues</th>
            </tr>
          </thead>
          <tbody>
            {[...daily].reverse().map((d) => (
              <tr key={d.day}>
                <td>{formatDay(d.day, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                <td>{d.visitors}</td>
                <td>{d.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}

// Horizontal bar list: label, bar proportional to the largest value, count
function BarList({ title, items, format = (label) => label, empty }) {
  const max = Math.max(...items.map((i) => i.count), 1)
  const total = items.reduce((sum, i) => sum + i.count, 0)
  return (
    <section className="panel">
      <h2 className="panel__title">{title}</h2>
      {items.length === 0 ? (
        <p className="panel__empty">{empty}</p>
      ) : (
        <ul className="bar-list">
          {items.map((item) => (
            <li key={item.label}>
              <div className="bar-list__row">
                <span className="bar-list__label">{format(item.label)}</span>
                <span className="bar-list__value">
                  {item.count} <small>({Math.round((item.count / total) * 100)}%)</small>
                </span>
              </div>
              <div className="bar-list__track">
                <div className="bar-list__bar" style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const pageName = (path) =>
  ({ '/': 'Accueil', '/products': 'Produits', '/about': 'À propos', '/contact': 'Contact' })[path] ?? path

const deviceName = { desktop: 'Ordinateur', mobile: 'Mobile', tablet: 'Tablette' }

function Overview() {
  const { products, categories } = useCatalog()
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api(`/admin/stats?days=${days}`)
      .then((data) => active && setStats(data))
      .catch((err) => active && setError(err.message))
    return () => {
      active = false
    }
  }, [days])

  return (
    <>
      <header className="admin-page__header">
        <div>
          <h1>Vue d’ensemble</h1>
          <p>Visiteurs, demandes et catalogue en un coup d’œil.</p>
        </div>
        <div className="segmented" role="group" aria-label="Période">
          {ranges.map((range) => (
            <button key={range} type="button" aria-pressed={days === range} onClick={() => setDays(range)}>
              {range} jours
            </button>
          ))}
        </div>
      </header>

      {error && <p className="admin-error">{error}</p>}
      {!stats ? (
        !error && <p className="panel__empty">Chargement des statistiques…</p>
      ) : (
        <>
          <div className="kpis">
            <Kpi label="Visiteurs" value={stats.visitors.toLocaleString('fr-FR')}>
              <Delta now={stats.visitors} before={stats.previous.visitors} />
            </Kpi>
            <Kpi label="Pages vues" value={stats.views.toLocaleString('fr-FR')}>
              <Delta now={stats.views} before={stats.previous.views} />
            </Kpi>
            <Kpi label="Pages par visiteur" value={stats.pagesPerVisitor}>
              <span className="kpi__delta">
                Aujourd’hui : {stats.today.visitors} visiteur{stats.today.visitors > 1 ? 's' : ''}
              </span>
            </Kpi>
            <Kpi label="Demandes reçues" value={stats.requests.period}>
              <Link to="/admin/requests" className="kpi__link">
                {stats.requests.unread} non lue(s) · {stats.requests.orders} commande(s) →
              </Link>
            </Kpi>
            <Kpi label="Produits" value={products.length}>
              <Link to="/admin/products" className="kpi__link">
                {categories.length} catégories · {products.filter((p) => p.featured).length} en vedette →
              </Link>
            </Kpi>
          </div>

          <section className="panel">
            <h2 className="panel__title">Visiteurs par jour</h2>
            <VisitorsChart daily={stats.daily} />
          </section>

          <div className="panels">
            <BarList title="Pages les plus vues" items={stats.topPages} format={pageName} empty="Aucune visite pour le moment." />
            <BarList
              title="Provenance des visiteurs"
              items={stats.referrers}
              empty="Aucun site référent pour le moment (les visites directes ne sont pas listées)."
            />
            <BarList
              title="Appareils"
              items={stats.devices}
              format={(d) => deviceName[d] ?? d.charAt(0).toUpperCase() + d.slice(1)}
              empty="Aucune visite pour le moment."
            />
          </div>
        </>
      )}
    </>
  )
}

export default Overview
