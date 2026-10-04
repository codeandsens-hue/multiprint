import { useSite } from '../content/context.js'
import { useInView } from '../hooks/useInView.js'
import './Journey.css'

function Journey() {
  const { title, image, points } = useSite().journey
  const [ref, visible] = useInView(0.2)

  return (
    <section id="journey" ref={ref} className={`journey${visible ? ' is-visible' : ''}`}>
      <div className="container journey__grid">
        <div className="journey__media">
          <img src={image} alt="" />
        </div>

        <div className="journey__content">
          <h2 className="journey__title">{title}</h2>

          <ol className="journey__points">
            {points.map((point, i) => (
              <li key={point.title + i} className="journey__point">
                <h3 className="journey__point-title">{point.title}</h3>
                <p className="journey__point-text">{point.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default Journey
