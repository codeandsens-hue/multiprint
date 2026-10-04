import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { db, readSetting, writeSetting } from './db.js'

const SESSION_DAYS = 7
export const COOKIE = 'mp_session'

// ---------- Password (scrypt hash stored in the settings table) ----------

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function checkPassword(password) {
  const stored = readSetting('admin_password')
  if (!stored) return false
  const [salt, hash] = stored.split(':')
  const candidate = scryptSync(password, salt, 64)
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'))
}

export const setPassword = (password) => writeSetting('admin_password', hashPassword(password))

// First start: take the initial password from ADMIN_PASSWORD (see server/.env)
export function ensurePassword() {
  if (readSetting('admin_password')) return
  const initial = process.env.ADMIN_PASSWORD
  if (!initial || initial.length < 8) {
    throw new Error('Set ADMIN_PASSWORD (8+ characters) in server/.env before the first start.')
  }
  setPassword(initial)
}

// ---------- Sessions (random token in an httpOnly cookie) ----------

const insertSession = db.prepare('INSERT INTO sessions (token, expires_at) VALUES (?, ?)')
const findSession = db.prepare('SELECT expires_at FROM sessions WHERE token = ?')
const deleteSession = db.prepare('DELETE FROM sessions WHERE token = ?')
const purgeSessions = db.prepare('DELETE FROM sessions WHERE expires_at < ?')
const deleteAllSessions = db.prepare('DELETE FROM sessions')

export function createSession(res) {
  purgeSessions.run(Date.now())
  const token = randomBytes(32).toString('hex')
  const maxAge = SESSION_DAYS * 24 * 60 * 60 * 1000
  insertSession.run(token, Date.now() + maxAge)
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  })
}

export function destroySession(req, res) {
  const token = readCookie(req)
  if (token) deleteSession.run(token)
  res.clearCookie(COOKIE, { path: '/' })
}

export const destroyAllSessions = () => deleteAllSessions.run()

function readCookie(req) {
  const header = req.headers.cookie ?? ''
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`))
  return match ? decodeURIComponent(match.slice(COOKIE.length + 1)) : null
}

export function isLoggedIn(req) {
  const token = readCookie(req)
  if (!token) return false
  const row = findSession.get(token)
  return Boolean(row && row.expires_at > Date.now())
}

export function requireAdmin(req, res, next) {
  if (isLoggedIn(req)) return next()
  res.status(401).json({ error: 'Not signed in' })
}

// ---------- Brute-force protection: 5 failed attempts per IP per 15 minutes ----------

const attempts = new Map()
const WINDOW = 15 * 60 * 1000

export function tooManyAttempts(ip) {
  const entry = attempts.get(ip)
  if (!entry || Date.now() - entry.first > WINDOW) return false
  return entry.count >= 5
}

export function recordFailure(ip) {
  const entry = attempts.get(ip)
  if (!entry || Date.now() - entry.first > WINDOW) attempts.set(ip, { first: Date.now(), count: 1 })
  else entry.count++
}

export const clearFailures = (ip) => attempts.delete(ip)
