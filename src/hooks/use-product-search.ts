import { useState, useEffect } from 'react'
import { useDebounce } from './use-debounce'
import { useOnline } from './use-online'
import { searchProducts } from '@/api/products.api'
import { db } from '@/db/offline-db'
import type { Product } from '@/types/models'

export function useProductSearch(query: string) {
  const debouncedQuery = useDebounce(query, 200)
  const isOnline = useOnline()
  const [results, setResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([])
      return
    }

    let cancelled = false
    setIsLoading(true)

    async function search() {
      try {
        if (isOnline) {
          const response = await searchProducts(debouncedQuery)
          if (!cancelled) setResults(response.data as Product[])
        } else {
          // Offline: search IndexedDB by barcode, SKU, or name
          const q = debouncedQuery.toLowerCase()
          const items = await db.products
            .where('barcode')
            .equals(debouncedQuery)
            .or('sku')
            .equalsIgnoreCase(debouncedQuery)
            .toArray()

          if (items.length === 0) {
            // Fuzzy name search
            const all = await db.products
              .where('isActive')
              .equals(1 as unknown as string)
              .toArray()
            const filtered = all
              .filter((p) => p.name.toLowerCase().includes(q))
              .slice(0, 20)
            if (!cancelled) setResults(filtered as unknown as Product[])
          } else {
            if (!cancelled) setResults(items as unknown as Product[])
          }
        }
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    search()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, isOnline])

  return { results, isLoading }
}
