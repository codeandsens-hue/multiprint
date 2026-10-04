import { createContext, useContext } from 'react'
import { languages, strings } from './strings.js'

export const LanguageContext = createContext(null)

// { lang, dir, setLang, t }
export const useLanguage = () => useContext(LanguageContext)
export const useT = () => useContext(LanguageContext).t

// Builds t(key, vars): looks up the key in the language (falling back to English), picks the
// plural form when vars.n is given, and fills in {placeholders}
export function makeT(lang) {
  const plural = new Intl.PluralRules(lang)
  const table = strings[lang] ?? strings.en
  return (key, vars = {}) => {
    let text
    if (typeof vars.n === 'number') {
      const form = vars.n === 0 && table[`${key}_zero`] ? 'zero' : plural.select(vars.n)
      text = table[`${key}_${form}`] ?? table[`${key}_other`] ?? strings.en[`${key}_other`]
    }
    text ??= table[key] ?? strings.en[key] ?? key
    return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`).toString())
  }
}

export const languageInfo = (code) => languages.find((l) => l.code === code) ?? languages[0]
