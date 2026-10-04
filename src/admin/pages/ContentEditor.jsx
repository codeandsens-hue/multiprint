import { useState } from 'react'
import { useContent } from '../../content/context.js'
import { api } from '../api.js'
import { ImageField, ListField, SaveBar, TextField } from '../fields.jsx'
import { getPath, setPath, textDir } from '../paths.js'
import { LanguageTabs, TranslationHint } from '../translation.jsx'

// Describes every editable part of the site. `path` is where the value lives in the site document.
// Field types: text, textarea, image, number, list (with `fields` for each item).
// `translate: false` marks values shared by every language (phone, email, links…).
const sections = [
  {
    id: 'company',
    title: 'Company details',
    where: 'Footer, contact page and forms',
    fields: [
      { path: 'company.name', label: 'Company name' },
      { path: 'company.description', label: 'Short description (footer)', type: 'textarea' },
      { path: 'company.address', label: 'Address', type: 'textarea', hint: 'One line per row' },
      { path: 'company.phone', label: 'Phone', translate: false },
      { path: 'company.email', label: 'Email (orders and messages are also sent here as a fallback)', translate: false },
      { path: 'company.hours', label: 'Opening hours' },
      { path: 'company.mapQuery', label: 'Map location', hint: 'An address or “latitude,longitude” used for the Google map', translate: false },
      {
        path: 'company.socials',
        translate: false,
        label: 'Social networks',
        type: 'list',
        addLabel: 'Add network',
        create: { name: '', href: 'https://' },
        fields: [
          { key: 'name', label: 'Name', hint: 'Facebook, Instagram, LinkedIn and YouTube get their own icon' },
          { key: 'href', label: 'Link' },
        ],
      },
    ],
  },
  {
    id: 'hero',
    title: 'Home · Carousel',
    where: 'Top of the home page (slides are your featured products)',
    fields: [
      { path: 'hero.primaryLabel', label: 'Main button text' },
      { path: 'hero.secondaryLabel', label: 'Second button text' },
    ],
  },
  {
    id: 'certification',
    title: 'Home · Certifications',
    where: 'Home and About pages',
    fields: [
      { path: 'certification.title', label: 'Title', type: 'textarea', rows: 2 },
      {
        path: 'certification.items',
        label: 'Certificates',
        type: 'list',
        addLabel: 'Add certificate',
        create: { image: '', title: '', description: '' },
        fields: [
          { key: 'image', label: 'Logo', type: 'image' },
          { key: 'title', label: 'Name' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'about',
    title: 'Home · About',
    where: 'Home and About pages',
    fields: [
      { path: 'about.title', label: 'Title', type: 'textarea', rows: 2, hint: 'Press Enter for a line break' },
      { path: 'about.text', label: 'Text', type: 'textarea' },
      {
        path: 'about.stats',
        label: 'Statistics',
        type: 'list',
        addLabel: 'Add statistic',
        create: { value: 0, label: '' },
        fields: [
          { key: 'value', label: 'Number', type: 'number' },
          { key: 'label', label: 'Label' },
        ],
      },
      { path: 'about.image', label: 'Square image', type: 'image' },
    ],
  },
  {
    id: 'latestProducts',
    title: 'Home · Latest products',
    where: 'Scrolling product row on the home page',
    fields: [
      { path: 'latestProducts.title', label: 'Title' },
      { path: 'latestProducts.subtitle', label: 'Subtitle', type: 'textarea' },
    ],
  },
  {
    id: 'cta',
    title: 'Home · Call to action banner',
    where: 'Full-width banner on the home page',
    fields: [
      { path: 'cta.title', label: 'Title' },
      { path: 'cta.text', label: 'Text', type: 'textarea' },
      { path: 'cta.image', label: 'Background image', type: 'image', hint: 'Wide photo; a dark overlay is added automatically' },
    ],
  },
  {
    id: 'journey',
    title: 'Home · Our journey',
    where: 'Home and About pages',
    fields: [
      { path: 'journey.title', label: 'Title' },
      { path: 'journey.image', label: 'Square image', type: 'image' },
      {
        path: 'journey.points',
        label: 'Points',
        type: 'list',
        addLabel: 'Add point',
        create: { title: '', text: '' },
        fields: [
          { key: 'title', label: 'Title' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'process',
    title: 'About · How we work',
    where: 'About page',
    fields: [
      { path: 'process.title', label: 'Title' },
      { path: 'process.subtitle', label: 'Subtitle', type: 'textarea' },
      {
        path: 'process.steps',
        label: 'Steps',
        type: 'list',
        addLabel: 'Add step',
        create: { title: '', text: '' },
        fields: [
          { key: 'title', label: 'Title' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'pages',
    title: 'Page headers',
    where: 'Title and intro at the top of the Products, About and Contact pages',
    fields: [
      { path: 'pages.products.title', label: 'Products page · title' },
      { path: 'pages.products.subtitle', label: 'Products page · intro', type: 'textarea' },
      { path: 'pages.about.title', label: 'About page · title' },
      { path: 'pages.about.subtitle', label: 'About page · intro', type: 'textarea' },
      { path: 'pages.contact.title', label: 'Contact page · title' },
      { path: 'pages.contact.subtitle', label: 'Contact page · intro', type: 'textarea' },
    ],
  },
]

const isText = (field) => (!field.type || field.type === 'textarea') && field.translate !== false
const isTranslatable = (field) =>
  field.translate !== false && (isText(field) || (field.type === 'list' && field.fields.some(isText)))

// Translation mode: text fields bound to `i18n.<lang>.<path>`, with the English text as placeholder.
// Lists keep the English items (same order); only their texts are translated.
function TranslationField({ field, path, draft, lang, onChange, label = field.label }) {
  if (field.type === 'list') {
    const items = getPath(draft, path) ?? []
    return (
      <fieldset className="list-field">
        <legend className="field__label">{label}</legend>
        {items.map((item, i) => (
          <div key={i} className="list-field__item">
            <div className="list-field__body">
              {field.fields.filter(isText).map((sub) => (
                <TranslationField
                  key={sub.key}
                  field={sub}
                  path={`${path}.${i}.${sub.key}`}
                  label={`${sub.label} ${i + 1}`}
                  draft={draft}
                  lang={lang}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
        ))}
      </fieldset>
    )
  }
  return (
    <TextField
      label={label}
      value={getPath(draft, `i18n.${lang}.${path}`) ?? ''}
      onChange={(value) => onChange(`i18n.${lang}.${path}`, value)}
      placeholder={getPath(draft, path) ?? ''}
      multiline={field.type === 'textarea'}
      rows={field.rows ?? 3}
      dir={textDir(lang)}
      lang={lang}
    />
  )
}

function Field({ field, value, onChange }) {
  const common = { label: field.label, hint: field.hint }
  switch (field.type) {
    case 'textarea':
      return <TextField {...common} value={value} onChange={onChange} multiline rows={field.rows ?? 3} />
    case 'image':
      return <ImageField {...common} value={value} onChange={onChange} />
    case 'number':
      return <TextField {...common} type="number" value={value} onChange={(v) => onChange(v === '' ? '' : Number(v))} />
    case 'list':
      return (
        <ListField
          label={field.label}
          items={value ?? []}
          onChange={onChange}
          create={() => structuredClone(field.create)}
          addLabel={field.addLabel}
          renderItem={(item, update) =>
            field.fields.map((sub) => (
              <Field
                key={sub.key}
                field={sub}
                value={item[sub.key]}
                onChange={(v) => update({ ...item, [sub.key]: v })}
              />
            ))
          }
        />
      )
    default:
      return <TextField {...common} value={value} onChange={onChange} />
  }
}

function ContentEditor() {
  const { site, reload } = useContent()
  const [draft, setDraft] = useState(site)
  const [active, setActive] = useState(sections[0].id)
  const [lang, setLang] = useState('en')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const dirty = JSON.stringify(draft) !== JSON.stringify(site)
  const section = sections.find((s) => s.id === active)

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      await api('/admin/site', { method: 'PUT', body: draft })
      await reload()
      setMessage('Saved ✓ — the website is updated')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="admin-page__header">
        <div>
          <h1>Site content</h1>
          <p>Every text and image of the website. Changes go live as soon as you save.</p>
        </div>
        <LanguageTabs value={lang} onChange={setLang} />
      </header>

      <div className="content-editor">
        <nav className="content-editor__nav" aria-label="Sections">
          {sections.map((s) => (
            <button key={s.id} type="button" aria-current={s.id === active} onClick={() => setActive(s.id)}>
              {s.title}
            </button>
          ))}
        </nav>

        <section className="panel">
          <h2 className="panel__title">{section.title}</h2>
          <p className="panel__hint">Appears in: {section.where}</p>
          {lang === 'en' ? (
            section.fields.map((field) => (
              <Field
                key={field.path}
                field={field}
                value={getPath(draft, field.path)}
                onChange={(value) => {
                  setMessage('')
                  setDraft((d) => setPath(d, field.path, value))
                }}
              />
            ))
          ) : (
            <>
              <TranslationHint lang={lang} />
              {section.fields.filter(isTranslatable).map((field) => (
                <TranslationField
                  key={field.path}
                  field={field}
                  path={field.path}
                  draft={draft}
                  lang={lang}
                  onChange={(path, value) => {
                    setMessage('')
                    setDraft((d) => setPath(d, path, value))
                  }}
                />
              ))}
              {!section.fields.some(isTranslatable) && (
                <p className="panel__empty">Nothing to translate in this section.</p>
              )}
            </>
          )}
        </section>
      </div>

      <SaveBar dirty={dirty} saving={saving} message={message} onSave={save} onReset={() => setDraft(site)} />
    </>
  )
}

export default ContentEditor
