import { useState } from 'react'
import { useContent } from '../../content/context.js'
import { api } from '../api.js'
import { ImageField, ListField, SaveBar, TextField, ToggleField } from '../fields.jsx'
import { getPath, setPath, textDir } from '../paths.js'
import { LanguageTabs, TranslationHint } from '../translation.jsx'

// Describes every editable part of the site. `path` is where the value lives in the site document.
// Field types: text, textarea, image, number, toggle, list (with `fields` for each item).
// `translate: false` marks values shared by every language (phone, email, links…).
const sections = [
  {
    id: 'company',
    title: 'Informations de l’entreprise',
    where: 'Pied de page, page contact et formulaires',
    fields: [
      { path: 'company.name', label: 'Nom de l’entreprise' },
      { path: 'company.description', label: 'Description courte (pied de page)', type: 'textarea' },
      { path: 'company.address', label: 'Adresse', type: 'textarea', hint: 'Une ligne par rangée' },
      { path: 'company.phone', label: 'Téléphone', translate: false },
      { path: 'company.email', label: 'E-mail (les commandes et messages y sont aussi envoyés en secours)', translate: false },
      { path: 'company.hours', label: 'Horaires d’ouverture' },
      { path: 'company.mapQuery', label: 'Emplacement sur la carte', hint: 'Une adresse ou « latitude,longitude » pour la carte Google', translate: false },
      {
        path: 'company.socials',
        translate: false,
        label: 'Réseaux sociaux',
        type: 'list',
        addLabel: 'Ajouter un réseau',
        create: { name: '', href: 'https://' },
        fields: [
          { key: 'name', label: 'Nom', hint: 'Facebook, Instagram, LinkedIn et YouTube ont leur propre icône' },
          { key: 'href', label: 'Lien' },
        ],
      },
    ],
  },
  {
    id: 'hero',
    title: 'Accueil · Carrousel',
    where: 'Haut de la page d’accueil (les diapositives sont vos produits en vedette)',
    fields: [
      { path: 'hero.primaryLabel', label: 'Texte du bouton principal' },
      { path: 'hero.secondaryLabel', label: 'Texte du second bouton' },
    ],
  },
  {
    id: 'certification',
    title: 'Accueil · Certifications',
    where: 'Pages Accueil et À propos',
    fields: [
      { path: 'certification.title', label: 'Titre', type: 'textarea', rows: 2 },
      {
        path: 'certification.items',
        label: 'Certificats',
        type: 'list',
        addLabel: 'Ajouter un certificat',
        create: { image: '', title: '', description: '' },
        fields: [
          { key: 'image', label: 'Logo', type: 'image' },
          { key: 'title', label: 'Nom' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'about',
    title: 'Accueil · À propos',
    where: 'Pages Accueil et À propos',
    fields: [
      { path: 'about.title', label: 'Titre', type: 'textarea', rows: 2, hint: 'Appuyez sur Entrée pour un retour à la ligne' },
      { path: 'about.text', label: 'Texte', type: 'textarea' },
      {
        path: 'about.stats',
        label: 'Statistiques',
        type: 'list',
        addLabel: 'Ajouter une statistique',
        create: { value: 0, label: '' },
        fields: [
          { key: 'value', label: 'Nombre', type: 'number' },
          { key: 'label', label: 'Libellé' },
        ],
      },
      { path: 'about.image', label: 'Image carrée', type: 'image' },
    ],
  },
  {
    id: 'latestProducts',
    title: 'Accueil · Derniers produits',
    where: 'Bandeau défilant de produits sur la page d’accueil',
    fields: [
      { path: 'latestProducts.title', label: 'Titre' },
      { path: 'latestProducts.subtitle', label: 'Sous-titre', type: 'textarea' },
    ],
  },
  {
    id: 'cta',
    title: 'Accueil · Bannière d’appel à l’action',
    where: 'Bannière pleine largeur sur la page d’accueil',
    fields: [
      { path: 'cta.title', label: 'Titre' },
      { path: 'cta.text', label: 'Texte', type: 'textarea' },
      { path: 'cta.image', label: 'Image de fond', type: 'image', hint: 'Photo large ; un voile sombre est ajouté automatiquement' },
    ],
  },
  {
    id: 'journey',
    title: 'Accueil · Notre parcours',
    where: 'Pages Accueil et À propos',
    fields: [
      { path: 'journey.title', label: 'Titre' },
      { path: 'journey.image', label: 'Image carrée', type: 'image' },
      {
        path: 'journey.points',
        label: 'Points',
        type: 'list',
        addLabel: 'Ajouter un point',
        create: { title: '', text: '' },
        fields: [
          { key: 'title', label: 'Titre' },
          { key: 'text', label: 'Texte', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'clients',
    title: 'Logos clients',
    where: 'Bandeau défilant au-dessus du pied de page, sur toutes les pages',
    fields: [
      {
        path: 'clients.enabled',
        label: 'Afficher les logos clients sur le site',
        type: 'toggle',
        hint: 'Le bandeau n’apparaît que s’il est activé et contient au moins un logo',
      },
      { path: 'clients.title', label: 'Titre (facultatif)' },
      {
        path: 'clients.logos',
        translate: false,
        label: 'Logos',
        type: 'list',
        addLabel: 'Ajouter un logo',
        create: { image: '', name: '' },
        fields: [
          { key: 'image', label: 'Logo', type: 'image', hint: 'PNG ou WebP à fond transparent, de préférence' },
          { key: 'name', label: 'Nom du client', hint: 'Lu par les lecteurs d’écran' },
        ],
      },
    ],
  },
  {
    id: 'process',
    title: 'À propos · Notre méthode',
    where: 'Page À propos',
    fields: [
      { path: 'process.title', label: 'Titre' },
      { path: 'process.subtitle', label: 'Sous-titre', type: 'textarea' },
      {
        path: 'process.steps',
        label: 'Étapes',
        type: 'list',
        addLabel: 'Ajouter une étape',
        create: { title: '', text: '' },
        fields: [
          { key: 'title', label: 'Titre' },
          { key: 'text', label: 'Texte', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'pages',
    title: 'En-têtes de page',
    where: 'Titre et introduction en haut des pages Produits, À propos et Contact',
    fields: [
      { path: 'pages.products.title', label: 'Page Produits · titre' },
      { path: 'pages.products.subtitle', label: 'Page Produits · introduction', type: 'textarea' },
      { path: 'pages.about.title', label: 'Page À propos · titre' },
      { path: 'pages.about.subtitle', label: 'Page À propos · introduction', type: 'textarea' },
      { path: 'pages.contact.title', label: 'Page Contact · titre' },
      { path: 'pages.contact.subtitle', label: 'Page Contact · introduction', type: 'textarea' },
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
    case 'toggle':
      return <ToggleField {...common} value={value} onChange={onChange} />
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
      setMessage('Enregistré ✓ — le site est à jour')
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
          <h1>Contenu du site</h1>
          <p>Tous les textes et images du site. Les modifications sont en ligne dès l’enregistrement.</p>
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
          <p className="panel__hint">Apparaît dans : {section.where}</p>
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
                <p className="panel__empty">Rien à traduire dans cette section.</p>
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
