import { Link } from 'react-router-dom'
import { useT } from '../i18n/context.js'
import './PageHeader.css'

// Top band of inner pages: breadcrumb, title and intro text
function PageHeader({ crumbs, title, children }) {
  const t = useT()
  return (
    <section className="page-header">
      <div className="container">
        <nav className="breadcrumb" aria-label={t('breadcrumb')}>
          <ol>
            <li>
              <Link to="/">{t('breadcrumb.home')}</Link>
            </li>
            {crumbs.map((crumb) =>
              crumb.to ? (
                <li key={crumb.label}>
                  <Link to={crumb.to}>{crumb.label}</Link>
                </li>
              ) : (
                <li key={crumb.label} aria-current="page">
                  {crumb.label}
                </li>
              ),
            )}
          </ol>
        </nav>
        <h1 className="page-header__title">{title}</h1>
        {children && <p className="page-header__subtitle">{children}</p>}
      </div>
    </section>
  )
}

export default PageHeader
