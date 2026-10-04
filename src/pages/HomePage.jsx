import Hero from '../components/Hero.jsx'
import Certification from '../components/Certification.jsx'
import About from '../components/About.jsx'
import Products from '../components/Products.jsx'
import CallToAction from '../components/CallToAction.jsx'
import Journey from '../components/Journey.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

function HomePage() {
  usePageTitle('Multiprint')

  return (
    <>
      <Hero />
      <Certification />
      <About />
      <Products />
      <CallToAction />
      <Journey />
    </>
  )
}

export default HomePage
