# Multiprint website

React (Vite) website with a small Node.js server for the admin dashboard, visitor statistics and form requests.

## Development

```bash
npm install
npm run dev
```

- Website: http://localhost:5173
- Dashboard: http://localhost:5173/admin
- `npm run dev` starts both the website (Vite) and the API server (`server/`, port 3001).

### First start

The server needs `server/.env` (copy `server/.env.example`). `ADMIN_PASSWORD` is used **only on the first start**
to create the dashboard login; change it afterwards from **Dashboard → Settings**.

On first start the database is filled with the content in `src/data/defaults.json`. After that, all texts,
images, products and categories are edited from the dashboard and stored in the database.

## Where data lives

| What | Where |
| --- | --- |
| Database (content, requests, visits) | `data/multiprint.db` |
| Uploaded images | `data/uploads/` |
| Built-in images | `public/images/` |

`data/` and `server/.env` are not committed to git. **Back up `data/`**: it contains everything edited in the dashboard.

## Production

```bash
npm install
npm run build
npm start
```

`npm start` serves the built website and the API from one Node.js process (port `PORT`, default 3001).
Requirements: Node.js 22.13 or newer (uses the built-in `node:sqlite`).

Environment variables (in `server/.env` or the host's settings):

- `ADMIN_PASSWORD` — initial dashboard password (first start only)
- `PORT` — port to listen on
- `TRUST_PROXY=1` — set when running behind Nginx or a hosting proxy (correct visitor IPs and secure cookies)
- `DATA_DIR` — where to keep the database and uploads (must be persistent storage)

Run it behind HTTPS in production: the session cookie is marked `secure` when `NODE_ENV=production`.

## Visitor statistics

Visits are counted by the server without cookies: each visitor is identified by a hash of IP + browser + a
salt that changes every day and is never stored, so no personal data is kept. Bots, `/admin` pages and
browsers with "Do Not Track" are not counted.

## Languages (English, French, Arabic)

- The visitor picks the language in the navbar; the choice is remembered in the browser (default: the browser's
  language when it is French or Arabic, otherwise English). Arabic switches the whole layout to right-to-left.
- **Interface texts** (buttons, labels, messages) are in `src/i18n/strings.js`.
- **Content** (section texts, products, categories) is stored in English with translations alongside
  (`i18n.fr`, `i18n.ar`) and edited in the dashboard with the **English / Français / العربية** tabs.
  An empty translation falls back to the English text. Images, numbers and links are shared by all languages.
- The dashboard itself is always in English.
