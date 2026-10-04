import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Counts a page view on every navigation (anonymous: no cookies, see server/analytics.js).
// Visitors with "Do Not Track" enabled are not counted.
function PageViewTracker() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (navigator.doNotTrack === '1') return
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: document.referrer }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}

export default PageViewTracker
