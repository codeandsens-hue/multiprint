import About from '../components/About.jsx'
import Certification from '../components/Certification.jsx'
import Journey from '../components/Journey.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useSite } from '../content/context.js'
import { useInView } from '../hooks/useInView.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { useT } from '../i18n/context.js'
import './AboutPage.css'

// Icons for the "How we work" steps, in order (texts are edited in the admin)
const stepIcons = [
  <path key="brief" d="M4 5h16v11H8l-4 4V5Z M8 9h8M8 12h5" />,
  <path key="design" d="M4 20h4L19 9l-4-4L4 16v4Z M13 7l4 4" />,
  <path key="print" d="M7 9V4h10v5 M5 9h14a2 2 0 0 1 2 2v5h-4v4H7v-4H3v-5a2 2 0 0 1 2-2Z M9 16h6" />,
  <path key="delivery" d="M3 7h11v9H3V7Z M14 10h4l3 3v3h-7 M7 19a2 2 0 1 0 0-.1 M17 19a2 2 0 1 0 0-.1" />,
]

function Process() {
  const { title, subtitle, steps } = useSite().process
  const [ref, visible] = useInView(0.2)

  return (
    <section ref={ref} className={`process${visible ? ' is-visible' : ''}`}>
      <div className="container">
        <h2 className="process__title">{title}</h2>
        <p className="process__subtitle">{subtitle}</p>

        <ol className="process__steps">
          {steps.map((step, i) => (
            <li key={step.title + i} className="process__step" style={{ '--i': i }}>
              <span className="process__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">{stepIcons[i % stepIcons.length]}</svg>
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function AboutPage() {
  const t = useT()
  usePageTitle(`${t('title.about')} – Multiprint`)
  const { pages } = useSite()

  return (
    <>
      <PageHeader crumbs={[{ label: t('nav.about') }]} title={pages.about.title}>
        {pages.about.subtitle}
      </PageHeader>
      <About />
      <Process />
      <Journey />
      <Certification />
    </>
  )
}

export default AboutPage
