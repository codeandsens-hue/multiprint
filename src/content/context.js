import { createContext, useContext, useMemo } from 'react'
import { useLanguage } from '../i18n/context.js'
import { localize, localizeAll } from './localize.js'

// Site texts, products and categories (see SiteContentProvider). Editable in /admin.
export const SiteContentContext = createContext(null)

// Raw content (English base + translations), used by the admin and the search index
export const useContent = () => useContext(SiteContentContext)

// Content in the visitor's language
export function useSite() {
  const { site } = useContent()
  const { lang } = useLanguage()
  return useMemo(() => localize(site, lang), [site, lang])
}

export function useProducts() {
  const { products } = useContent()
  const { lang } = useLanguage()
  return useMemo(() => localizeAll(products, lang), [products, lang])
}

export function useCategories() {
  const { categories } = useContent()
  const { lang } = useLanguage()
  return useMemo(() => localizeAll(categories, lang), [categories, lang])
}

export function useCatalog() {
  const products = useProducts()
  const categories = useCategories()
  return useMemo(
    () => ({
      products,
      categories,
      findProduct: (id) => products.find((p) => p.id === id),
      categoryLabel: (id) => categories.find((c) => c.id === id)?.label ?? '',
    }),
    [products, categories],
  )
}

// All images for a product: its main image followed by its gallery
export const galleryOf = (product) =>
  [product.image, ...(product.gallery ?? [])].filter((img) => img?.src)
