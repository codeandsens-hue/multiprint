import { createHash, randomBytes } from 'node:crypto'
import { db } from './db.js'

// Visitors are counted without cookies: a hash of IP + browser + a salt that changes every day.
// The salt lives only in memory, so hashes can't be traced back to a person.
let salt = { day: '', value: '' }
const today = () => new Date().toISOString().slice(0, 10)

function visitorId(ip, userAgent) {
  const day = today()
  if (salt.day !== day) salt = { day, value: randomBytes(16).toString('hex') }
  return createHash('sha256').update(`${salt.value}|${ip}|${userAgent}`).digest('hex').slice(0, 16)
}

function deviceOf(userAgent = '') {
  if (/ipad|tablet/i.test(userAgent)) return 'tablet'
  if (/mobi|android|iphone/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

const isBot = (userAgent = '') => /bot|crawl|spider|slurp|headless|preview/i.test(userAgent)

function referrerHost(referrer, ownHost) {
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    return host && host !== ownHost ? host : null
  } catch {
    return null
  }
}

const insertVisit = db.prepare(
  'INSERT INTO visits (ts, day, visitor, path, referrer, device) VALUES (?, ?, ?, ?, ?, ?)',
)

export function trackVisit(req) {
  const userAgent = req.get('user-agent') ?? ''
  if (isBot(userAgent)) return
  const path = String(req.body?.path ?? '/').slice(0, 200)
  if (!path.startsWith('/') || path.startsWith('/admin')) return
  const ownHost = (req.hostname ?? '').replace(/^www\./, '')
  insertVisit.run(
    Date.now(),
    today(),
    visitorId(req.ip, userAgent),
    path,
    referrerHost(String(req.body?.referrer ?? ''), ownHost),
    deviceOf(userAgent),
  )
}

// ---------- Dashboard statistics ----------

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

export function stats(days) {
  const from = daysAgo(days - 1)
  const prevFrom = daysAgo(days * 2 - 1)

  const totals = (start, end) =>
    db
      .prepare(
        `SELECT COUNT(*) AS views, COUNT(DISTINCT day || visitor) AS visitors
         FROM visits WHERE day >= ? AND day < ?`,
      )
      .get(start, end)

  const current = totals(from, '9999')
  const previous = totals(prevFrom, from)

  // One row per day, including days without visits
  const rows = db
    .prepare(
      `SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
       FROM visits WHERE day >= ? GROUP BY day`,
    )
    .all(from)
  const byDay = Object.fromEntries(rows.map((r) => [r.day, r]))
  const daily = Array.from({ length: days }, (_, i) => {
    const day = daysAgo(days - 1 - i)
    return { day, views: byDay[day]?.views ?? 0, visitors: byDay[day]?.visitors ?? 0 }
  })

  const top = (column, limit = 6) =>
    db
      .prepare(
        `SELECT ${column} AS label, COUNT(*) AS count FROM visits
         WHERE day >= ? AND ${column} IS NOT NULL GROUP BY ${column} ORDER BY count DESC LIMIT ?`,
      )
      .all(from, limit)

  const todayRow = db
    .prepare('SELECT COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views FROM visits WHERE day = ?')
    .get(today())

  const requests = db
    .prepare(
      `SELECT
         SUM(created_at >= ?) AS period,
         SUM(read = 0) AS unread,
         SUM(type = 'order' AND created_at >= ?) AS orders
       FROM requests`,
    )
    .get(from, from)

  return {
    days,
    visitors: current.visitors,
    views: current.views,
    previous: { visitors: previous.visitors, views: previous.views },
    today: todayRow,
    pagesPerVisitor: current.visitors ? +(current.views / current.visitors).toFixed(1) : 0,
    daily,
    topPages: top('path'),
    referrers: top('referrer'),
    devices: top('device', 3),
    requests: {
      period: requests.period ?? 0,
      unread: requests.unread ?? 0,
      orders: requests.orders ?? 0,
    },
  }
}
