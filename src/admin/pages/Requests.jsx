import { useEffect, useState } from 'react'
import { api } from '../api.js'

const typeLabel = { order: 'Order', contact: 'Message' }
const fieldLabels = {
  product: 'Product',
  quantity: 'Quantity',
  unit: 'Unit',
  name: 'Name',
  company: 'Company',
  email: 'Email',
  phone: 'Phone',
  subject: 'Subject',
  message: 'Message',
}

const formatDate = (iso) =>
  new Date(`${iso.replace(' ', 'T')}Z`).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

function Requests() {
  const [requests, setRequests] = useState(null)
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/requests')
      .then(setRequests)
      .catch((err) => setError(err.message))
  }, [])

  const setRead = async (request, read) => {
    setRequests((list) => list.map((r) => (r.id === request.id ? { ...r, read } : r)))
    await api(`/admin/requests/${request.id}`, { method: 'PATCH', body: { read } }).catch((err) =>
      setError(err.message),
    )
  }

  const open = (request) => {
    setOpenId(openId === request.id ? null : request.id)
    if (!request.read) setRead(request, true)
  }

  const remove = async (request) => {
    if (!confirm(`Delete this ${typeLabel[request.type].toLowerCase()} from ${request.data.name}?`)) return
    await api(`/admin/requests/${request.id}`, { method: 'DELETE' })
    setRequests((list) => list.filter((r) => r.id !== request.id))
  }

  const visible = (requests ?? []).filter(
    (r) => filter === 'all' || (filter === 'unread' ? !r.read : r.type === filter),
  )

  return (
    <>
      <header className="admin-page__header">
        <div>
          <h1>Requests</h1>
          <p>Orders and messages sent from the website forms.</p>
        </div>
        <div className="segmented" role="group" aria-label="Filter">
          {[
            ['all', 'All'],
            ['unread', 'Unread'],
            ['order', 'Orders'],
            ['contact', 'Messages'],
          ].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="admin-error">{error}</p>}
      {!requests ? (
        <p className="panel__empty">Loading…</p>
      ) : visible.length === 0 ? (
        <section className="panel">
          <p className="panel__empty">No requests here yet.</p>
        </section>
      ) : (
        <ul className="requests">
          {visible.map((request) => (
            <li key={request.id} className={`request${request.read ? '' : ' is-unread'}`}>
              <button
                type="button"
                className="request__summary"
                aria-expanded={openId === request.id}
                onClick={() => open(request)}
              >
                <span className={`tag tag--${request.type}`}>{typeLabel[request.type]}</span>
                <span className="request__who">
                  <strong>{request.data.name}</strong>
                  {request.data.company && <span> · {request.data.company}</span>}
                </span>
                <span className="request__about">
                  {request.type === 'order'
                    ? `${request.data.product} — ${request.data.quantity} ${request.data.unit}`
                    : request.data.subject}
                </span>
                <time>{formatDate(request.created_at)}</time>
              </button>

              {openId === request.id && (
                <div className="request__details">
                  <dl>
                    {Object.entries(request.data)
                      .filter(([, value]) => value)
                      .map(([key, value]) => (
                        <div key={key} className={key === 'message' ? 'is-wide' : undefined}>
                          <dt>{fieldLabels[key] ?? key}</dt>
                          <dd>
                            {key === 'email' ? (
                              <a href={`mailto:${value}`}>{value}</a>
                            ) : key === 'phone' ? (
                              <a href={`tel:${value}`}>{value}</a>
                            ) : (
                              value
                            )}
                          </dd>
                        </div>
                      ))}
                  </dl>
                  <div className="request__actions">
                    <a
                      className="btn btn--primary"
                      href={`mailto:${request.data.email}?subject=${encodeURIComponent(
                        `Re: ${request.type === 'order' ? `your order – ${request.data.product}` : request.data.subject}`,
                      )}`}
                    >
                      Reply by email
                    </a>
                    <button type="button" className="btn btn--outline" onClick={() => setRead(request, false)}>
                      Mark as unread
                    </button>
                    <button type="button" className="btn btn--danger" onClick={() => remove(request)}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default Requests
