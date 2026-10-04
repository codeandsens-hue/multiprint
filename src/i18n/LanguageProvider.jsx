import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LanguageContext, languageInfo, makeT } from './context.js'
import { languages } from './strings.js'

const STORAGE_KEY = 'multiprint.lang'

// Saved choice, else the browser's language if we support it, else English
function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (languages.some((l) => l.code === saved)) return saved
  } catch {
    // storage unavailable (private mode…)
  }
  const browser = (navigator.language ?? 'en').slice(0, 2)
  return languages.some((l) => l.code === browser) ? browser : 'en'
}

export function LanguageProvider({ children }) {
  const [chosen, setChosen] = useState(initialLanguage)
  // The dashboard is always in English (and edits the English base content)
  const isAdmin = useLocation().pathname.startsWith('/admin')
  const lang = isAdmin ? 'en' : chosen
  const { dir } = languageInfo(lang)

  // <html lang dir> drive the right-to-left layout and screen-reader pronunciation
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const value = useMemo(
    () => ({
      lang,
      dir,
      t: makeT(lang),
      setLang: (code) => {
        setChosen(code)
        try {
          localStorage.setItem(STORAGE_KEY, code)
        } catch {
          // not remembered, still switches for this visit
        }
      },
    }),
    [lang, dir],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
