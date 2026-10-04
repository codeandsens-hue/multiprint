import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// On every navigation: scroll to the #section in the URL, or to the top of the new page
function ScrollManager() {
  // `key` is unique per navigation, so clicking the same #section link twice still scrolls
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    // Wait a frame so the target page has rendered its sections
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash, key])

  return null
}

export default ScrollManager
