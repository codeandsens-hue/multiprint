import { useCallback, useEffect, useMemo, useState } from 'react'
import defaults from '../data/defaults.json'
import { SiteContentContext } from './context.js'

const fetchContent = () =>
  fetch('/api/content')
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null) // server unreachable: keep the built-in content

// Loads the content from the server (/api/content). The content shipped with the build is shown
// first, so the page never waits on the network.
export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(defaults)

  useEffect(() => {
    let active = true
    fetchContent().then((data) => active && data && setContent(data))
    return () => {
      active = false
    }
  }, [])

  // Used by the admin after saving, so the website preview shows the new content
  // Resolves with the content, or null if the server couldn't be reached
  const reload = useCallback(
    () =>
      fetchContent().then((data) => {
        if (data) setContent(data)
        return data
      }),
    [],
  )

  const value = useMemo(() => ({ ...content, reload }), [content, reload])
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}
