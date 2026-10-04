import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useCatalog, useSite } from '../content/context.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { useT } from '../i18n/context.js'
import { optional } from '../lib/mailto.js'
import { useRequestForm } from '../lib/useRequestForm.js'
import './ContactPage.css'

const subjectKeys = [
  'contact.subject.general',
  'contact.subject.quote',
  'contact.subject.order',
  'contact.subject.partnership',
  'contact.subject.other',
]

const channelsFor = (company) => [
  {
    label: 'contact.callUs',
    value: company.phone,
    ltr: true, // phone numbers always read left to right
    href: `tel:${company.phone.replace(/\s/g, '')}`,
    icon: (
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    ),
  },
  {
    label: 'contact.emailUs',
    value: company.email,
    ltr: true,
    href: `mailto:${company.email}`,
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  },
  {
    label: 'contact.visitUs',
    value: company.address.split('\n').join(', '),
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.mapQuery)}`,
    external: true,
    icon: (
      <>
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </>
    ),
  },
  {
    label: 'contact.hours',
    value: company.hours,
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
]

function ContactForm() {
  // ?product=<id> (from a product page) pre-selects the product and the "Quote request" subject
  const [params] = useSearchParams()
  const { products, findProduct } = useCatalog()
  const preselected = findProduct(params.get('product') ?? '')
  const t = useT()

  const { onSubmit, status, message, sending } = useRequestForm((data) => ({
    type: 'contact',
    subject: `${data.subject}${data.product ? ` – ${data.product}` : ''}`,
    lines: [
      `Name: ${data.name}`,
      optional('Company', data.company),
      `Email: ${data.email}`,
      optional('Phone', data.phone),
      optional('Product', data.product),
      '',
      data.message,
    ],
  }))

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <h2 className="contact-form__title">{t('contact.formTitle')}</h2>
      <p className="contact-form__intro">{t('contact.required')}</p>

      <div className="contact-form__fields">
        <div className="field">
          <label htmlFor="contact-name">{t('form.name')}</label>
          <input id="contact-name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="contact-company">{t('form.company')}</label>
          <input id="contact-company" name="company" autoComplete="organization" />
        </div>

        <div className="field">
          <label htmlFor="contact-email">{t('form.email')}</label>
          <input id="contact-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="contact-phone">{t('form.phone')}</label>
          <input id="contact-phone" name="phone" type="tel" autoComplete="tel" />
        </div>

        <div className="field">
          <label htmlFor="contact-subject">{t('contact.subject')}</label>
          <select
            id="contact-subject"
            name="subject"
            defaultValue={t(preselected ? 'contact.subject.quote' : subjectKeys[0])}
          >
            {subjectKeys.map((key) => (
              <option key={key}>{t(key)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="contact-product">{t('contact.product')}</label>
          <select id="contact-product" name="product" defaultValue={preselected?.title ?? ''}>
            <option value="">{t('contact.none')}</option>
            {products.map((p) => (
              <option key={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div className="field field--full">
          <label htmlFor="contact-message">{t('contact.message')}</label>
          <textarea
            id="contact-message"
            name="message"
            rows="5"
            required
            placeholder={t('contact.messagePlaceholder')}
          />
        </div>
      </div>

      <div className="contact-form__submit">
        <button type="submit" className="btn btn--primary" disabled={sending}>
          {sending ? t('form.sending') : t('contact.send')}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
        <p className={`form-status form-status--${status}`} role="status">
          {message}
        </p>
      </div>
    </form>
  )
}

function ContactPage() {
  const { company, pages } = useSite()
  const t = useT()
  usePageTitle(`${t('title.contact')} – Multiprint`)
  const channels = channelsFor(company)
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(company.mapQuery)}&output=embed`

  return (
    <>
      <PageHeader crumbs={[{ label: t('nav.contact') }]} title={pages.contact.title}>
        {pages.contact.subtitle}
      </PageHeader>

      <section className="contact">
        <div className="container contact__grid">
          <aside className="contact__info">
            <ul className="contact__channels">
              {channels.map((channel) => {
                const content = (
                  <>
                    <span className="contact__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">{channel.icon}</svg>
                    </span>
                    <span>
                      <span className="contact__label">{t(channel.label)}</span>
                      <span className="contact__value" dir={channel.ltr ? 'ltr' : undefined}>
                        {channel.value}
                      </span>
                    </span>
                  </>
                )
                return (
                  <li key={channel.label}>
                    {channel.href ? (
                      <a
                        href={channel.href}
                        className="contact__channel"
                        {...(channel.external && { target: '_blank', rel: 'noreferrer' })}
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="contact__channel">{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="contact__socials">
              <span className="contact__label">{t('contact.followUs')}</span>
              <ul>
                {company.socials.map((social, i) => (
                  <li key={social.name + i}>
                    <a href={social.href} target="_blank" rel="noreferrer">
                      {social.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <ContactForm />
        </div>
      </section>

      <section className="contact-map" aria-label={t('contact.map')}>
        <div className="container">
          <iframe
            title={t('footer.map', { name: company.name })}
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>
    </>
  )
}

export default ContactPage
