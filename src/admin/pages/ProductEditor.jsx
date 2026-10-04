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
        <h2 className="panel__title">General</h2>
        {field('Product name', 'title')}
        {field('Category tag', 'eyebrow')}
        {field('Short summary', 'text', true)}
        {field('Main image description', 'image.alt')}
      </section>

      <section className="panel">
        <h2 className="panel__title">Product page</h2>
        {product.description.map((_, i) => field(`Description paragraph ${i + 1}`, `description.${i}`, true))}
        {product.features.map((_, i) => field(`Feature ${i + 1}`, `features.${i}`))}
        {product.specs.map((_, i) => (
          <div key={i} className="form-grid">
            {field(`Detail ${i + 1} · label`, `specs.${i}.label`)}
            {field(`Detail ${i + 1} · value`, `specs.${i}.value`)}
          </div>
        ))}
        {product.gallery.map((_, i) => field(`Gallery image ${i + 1} · description`, `gallery.${i}.alt`))}
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
      setMessage('Saved ✓')
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
            ← All products
          </Link>
          <h1>{isNew ? 'New product' : product.title || 'Untitled product'}</h1>
        </div>
        <div className="admin-page__actions">
          <LanguageTabs value={lang} onChange={setLang} />
          {!isNew && (
            <a href={`/products/${product.id}`} target="_blank" rel="noreferrer" className="btn btn--outline">
              View on website ↗
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
            <h2 className="panel__title">General</h2>
            <div className="form-grid">
              <TextField label="Product name *" value={product.title} onChange={(title) => set({ title })} required />
              <TextField
                label="Category tag"
                value={product.eyebrow}
                onChange={(eyebrow) => set({ eyebrow })}
                hint="Short label shown above the name, e.g. “Étiquettes PET”"
              />
              <div className="field">
                <label htmlFor="product-category">Category *</label>
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
                Featured on the home page
              </label>
            </div>
            <TextField
              label="Short summary"
              value={product.text}
              onChange={(text) => set({ text })}
              multiline
              hint="Shown in the home page carousel and used by the search"
            />
          </section>

          <section className="panel">
            <h2 className="panel__title">Images</h2>
            <ImageField
              label="Main image *"
              value={product.image.src}
              onChange={(src) => set({ image: { ...product.image, src } })}
              hint="A PNG with a transparent background looks best"
            />
            <TextField
              label="Image description (for screen readers)"
              value={product.image.alt}
              onChange={(alt) => set({ image: { ...product.image, alt } })}
            />
            <ListField
              label="Gallery (extra images on the product page)"
              items={product.gallery}
              onChange={(gallery) => set({ gallery })}
              create={() => ({ src: '', alt: '' })}
              addLabel="Add image"
              renderItem={(img, update) => (
                <>
                  <ImageField label="Image" value={img.src} onChange={(src) => update({ ...img, src })} />
                  <TextField label="Description" value={img.alt} onChange={(alt) => update({ ...img, alt })} />
                </>
              )}
            />
          </section>

          <section className="panel">
            <h2 className="panel__title">Product page</h2>
            <StringList
              label="Description paragraphs"
              items={product.description}
              onChange={(description) => set({ description })}
              addLabel="Add paragraph"
              multiline
            />
            <StringList
              label="Key features (checklist)"
              items={product.features}
              onChange={(features) => set({ features })}
              addLabel="Add feature"
            />
            <ListField
              label="Technical details"
              items={product.specs}
              onChange={(specs) => set({ specs })}
              create={() => ({ label: '', value: '' })}
              addLabel="Add row"
              renderItem={(spec, update) => (
                <div className="form-grid">
                  <TextField label="Label" value={spec.label} onChange={(label) => update({ ...spec, label })} />
                  <TextField label="Value" value={spec.value} onChange={(value) => update({ ...spec, value })} />
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
        saveLabel={isNew ? 'Create product' : 'Save changes'}
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
          This product doesn’t exist. <Link to="/admin/products">Back to products</Link>
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
