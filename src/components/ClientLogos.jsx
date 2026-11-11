import { useSite } from '../content/context.js'
import './ClientLogos.css'

// Repeat the logos until one half of the track holds at least this many, so it is always wider than the screen
const MIN_PER_HALF = 12

// Infinite strip of client logos shown above the footer; switched on/off in Dashboard → Contenu du site
function ClientLogos() {
  const { enabled, title, logos = [] } = useSite().clients ?? {}
  const shown = logos.filter((logo) => logo.image)
  if (!enabled || !shown.length) return null

  // The track holds two identical halves and slides by exactly one half (-50%), so the loop is seamless
  const half = Array.from({ length: Math.ceil(MIN_PER_HALF / shown.length) }, () => shown).flat()

  return (
    <section className="clients" aria-label={title || undefined}>
      {title && <h2 className="clients__title">{title}</h2>}
      <div className="clients__marquee" style={{ '--n': half.length }}>
        <ul className="clients__track">
          {[...half, ...half].map((logo, i) => (
            // Only the first copy of each logo is announced to screen readers
            <li key={i} className="clients__item" aria-hidden={i >= shown.length || undefined}>
              <img src={logo.image} alt={i < shown.length ? logo.name || '' : ''} loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default ClientLogos
