// Sends a website form to the server (saved in the admin "Requests" inbox).
// If the server can't be reached, falls back to opening the visitor's email app with the message.
// `lines` (fallback email body) may contain null for empty optional fields; they are dropped.
export async function submitRequest({ type, data, subject, lines, email }) {
  try {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
    })
    if (res.ok) return 'saved'
    if (res.status < 500) {
      throw new Error('') // the form shows its translated "please check the form" message
    }
  } catch (err) {
    if (err instanceof Error && !(err instanceof TypeError)) throw err // validation message
  }
  const body = lines.filter((line) => line !== null).join('\n')
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  return 'email'
}

// Helper for optional form values: "Label: value", or null when empty
export const optional = (label, value) => (value ? `${label}: ${value}` : null)
