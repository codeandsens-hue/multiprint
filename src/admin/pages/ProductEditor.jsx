import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCatalog, useContent } from '../../content/context.js'
import { api } from '../api.js'
import { ImageField, ListField, SaveBar, StringList, TextField } from '../fields.jsx'
import { getPath, setPath, textDir } from '../paths.js'
import { LanguageTabs, TranslationHint } from '../translation.jsx'

const emptyProduct = (category) => ({
  title: '',
  eyebrow: '',
  category,
  featured: false,
  text: '',
  description: [''],
  features: [''],
  specs: [],
  image: { src: '', alt: '' },
  gallery: [],
})

// Drop empty rows before saving
const clean = (p) => ({
  ...p,
  title: p.title.trim(),
  description: p.description.map((s) => s.trim()).filter(Boolean),
  features: p.features.map((s) => s.trim()).filter(Boolean),
  specs: p.specs.filter((s) => s.label.trim() && s.value.trim()),
  gallery: p.gallery.filter((g) => g.src),
})

// Translation of a product's texts: stored in product.i18n[lang], English shown as placeholder.
// Lists (paragraphs, features, details, gallery) follow the English items in the same order.
function ProductTranslation({ product, lang, onChange }) {
  const base = `i18n.${lang}`
  const field = (label, path, multiline = false) => (
    <TextField
      key={path}
      label={label}
      value={getPath(product, `${base}.${path}`) ?? ''}
      onChange={(value) => onChange(`${base}.${path}`, value)}
      placeholder={getPath(product, path) ?? ''}
      multiline={multiline}
      dir={textDir(lang)}
      lang={lang}
    />
  )

  return (
    <div className="editor">
      <section className="panel">
        <TranslationHint lang={lang} />
        <h2 className="panel__title">Général</h2>
        {field('Nom du produit', 'title')}
        {field('Étiquette de catégorie', 'eyebrow')}
        {field('Résumé court', 'text', true)}
        {field('Description de l’image principale', 'image.alt')}
      </section>

      <section className="panel">
        <h2 className="panel__title">Page produit</h2>
        {product.description.map((_, i) => field(`Paragraphe de description ${i + 1}`, `description.${i}`, true))}
        {product.features.map((_, i) => field(`Caractéristique ${i + 1}`, `features.${i}`))}
        {product.specs.map((_, i) => (
          <div key={i} className="form-grid">
            {field(`Détail ${i + 1} · libellé`, `specs.${i}.label`)}
            {field(`Détail ${i + 1} · valeur`, `specs.${i}.value`)}
          </div>
        ))}
        {product.gallery.map((_, i) => field(`Image de galerie ${i + 1} · description`, `gallery.${i}.alt`))}
      </section>
    </div>
  )
}

