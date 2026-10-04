import { useState } from 'react'
import { useSite } from '../content/context.js'
import { useT } from '../i18n/context.js'
import { submitRequest } from './mailto.js'

// Shared submit logic for the contact and order forms.
// `build(fields)` turns the form fields into { type, subject, lines } for the request.
export function useRequestForm(build) {
  const { company } = useSite()
  const t = useT()
  const [status, setStatus] = useState({ state: 'idle' })

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))
    setStatus({ state: 'sending' })
    try {
      const result = await submitRequest({ ...build(data), data, email: company.email })
      setStatus({ state: result })
      if (result === 'saved') form.reset()
    } catch (err) {
      setStatus({ state: 'error', message: err.message || t('form.invalid') })
    }
  }

  const message = {
    idle: null,
    sending: t('form.sending'),
    saved: t('form.saved'),
    email: t('form.fallback', { email: company.email }),
    error: status.message,
  }[status.state]

  return { onSubmit, status: status.state, message, sending: status.state === 'sending' }
}
