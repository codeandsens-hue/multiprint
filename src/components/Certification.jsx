import { useSite } from '../content/context.js'
import { useInView } from '../hooks/useInView.js'
import './Certification.css'

function Certification() {
  const { title, items } = useSite().certification
  const [ref, visible] = useInView()

  return (
    <section
      id="certification"
      ref={ref}
      className={`certification${visible ? ' is-visible' : ''}`}
    >
      <div className="container">
        <h2 className="certification__title">{title}</h2>

        <ul className="certification__grid">
          {items.map((cert, i) => (
            <li key={cert.title + i} className="certification__card" style={{ '--i': i }}>
              <img className="certification__image" src={cert.image} alt="" />
              <h3 className="certification__card-title">{cert.title}</h3>
              <p className="certification__card-text">{cert.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Certification
