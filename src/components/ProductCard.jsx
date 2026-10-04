import { Link } from 'react-router-dom'
import './ProductCard.css'

// Product tile used by the home marquee and the products page grid; links to the product page
function ProductCard({ product, hidden = false, className = '', style }) {
  return (
    <li
      className={`product-card ${className}`.trim()}
      style={style}
      aria-hidden={hidden || undefined}
    >
      <Link
        to={`/products/${product.id}`}
        className="product-card__link"
        tabIndex={hidden ? -1 : undefined}
      >
        <div className="product-card__media">
          <img src={product.image.src} alt={hidden ? '' : product.image.alt} loading="lazy" />
        </div>
        <div className="product-card__body">
          <span className="product-card__category">{product.eyebrow}</span>
          <h3 className="product-card__title">{product.title}</h3>
        </div>
      </Link>
    </li>
  )
}

export default ProductCard
