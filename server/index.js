import express from 'express'
import multer from 'multer'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stats, trackVisit } from './analytics.js'
import {
  checkPassword,
  clearFailures,
  createSession,
  destroyAllSessions,
  destroySession,
  ensurePassword,
  isLoggedIn,
  recordFailure,
  requireAdmin,
  setPassword,
  tooManyAttempts,
} from './auth.js'
import { DATA_DIR, db, readDoc, writeDoc } from './db.js'

ensurePassword()

const here = dirname(fileURLToPath(import.meta.url))
const UPLOADS = join(DATA_DIR, 'uploads')
mkdirSync(UPLOADS, { recursive: true })

const app = express()
app.disable('x-powered-by')
if (process.env.TRUST_PROXY) app.set('trust proxy', 1) // behind Nginx / a hosting proxy
app.use(express.json({ limit: '1mb' }))

// Reject cross-site writes: a changing request must come from this site's own pages
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.get('origin')
  // Behind a trusted proxy the public host arrives in X-Forwarded-Host
  const host = (process.env.TRUST_PROXY && req.get('x-forwarded-host')) || req.get('host')
  if (origin && new URL(origin).host !== host) {
    return res.status(403).json({ error: 'Cross-site request blocked' })
  }
  next()
})

const slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'item'

const uniqueId = (base, taken) => {
  let id = slugify(base)
  for (let i = 2; taken.includes(id); i++) id = `${slugify(base)}-${i}`
  return id
}

// ---------- Public API ----------

app.get('/api/content', (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ site: readDoc('site'), categories: readDoc('categories'), products: readDoc('products') })
})

app.post('/api/track', (req, res) => {
  trackVisit(req)
  res.status(204).end()
})

// Orders and contact messages from the website forms (max 10 per IP per hour)
const sent = new Map()
const insertRequest = db.prepare('INSERT INTO requests (type, data) VALUES (?, ?)')

app.post('/api/requests', (req, res) => {
  const { type, data } = req.body ?? {}
  if (!['order', 'contact'].includes(type) || typeof data !== 'object' || data === null) {
    return res.status(400).json({ error: 'Invalid request' })
  }
  if (!String(data.name ?? '').trim() || !/^\S+@\S+\.\S+$/.test(String(data.email ?? ''))) {
    return res.status(400).json({ error: 'Name and a valid email are required' })
  }
  const entry = sent.get(req.ip)
  const now = Date.now()
  if (entry && now - entry.first < 3600000 && entry.count >= 10) {
    return res.status(429).json({ error: 'Too many requests, please try again later' })
  }
  sent.set(req.ip, entry && now - entry.first < 3600000 ? { ...entry, count: entry.count + 1 } : { first: now, count: 1 })

  // Keep only short text fields
  const clean = Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => ['string', 'number'].includes(typeof value))
      .map(([key, value]) => [key.slice(0, 40), String(value).slice(0, 4000)]),
  )
  insertRequest.run(type, JSON.stringify(clean))
  res.status(201).json({ ok: true })
})

// ---------- Authentication ----------

app.get('/api/auth/session', (req, res) => res.json({ signedIn: isLoggedIn(req) }))

app.post('/api/auth/login', (req, res) => {
  if (tooManyAttempts(req.ip)) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' })
  }
  if (!checkPassword(String(req.body?.password ?? ''))) {
    recordFailure(req.ip)
    return res.status(401).json({ error: 'Mot de passe incorrect' })
  }
  clearFailures(req.ip)
  createSession(res)
  res.json({ signedIn: true })
})

app.post('/api/auth/logout', (req, res) => {
  destroySession(req, res)
  res.json({ signedIn: false })
})

// ---------- Admin API (everything below requires a session) ----------

const admin = express.Router()
admin.use(requireAdmin)

admin.put('/password', (req, res) => {
  const { current, next } = req.body ?? {}
  if (!checkPassword(String(current ?? ''))) return res.status(400).json({ error: 'Le mot de passe actuel est incorrect' })
  if (String(next ?? '').length < 8) return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
  setPassword(String(next))
  destroyAllSessions() // sign out every other device
  createSession(res)
  res.json({ ok: true })
})

admin.get('/stats', (req, res) => {
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30
  res.json(stats(days))
})

// Site texts and images (one document)
admin.put('/site', (req, res) => {
  if (typeof req.body !== 'object' || !req.body.company) return res.status(400).json({ error: 'Contenu invalide' })
  writeDoc('site', req.body)
  res.json(req.body)
})

