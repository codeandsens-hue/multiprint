import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { galleryOf, useCatalog, useSite } from '../content/context.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { useLanguage, useT } from '../i18n/context.js'
import { optional } from '../lib/mailto.js'
import { useRequestForm } from '../lib/useRequestForm.js'
import './ProductDetailPage.css'

const unitKeys = ['order.unit.rolls', 'order.unit.units', 'order.unit.thousand']

function Gallery({ images }) {
  const [current, setCurrent] = useState(0)
  const { t, dir } = useLanguage()
  const count = images.length
  const forwardKey = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight' // mirrored in Arabic

  // Left/right arrow keys move through the images when the gallery has focus
  const onKeyDown = (e) => {
    if (e.key === forwardKey) setCurrent((i) => (i + 1) % count)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setCurrent((i) => (i - 1 + count) % count)
  }

  return (
    <div className="gallery" onKeyDown={onKeyDown}>
      <div className="gallery__main">
        <img key={current} src={images[current].src} alt={images[current].alt} />
        {count > 1 && (
          <span className="gallery__counter">
            {current + 1} / {count}
          </span>
        )}
      </div>

      {count > 1 && (
        <div className="gallery__thumbs" role="group" aria-label={t('product.images')}>
          {images.map((image, i) => (
            <button
              key={image.src + i}
              type="button"
              className="gallery__thumb"
              aria-label={t('product.showImage', { n: i + 1, alt: image.alt })}
              aria-current={i === current ? 'true' : undefined}
              onClick={() => setCurrent(i)}
            >
              <img src={image.src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function OrderForm({ product }) {
  const { company } = useSite()
  const t = useT()
  const { onSubmit, status, message, sending } = useRequestForm((data) => ({
    type: 'order',
    subject: `Order request – ${product.title}`,
    lines: [
      `Product: ${product.title}`,
      `Quantity: ${data.quantity} ${data.unit}`,
      '',
      `Name: ${data.name}`,
      optional('Company', data.company),
      `Email: ${data.email}`,
      optional('Phone', data.phone),
      '',
      data.message || null,
    ],
  }))

  return (
    <section id="order" className="order">
      <div className="container order__grid">
        <div className="order__intro">
          <h2 className="order__title">{t('order.title')}</h2>
          <p>
            {t('order.intro')} <strong>{product.title}</strong>.
          </p>
          <ul className="order__contact">
            <li>
              <a href={`tel:${company.phone.replace(/\s/g, '')}`}>{company.phone}</a>
            </li>
            <li>
              <a href={`mailto:${company.email}`}>{company.email}</a>
            </li>
          </ul>
        </div>

        <form className="order__form" onSubmit={onSubmit}>
          <div className="field field--full">
            <label htmlFor="order-product">{t('order.product')}</label>
            <input id="order-product" name="product" value={product.title} readOnly />
          </div>

          <div className="field">
            <label htmlFor="order-quantity">{t('order.quantity')}</label>
            <input id="order-quantity" name="quantity" type="number" min="1" required placeholder={t('order.quantityPlaceholder')} />
          </div>
          <div className="field">
            <label htmlFor="order-unit">{t('order.unit')}</label>
            <select id="order-unit" name="unit">
              {unitKeys.map((key) => (
                <option key={key}>{t(key)}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="order-name">{t('form.name')}</label>
            <input id="order-name" name="name" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="order-company">{t('form.company')}</label>
            <input id="order-company" name="company" autoComplete="organization" />
          </div>

          <div className="field">
            <label htmlFor="order-email">{t('form.email')}</label>
            <input id="order-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="order-phone">{t('form.phone')}</label>
            <input id="order-phone" name="phone" type="tel" autoComplete="tel" />
          </div>

          <div className="field field--full">
            <label htmlFor="order-message">{t('order.details')}</label>
            <textarea
              id="order-message"
              name="message"
              rows="4"
              placeholder={t('order.detailsPlaceholder')}
            />
          </div>

          <div className="order__submit">
            <button type="submit" className="btn btn--primary" disabled={sending}>
              {sending ? t('form.sending') : t('order.submit')}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <p className={`form-status form-status--${status}`} role="status">
              {message}
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}

function ProductDetailPage() {
  const { id } = useParams()
  const { products, findProduct, categoryLabel } = useCatalog()
  const product = findProduct(id)
  const t = useT()
  usePageTitle(`${product ? product.title : t('title.notFound')} – Multiprint`)

  if (!product) {
    return (
      <section className="product-missing">
        <div className="container">
          <h1>{t('product.notFound')}</h1>
          <p>{t('product.notFoundText')}</p>
          <Link to="/products" className="btn btn--primary">
            {t('product.backToProducts')}
          </Link>
        </div>
      </section>
    )
  }

  const category = categoryLabel(product.category)
  const description = product.description ?? [product.text]
  const related = products.filter((p) => p.category === product.category && p.id !== product.id)

  return (
    <>
      <section className="product">
        {/* key resets the gallery to the first image when switching products */}
        <div key={product.id} className="container product__grid">
          <Gallery images={galleryOf(product)} />

          <div className="product__info">
            <nav className="breadcrumb" aria-label={t('breadcrumb')}>
              <ol>
                <li>
                  <Link to="/">{t('breadcrumb.home')}</Link>
                </li>
                <li>
                  <Link to="/products">{t('nav.products')}</Link>
                </li>
                <li aria-current="page">{product.title}</li>
              </ol>
            </nav>

            <Link to={`/products?category=${product.category}`} className="product__category">
              {category} · {product.eyebrow}
            </Link>
            <h1 className="product__title">{product.title}</h1>

            <div className="product__description">
              {description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <ul className="product__features">
              {product.features.map((feature) => (
                <li key={feature}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m6 12.5 4 4 8-9" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {product.specs && (
              <dl className="product__specs">
                {product.specs.map((spec) => (
                  <div key={spec.label}>
                    <dt>{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="product__actions">
              <a href="#order" className="btn btn--primary">
                {t('product.placeOrder')}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <Link to={`/contact?product=${product.id}`} className="btn btn--outline">
                {t('product.askQuestion')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <OrderForm key={product.id} product={product} />

      {related.length > 0 && (
        <section className="related">
          <div className="container">
            <h2 className="related__title">{t('product.similar')}</h2>
            <ul className="related__grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}

export default ProductDetailPage
