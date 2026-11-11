import { editLanguages, languageLabel } from './paths.js'

// Shared pieces for editing translations in the dashboard.
// Content is stored in English, with translations in `i18n.fr` / `i18n.ar` (only the texts that differ).

export function LanguageTabs({ value, onChange }) {
  return (
    <div className="segmented" role="group" aria-label="Langue à modifier">
      {editLanguages.map((l) => (
        <button key={l.code} type="button" aria-pressed={value === l.code} onClick={() => onChange(l.code)}>
          <span lang={l.code}>{l.label}</span>
          {l.note && <small> ({l.note})</small>}
        </button>
      ))}
    </div>
  )
}

export function TranslationHint({ lang }) {
  return (
    <p className="translation-hint">
      Vous modifiez la version <strong>{languageLabel(lang)}</strong>. Laissez un champ vide pour afficher le
      texte anglais. Les images, les chiffres et les liens sont communs à toutes les langues.
    </p>
  )
}
