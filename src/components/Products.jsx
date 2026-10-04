import { Link } from 'react-router-dom'
import { useProducts, useSite } from '../content/context.js'
import { useT } from '../i18n/context.js'
import { useInView } from '../hooks/useInView.js'
import ProductCard from './ProductCard.jsx'
import './Products.css'

// Enough repeats that the row is always wider than the screen, even with few products
const COPIES = 4

function Products() {
  const [ref, visible] = useInView(0.15)
  const { title, subtitle } = useSite().latestProducts
  const t = useT()
  const products = useProducts()
  // The home page shows the featured products (or all of them if none is featured)
  const featured = products.filter((p) => p.featured)
  const marquee = featured.length ? featured : products

  return (
    <section id="latest-products" ref={ref} className={`products${visible ? ' is-visible' : ''}`}>
      <div className="container products__header">
        <h2 className="products__title">{title}</h2>
        <p className="products__subtitle">{subtitle}</p>
      </div>

      {/* Infinite marquee: the list is repeated and the track slides by exactly one copy,
          so the loop is seamless. Repeats are hidden from screen readers. */}
      <div className="products__marquee" style={{ '--count': marquee.length }}>
        <ul className="products__track">
          {Array.from({ length: COPIES }, (_, copy) =>
            marquee.map((p) => (
              <ProductCard key={`${copy}-${p.id}`} product={p} hidden={copy > 0} />
            )),
          )}
        </ul>
      </div>

      <div className="container products__footer">
        <Link to="/products" className="products__all">
          {t('products.viewAll')}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  )
}

export default Products
