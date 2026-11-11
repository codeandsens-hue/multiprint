import { Link } from 'react-router-dom'
import { useCategories, useSite } from '../content/context.js'
import { useT } from '../i18n/context.js'
import './Footer.css'

const navigation = [
  { key: 'nav.home', to: '/' },
  { key: 'nav.about', to: '/about' },
  { key: 'footer.certifications', to: '/#certification' },
  { key: 'nav.products', to: '/products' },
  { key: 'footer.journey', to: '/#journey' },
  { key: 'nav.contact', to: '/contact' },
]

// Generic link icon for networks added in the admin that have no dedicated icon
const fallbackIcon = (
  <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
)

const socialIcons = {
  Facebook: (
    <path d="M14 8.5V6.8c0-.8.5-1.3 1.3-1.3H17V2.6c-.6-.1-1.6-.2-2.6-.2-2.6 0-4.2 1.6-4.2 4.3v1.8H7.5v3.2h2.7v9.9H14v-9.9h2.7l.4-3.2H14Z" />
  ),
  Instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" />
    </>
  ),
  LinkedIn: (
    <>
      <path d="M4 9h3.6v11H4z" />
      <circle cx="5.8" cy="5" r="2" />
      <path d="M10 9h3.4v1.6c.5-.9 1.7-1.9 3.6-1.9 3.6 0 4 2.4 4 5.4V20h-3.6v-5.2c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V20H10V9Z" />
    </>
  ),
  YouTube: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="m10 9 5 3-5 3V9Z" />
    </>
  ),
}

const year = new Date().getFullYear()

function Footer({ showMap = true }) {
  const { company } = useSite()
  const categories = useCategories()
  const t = useT()
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(company.mapQuery)}&output=embed`

  return (
    <footer id="contact" className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <img src="/brand/logo-light.png" alt="Multiprint" width="640" height="366" />
            </Link>
            <p className="footer__description">{company.description}</p>
            <ul className="footer__socials">
              {company.socials.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.name}
                    className={`footer__social footer__social--${social.name.toLowerCase()}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {socialIcons[social.name] ?? fallbackIcon}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <nav className="footer__col" aria-label={t('footer.nav')}>
            <h2 className="footer__heading">{t('footer.navigation')}</h2>
            <ul className="footer__links">
              {navigation.map((link) => (
                <li key={link.key}>
                  <Link to={link.to}>{t(link.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Products */}
          <div className="footer__col">
            <h2 className="footer__heading">{t('footer.products')}</h2>
            <ul className="footer__links">
              <li>
                <Link to="/products">{t('footer.allProducts')}</Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link to={`/products?category=${category.id}`}>{category.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h2 className="footer__heading">{t('footer.contact')}</h2>
            <ul className="footer__contact">
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                <address>
                  {company.address.split('\n').map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </address>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                </svg>
                <a href={`tel:${company.phone.replace(/\s/g, '')}`}>{company.phone}</a>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <span>{company.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Map */}
        {showMap && (
          <div className="footer__map">
            <iframe
              title={t('footer.map', { name: company.name })}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        )}

        {/* Bottom bar */}
        <div className="footer__bottom">
          <p>
            {t('footer.rights', { year, name: company.name })}
          </p>
          <ul className="footer__legal">
            {/* TODO: link to the real legal pages once they exist */}
            <li>
              <a href="#">{t('footer.privacy')}</a>
            </li>
            <li>
              <a href="#">{t('footer.terms')}</a>
            </li>
            <li>
              <button
                type="button"
                className="footer__top"
                onClick={() => window.scrollTo({ top: 0 })}
              >
                {t('footer.backToTop')}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 19V5M6 11l6-6 6 6" />
                </svg>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default Footer
