import { Link } from 'react-router-dom'
import { useSite } from '../content/context.js'
import { useT } from '../i18n/context.js'
import { useInView } from '../hooks/useInView.js'
import './CallToAction.css'

function CallToAction() {
  const { title, text, image } = useSite().cta
  const t = useT()
  const [ref, visible] = useInView(0.25)

  return (
    <section
      id="get-started"
      ref={ref}
      className={`cta${visible ? ' is-visible' : ''}`}
      style={{ '--cta-image': `url("${image}")` }}
    >
      <div className="container cta__content">
        <h2 className="cta__title">{title}</h2>
        <p className="cta__text">{text}</p>
        <div className="cta__actions">
          <Link to="/contact" className="cta__btn cta__btn--primary">
            {t('cta.contact')}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link to="/products" className="cta__btn cta__btn--outline">
            {t('cta.seeProducts')}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CallToAction