// Categories
// Category translations: { fr: { label }, ar: { label } }
const cleanI18n = (i18n) =>
  Object.fromEntries(
    Object.entries(i18n ?? {})
      .filter(([lang]) => ['fr', 'ar'].includes(lang))
      .map(([lang, value]) => [lang, { label: String(value?.label ?? '').trim().slice(0, 80) }]),
  )

admin.post('/categories', (req, res) => {
  const label = String(req.body?.label ?? '').trim()
  if (!label) return res.status(400).json({ error: 'Un nom est requis' })
  const categories = readDoc('categories')
  const category = { id: uniqueId(label, categories.map((c) => c.id)), label, i18n: cleanI18n(req.body?.i18n) }
  writeDoc('categories', [...categories, category])
  res.status(201).json(category)
})

admin.put('/categories/:id', (req, res) => {
  const label = String(req.body?.label ?? '').trim()
  if (!label) return res.status(400).json({ error: 'Un nom est requis' })
  const categories = readDoc('categories')
  if (!categories.some((c) => c.id === req.params.id)) return res.status(404).json({ error: 'Catégorie introuvable' })
  const i18n = cleanI18n(req.body?.i18n)
  writeDoc('categories', categories.map((c) => (c.id === req.params.id ? { ...c, label, i18n } : c)))
  res.json({ id: req.params.id, label, i18n })
})

admin.delete('/categories/:id', (req, res) => {
  const used = readDoc('products').filter((p) => p.category === req.params.id).length
  if (used) return res.status(409).json({ error: `Déplacez ou supprimez d’abord ses ${used} produit(s)` })
  writeDoc('categories', readDoc('categories').filter((c) => c.id !== req.params.id))
  res.status(204).end()
})

// Products
function validProduct(body) {
  if (!String(body?.title ?? '').trim()) return 'A title is required'
  if (!readDoc('categories').some((c) => c.id === body.category)) return 'Choose a valid category'
  if (!body.image?.src) return 'A main image is required'
  return null
}

admin.post('/products', (req, res) => {
  const error = validProduct(req.body)
  if (error) return res.status(400).json({ error })
  const products = readDoc('products')
  const product = { ...req.body, id: uniqueId(req.body.title, products.map((p) => p.id)) }
  writeDoc('products', [...products, product])
  res.status(201).json(product)
})

admin.put('/products/:id', (req, res) => {
  const error = validProduct(req.body)
  if (error) return res.status(400).json({ error })
  const products = readDoc('products')
  if (!products.some((p) => p.id === req.params.id)) return res.status(404).json({ error: 'Produit introuvable' })
  const product = { ...req.body, id: req.params.id }
  writeDoc('products', products.map((p) => (p.id === req.params.id ? product : p)))
  res.json(product)
})

admin.delete('/products/:id', (req, res) => {
  writeDoc('products', readDoc('products').filter((p) => p.id !== req.params.id))
  res.status(204).end()
})

// Image uploads (no SVG: it can carry scripts)
const IMAGE_TYPES = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' }
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS,
    filename: (req, file, done) => done(null, `${Date.now()}-${randomBytes(6).toString('hex')}${IMAGE_TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, done) => done(null, Boolean(IMAGE_TYPES[file.mimetype])),
})

admin.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envoyez une image PNG, JPG, WebP, GIF ou AVIF (8 Mo max.)' })
  res.status(201).json({ url: `/uploads/${req.file.filename}` })
})

// Requests inbox
admin.get('/requests', (req, res) => {
  const rows = db.prepare('SELECT * FROM requests ORDER BY id DESC LIMIT 500').all()
  res.json(rows.map((r) => ({ ...r, read: Boolean(r.read), data: JSON.parse(r.data) })))
})

admin.patch('/requests/:id', (req, res) => {
  db.prepare('UPDATE requests SET read = ? WHERE id = ?').run(req.body?.read ? 1 : 0, Number(req.params.id))
  res.status(204).end()
})

admin.delete('/requests/:id', (req, res) => {
  db.prepare('DELETE FROM requests WHERE id = ?').run(Number(req.params.id))
  res.status(204).end()
})

app.use('/api/admin', admin)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

// Upload limits and other errors come back as JSON
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : err.status ?? 500
  if (status === 500) console.error(err)
  res.status(status).json({ error: status === 413 ? 'L’image dépasse 8 Mo' : 'Something went wrong' })
})

// ---------- Files ----------

app.use('/uploads', express.static(UPLOADS, { maxAge: '30d', immutable: true }))

// Production: serve the built website, with every page route falling back to index.html
const dist = join(here, '../dist')
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false }))
  app.get(/^(?!\/(api|uploads)\/).*/, (req, res) => res.sendFile(join(dist, 'index.html')))
}

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => console.log(`Multiprint server running on http://localhost:${port}`))
