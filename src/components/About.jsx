import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useSite } from '../content/context.js'
import { useT } from '../i18n/context.js'
import { useInView } from '../hooks/useInView.js'
import './About.css'

// Counts from 0 up to `value` once `start` is true
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function CountUp({ value, start }) {
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!start || reducedMotion) return
    const duration = 1400
    const t0 = performance.now()
    let frame
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [start, value])

  return reducedMotion ? value : n
}

function About() {
  const { title, text, stats, image } = useSite().about
  const t = useT()
  const [ref, visible] = useInView(0.2)

  return (
    <section id="about" ref={ref} className={`about${visible ? ' is-visible' : ''}`}>
      <div className="container about__grid">
        <div className="about__content">
          <h2 className="about__title">
            {/* Line breaks typed in the admin become line breaks here */}
            {title.split('\n').map((line, i) => (
              <span key={i} className="about__title-line">
                {line}
              </span>
            ))}
          </h2>
          <p className="about__text">{text}</p>

          <dl className="about__stats">
            {stats.map((stat, i) => (
              <div key={stat.label + i} className="about__stat">
                <dt>{stat.label}</dt>
                <dd>
                  <CountUp value={Number(stat.value) || 0} start={visible} />
                </dd>
              </div>
            ))}
          </dl>

          <div className="about__actions">
            <Link to="/contact" className="about__btn about__btn--primary">
              {t('cta.contact')}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link to="/products" className="about__btn about__btn--outline">
              {t('cta.seeProducts')}
            </Link>
          </div>
        </div>

        <div className="about__media">
          <img src={image} alt="" />
        </div>
      </div>
    </section>
  )
}

export default About
