// Languages the content can be edited in (English is the base; others are stored in `i18n`)
export const editLanguages = [
  { code: 'en', label: 'English', note: 'default' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
]

export const languageLabel = (code) => editLanguages.find((l) => l.code === code)?.label ?? code
export const textDir = (code) => editLanguages.find((l) => l.code === code)?.dir

// Read / write a nested value by dotted path ("about.stats.0.label"); numeric keys create arrays
export const getPath = (obj, path) => path.split('.').reduce((value, key) => value?.[key], obj)

export function setPath(obj, path, value) {
  const [key, ...rest] = path.split('.')
  const isIndex = /^\d+$/.test(key)
  const container = obj ?? (isIndex ? [] : {})
  const copy = Array.isArray(container) ? [...container] : { ...container }
  copy[key] = rest.length ? setPath(container[key], rest.join('.'), value) : value
  return copy
}
