import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useContent } from '../content/context.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { api } from './api.js'
import Categories from './pages/Categories.jsx'
import ContentEditor from './pages/ContentEditor.jsx'
import Login from './pages/Login.jsx'
import Overview from './pages/Overview.jsx'
import ProductEditor from './pages/ProductEditor.jsx'
import Products from './pages/Products.jsx'
import Requests from './pages/Requests.jsx'
import Settings from './pages/Settings.jsx'
import './admin.css'

const nav = [
  { to: '/admin', label: 'Vue d’ensemble', end: true, icon: <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" /> },
  { to: '/admin/requests', label: 'Demandes', icon: <path d="M4 5h16v11H8l-4 4V5Z" /> },
  { to: '/admin/products', label: 'Produits', icon: <path d="M4 7 12 3l8 4v10l-8 4-8-4V7Zm0 0 8 4 8-4M12 11v10" /> },
  { to: '/admin/categories', label: 'Catégories', icon: <path d="M4 6h16M4 12h16M4 18h10" /> },
  { to: '/admin/content', label: 'Contenu du site', icon: <path d="M5 4h14v16H5V4Zm3 4h8M8 12h8M8 16h5" /> },
  { to: '/admin/settings', label: 'Paramètres', icon: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" /> },
]

function Shell({ onSignOut, unread }) {
  const { pathname } = useLocation()

  // New page: start at the top, and on phones scroll the active menu item into view
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document
      .querySelector('.admin__nav .active')
      ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' })
  }, [pathname])

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__brand">
          <img src="/brand/logo-light.png" alt="Multiprint" width="640" height="366" />
          <small>Admin</small>
        </div>
        <nav className="admin__nav" aria-label="Tableau de bord">
          {nav.map((item) => (
            <NavLink key={item.label} to={item.to} end={item.end} className="admin__nav-link">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {item.icon}
              </svg>
              {item.label}
              {item.to === '/admin/requests' && unread > 0 && <span className="admin__badge">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="admin__sidebar-footer">
          <a href="/" target="_blank" rel="noreferrer" className="admin__nav-link">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />
            </svg>
            Voir le site
          </a>
          <button type="button" className="admin__nav-link" onClick={onSignOut}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11" />
            </svg>
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="admin__main">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="requests" element={<Requests />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductEditor />} />
          <Route path="products/:id" element={<ProductEditor />} />
          <Route path="categories" element={<Categories />} />
          <Route path="content" element={<ContentEditor />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function AdminApp() {
  usePageTitle('Administration – Multiprint')
  const navigate = useNavigate()
  const { reload } = useContent()
  const [signedIn, setSignedIn] = useState(null) // null = checking
  const [unread, setUnread] = useState(0)
  const [ready, setReady] = useState(null) // null = loading, false = server unreachable

  useEffect(() => {
    api('/auth/session')
      .then((s) => setSignedIn(s.signedIn))
      .catch(() => setSignedIn(false))
  }, [])

  // Unread requests badge, refreshed every minute
  useEffect(() => {
    if (!signedIn) return
    const load = () =>
      api('/admin/stats?days=7')
        .then((s) => setUnread(s.requests.unread))
        .catch(() => {})
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [signedIn])

  // Editors must start from the server's content (never the built-in defaults), so wait for it
  useEffect(() => {
    if (!signedIn) return
    let active = true
    reload().then((data) => active && setReady(Boolean(data)))
    return () => {
      active = false
    }
  }, [signedIn, reload])

  if (signedIn === null) return <div className="admin-loading">Chargement…</div>
  if (!signedIn) return <Login onSignedIn={() => setSignedIn(true)} />
  if (ready === null) return <div className="admin-loading">Chargement du contenu…</div>
  if (!ready) return <div className="admin-loading">Impossible de joindre le serveur. Vérifiez qu’il est démarré, puis rechargez la page.</div>

  const signOut = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setSignedIn(false)
    navigate('/admin')
  }

  return <Shell onSignOut={signOut} unread={unread} />
}

export default AdminApp
