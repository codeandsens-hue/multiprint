// Small fetch wrapper for the admin API: JSON in/out, errors as exceptions with the server's message
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error ?? `Request failed (${res.status})`)
    error.status = res.status
    throw error
  }
  return data
}

export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Upload failed')
  return data.url
}
