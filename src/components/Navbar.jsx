import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/context.js'
import { languages } from '../i18n/strings.js'
import './Navbar.css'

// `match` decides which link is highlighted for the current page
const links = [
  { key: 'nav.home', to: '/', match: (path) => path === '/' },
  { key: 'nav.about', to: '/about', match: (path) => path === '/about' },
  { key: 'nav.products', to: '/products', match: (path) => path.startsWith('/products') },
  { key: 'nav.contact', to: '/contact', match: (path) => path === '/contact' },
]

function Navbar() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { lang, setLang, t } = useLanguage()
  const [hidden, setHidden] = useState(false)
  const langRef = useRef(null)

  // Hide the bar while scrolling down, show it again when scrolling up or near the top
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY
      if (Math.abs(delta) < 8) return // ignore tiny movements
      setHidden(delta > 0 && y > 120)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the language menu when clicking outside it or pressing Escape
  useEffect(() => {
    if (!langOpen) return
    const onClick = (e) => {
      if (!langRef.current?.contains(e.target)) setLangOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setLangOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [langOpen])

  const current = languages.find((l) => l.code === lang)

  return (
    <header className={`navbar${hidden && !menuOpen && !langOpen ? ' is-hidden' : ''}`}>
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
          <img src="/brand/logo.png" alt="Multiprint" width="640" height="366" />
        </Link>

        <nav className={`navbar__links${menuOpen ? ' is-open' : ''}`} aria-label={t('nav.main')}>
          {links.map((link) => {
            const isActive = link.match(pathname)
            const label = t(link.key)
            return (
              <Link
                key={link.key}
                to={link.to}
                data-label={label}
                className={isActive ? 'is-active' : undefined}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="navbar__actions">
          <div className="lang" ref={langRef}>
            <button
              type="button"
              className="lang__button"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label={t('nav.language', { language: current.label })}
              onClick={() => {
                setLangOpen((open) => !open)
                setMenuOpen(false)
              }}
            >
              <svg className="lang__globe" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
              </svg>
              {current.short}
              <span className="lang__caret" aria-hidden="true" />
            </button>
            {langOpen && (
              <ul className="lang__menu" role="listbox" aria-label={t('nav.languages')}>
                {languages.map((l) => (
                  <li key={l.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={lang === l.code}
                      className={lang === l.code ? 'is-selected' : undefined}
                      onClick={() => {
                        setLang(l.code)
                        setLangOpen(false)
                      }}
                    >
                      <span lang={l.code}>{l.label}</span>
                      <span className="lang__code">{l.short}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            className={`navbar__toggle${menuOpen ? ' is-open' : ''}`}
            aria-label={t(menuOpen ? 'nav.closeMenu' : 'nav.openMenu')}
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((open) => !open)
              setLangOpen(false)
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