function ProductForm({ initial, isNew }) {
  const navigate = useNavigate()
  const { categories } = useCatalog()
  const { reload } = useContent()
  const [product, setProduct] = useState(initial)
  const [lang, setLang] = useState('en')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const dirty = JSON.stringify(product) !== JSON.stringify(initial)

  const set = (changes) => {
    setMessage('')
    setProduct((p) => ({ ...p, ...changes }))
  }

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      const saved = await api(isNew ? '/admin/products' : `/admin/products/${product.id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: clean(product),
      })
      await reload()
      navigate(`/admin/products/${saved.id}`, { replace: true, state: { saved: true } })
      setMessage('Enregistré ✓')
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
          <Link to="/admin/products" className="back-link">
            ← Tous les produits
          </Link>
          <h1>{isNew ? 'Nouveau produit' : product.title || 'Produit sans nom'}</h1>
        </div>
        <div className="admin-page__actions">
          <LanguageTabs value={lang} onChange={setLang} />
          {!isNew && (
            <a href={`/products/${product.id}`} target="_blank" rel="noreferrer" className="btn btn--outline">
              Voir sur le site ↗
            </a>
          )}
        </div>
      </header>

      {lang !== 'en' ? (
        <ProductTranslation
          product={product}
          lang={lang}
          onChange={(path, value) => {
            setMessage('')
            setProduct((p) => setPath(p, path, value))
          }}
        />
      ) : (
        <div className="editor">
          <section className="panel">
            <h2 className="panel__title">Général</h2>
            <div className="form-grid">
              <TextField label="Nom du produit *" value={product.title} onChange={(title) => set({ title })} required />
              <TextField
                label="Étiquette de catégorie"
                value={product.eyebrow}
                onChange={(eyebrow) => set({ eyebrow })}
                hint="Court libellé affiché au-dessus du nom, ex. « Étiquettes PET »"
              />
              <div className="field">
                <label htmlFor="product-category">Catégorie *</label>
                <select
                  id="product-category"
                  value={product.category}
                  onChange={(e) => set({ category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="switch switch--labelled">
                <input
                  type="checkbox"
                  checked={Boolean(product.featured)}
                  onChange={(e) => set({ featured: e.target.checked })}
                />
                <span className="switch__track" aria-hidden="true" />
                En vedette sur la page d’accueil
              </label>
            </div>
            <TextField
              label="Résumé court"
              value={product.text}
              onChange={(text) => set({ text })}
              multiline
              hint="Affiché dans le carrousel de l’accueil et utilisé par la recherche"
            />
          </section>

          <section className="panel">
            <h2 className="panel__title">Images</h2>
            <ImageField
              label="Image principale *"
              value={product.image.src}
              onChange={(src) => set({ image: { ...product.image, src } })}
              hint="Un PNG avec fond transparent donne le meilleur rendu"
            />
            <TextField
              label="Description de l’image (pour les lecteurs d’écran)"
              value={product.image.alt}
              onChange={(alt) => set({ image: { ...product.image, alt } })}
            />
            <ListField
              label="Galerie (images supplémentaires sur la page produit)"
              items={product.gallery}
              onChange={(gallery) => set({ gallery })}
              create={() => ({ src: '', alt: '' })}
              addLabel="Ajouter une image"
              renderItem={(img, update) => (
                <>
                  <ImageField label="Image" value={img.src} onChange={(src) => update({ ...img, src })} />
                  <TextField label="Description" value={img.alt} onChange={(alt) => update({ ...img, alt })} />
                </>
              )}
            />
          </section>

          <section className="panel">
            <h2 className="panel__title">Page produit</h2>
            <StringList
              label="Paragraphes de description"
              items={product.description}
              onChange={(description) => set({ description })}
              addLabel="Ajouter un paragraphe"
              multiline
            />
            <StringList
              label="Caractéristiques principales (liste)"
              items={product.features}
              onChange={(features) => set({ features })}
              addLabel="Ajouter une caractéristique"
            />
            <ListField
              label="Détails techniques"
              items={product.specs}
              onChange={(specs) => set({ specs })}
              create={() => ({ label: '', value: '' })}
              addLabel="Ajouter une ligne"
              renderItem={(spec, update) => (
                <div className="form-grid">
                  <TextField label="Libellé" value={spec.label} onChange={(label) => update({ ...spec, label })} />
                  <TextField label="Valeur" value={spec.value} onChange={(value) => update({ ...spec, value })} />
                </div>
              )}
            />
          </section>
        </div>
      )}

      <SaveBar
        dirty={dirty}
        saving={saving}
        message={message}
        onSave={save}
        onReset={() => setProduct(initial)}
        saveLabel={isNew ? 'Créer le produit' : 'Enregistrer'}
      />
    </>
  )
}

function ProductEditor() {
  const { id } = useParams()
  const { products, categories, findProduct } = useCatalog()
  const isNew = !id

  if (!isNew && products.length && !findProduct(id)) {
    return (
      <section className="panel">
        <p className="panel__empty">
          Ce produit n’existe pas. <Link to="/admin/products">Retour aux produits</Link>
        </p>
      </section>
    )
  }

  const existing = findProduct(id)
  // Fill in fields older products may not have, so every input is controlled
  const initial = isNew
    ? emptyProduct(categories[0]?.id ?? '')
    : {
        ...emptyProduct(existing.category),
        ...existing,
        description: existing.description?.length ? existing.description : [existing.text ?? ''],
      }

  // key: start fresh when switching product or after the saved version reloads
  return <ProductForm key={`${id ?? 'new'}|${JSON.stringify(existing ?? '')}`} initial={initial} isNew={isNew} />
}

export default ProductEditor
