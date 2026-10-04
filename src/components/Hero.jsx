import { Link } from 'react-router-dom'
import { useRef, useState } from 'react'
import { useProducts, useSite } from '../content/context.js'
import { useLanguage } from '../i18n/context.js'
import './Hero.css'

const SLIDE_DURATION = 6000 // ms each product stays on screen

// Colour theme and circle layout per slide position: a warm palette built around the brand yellow.
// Slides beyond the fourth reuse these in order.
const looks = [
  {
    theme: { bg: '#fabf02', ring: '#ed7a00', soft: '#fff6d9', btnBg: '#0f172a', btnFg: '#ffffff' },
    rings: [{ x: 0, y: 0, s: 1 }, { x: 0, y: 0, s: 1 }],
  },
  {
    theme: { bg: '#f7a51c', ring: '#e07800', soft: '#fff1da', btnBg: '#0f172a', btnFg: '#ffffff' },
    rings: [{ x: -40, y: 470, s: 0.85 }, { x: 70, y: -560, s: 0.9 }],
  },
  {
    theme: { bg: '#f08a24', ring: '#d0600c', soft: '#ffead8', btnBg: '#0f172a', btnFg: '#ffffff' },
    rings: [{ x: -690, y: -40, s: 0.8 }, { x: 720, y: 30, s: 1.1 }],
  },
  {
    theme: { bg: '#2b2118', ring: '#3d3024', soft: '#f8f3ea', btnBg: '#fabf02', btnFg: '#0f172a' },
    rings: [{ x: -80, y: 250, s: 1.2 }, { x: 90, y: 50, s: 0.6 }],
  },
]

// Original ring geometry from the design (panel = 853 × 705)
const ringBase = [
  { cx: 760, cy: 117, r: 253, w: 196 },
  { cx: 69, cy: 619, r: 204, w: 160 },
]

function Hero() {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const touchX = useRef(null)
  const { t, dir } = useLanguage()
  const { hero } = useSite()
  const products = useProducts()

  // Featured products appear in the carousel (falls back to the first four if none is featured)
  const featured = products.filter((p) => p.featured)
  const slides = (featured.length ? featured : products.slice(0, 4)).map((product, i) => ({
    ...product,
    ...looks[i % looks.length],
  }))
  const links = {
    primary: { label: hero.primaryLabel, to: '/products' },
    secondary: { label: hero.secondaryLabel, to: '/contact' },
  }

  const paused = hovered || focused || userPaused
  const count = slides.length
  if (!count) return null // no products yet

  const current = index % count // the list can shrink after an admin edit
  const slide = slides[current]

  const goTo = (i) => setIndex((i + count) % count)
  const next = () => goTo(current + 1)
  const prev = () => goTo(current - 1)

  const themeVars = {
    '--slide-bg': slide.theme.bg,
    '--slide-ring': slide.theme.ring,
    '--slide-soft': slide.theme.soft,
    '--slide-btn-bg': slide.theme.btnBg,
    '--slide-btn-fg': slide.theme.btnFg,
    '--slide-duration': `${SLIDE_DURATION}ms`,
  }

  return (
    <section id="home" className="hero" aria-roledescription="carousel" aria-label={t('hero.carousel')}>
      <div className="container">
        <div
          className={`hero__card${paused ? ' is-paused' : ''}`}
          style={themeVars}
          onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
          }}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            // Swiping towards the reading direction's start shows the next product (mirrored in Arabic)
            if (Math.abs(dx) > 50) ((dir === 'rtl' ? dx > 0 : dx < 0) ? next : prev)()
            touchX.current = null
          }}
        >
          <div className="hero__content">
            {/* Decorative rings, sized from the design (panel = 853 × 705) */}
            <svg
              className="hero__shapes"
              viewBox="0 0 853 705"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              {/* Each slide moves/scales the rings; CSS transitions animate the change */}
              {ringBase.map((ring, i) => {
                const { x, y, s } = slide.rings[i]
                return (
                  <circle
                    key={i}
                    className="hero__ring"
                    cx={ring.cx}
                    cy={ring.cy}
                    r={ring.r}
                    strokeWidth={ring.w}
                    style={{ transform: `translate(${x}px, ${y}px) scale(${s})` }}
                  />
                )
              })}
            </svg>

            {/* key={current} remounts the slide so its entrance animation replays */}
            <div
              key={current}
              className="hero__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={t('hero.slide', { n: current + 1, count })}
            >
              <h1 className="hero__title">{slide.title}</h1>
              <p className="hero__text">{slide.text}</p>

              <ul className="hero__features">
                {slide.features.map((feature) => (
                  <li key={feature}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m6 12.5 4 4 8-9" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="hero__actions">
                <Link to={links.primary.to} className="hero__btn hero__btn--primary">
                  {links.primary.label}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <Link to={links.secondary.to} className="hero__btn hero__btn--link">
                  {links.secondary.label}
                </Link>
              </div>
            </div>
          </div>

          <div className="hero__media">
            <img key={current} src={slide.image.src} alt={slide.image.alt} />

            <div className="hero__controls">
              <button type="button" className="hero__arrow" aria-label={t('hero.prev')} onClick={prev}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 12H5M11 6l-6 6 6 6" />
                </svg>
              </button>

              <div className="hero__dots">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`hero__dot${i === current ? ' is-active' : ''}`}
                    aria-label={t('hero.show', { title: s.title })}
                    aria-current={i === current ? 'true' : undefined}
                    onClick={() => goTo(i)}
                  >
                    {/* The fill's CSS animation is the timer: when it ends, advance */}
                    {i === current && <span className="hero__dot-fill" onAnimationEnd={next} />}
                  </button>
                ))}
              </div>

              <button type="button" className="hero__arrow" aria-label={t('hero.next')} onClick={next}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>

              <button
                type="button"
                className="hero__arrow hero__pause"
                aria-label={t(userPaused ? 'hero.play' : 'hero.pause')}
                aria-pressed={userPaused}
                onClick={() => setUserPaused((p) => !p)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {userPaused ? <path className="is-play" d="M8 5.5v13l10-6.5-10-6.5Z" /> : <path d="M9 6v12M15 6v12" />}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
