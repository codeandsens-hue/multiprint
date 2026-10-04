// Content is stored in English with translations alongside: { …english, i18n: { fr: {…}, ar: {…} } }.
// A translation only contains the texts that differ; anything missing falls back to English.

function merge(base, over) {
  if (over === undefined || over === null || over === '') return base
  if (Array.isArray(base)) {
    // Lists are translated item by item (same order as the English list)
    return Array.isArray(over) ? base.map((item, i) => merge(item, over[i])) : base
  }
  if (base && typeof base === 'object') {
    if (typeof over !== 'object') return base
    const out = { ...base }
    for (const key of Object.keys(over)) out[key] = merge(base[key], over[key])
    return out
  }
  return typeof base === 'number' ? base : over // numbers (stats…) are never translated
}

export function localize(doc, lang) {
  if (!doc || lang === 'en' || !doc.i18n?.[lang]) return doc
  return merge(doc, doc.i18n[lang])
}

export const localizeAll = (list, lang) => list.map((item) => localize(item, lang))
