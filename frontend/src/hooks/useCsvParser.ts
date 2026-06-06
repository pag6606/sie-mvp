import Papa from 'papaparse'
import { useCallback } from 'react'

export function useCsvParser() {
  const parsearCsv = useCallback((file: File): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.toLowerCase().trim(),
        worker: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            const fatal = results.errors.find((e) => e.type === 'Quotes' || e.type === 'Delimiter')
            if (fatal) {
              reject(new Error(`CSV malformado: ${fatal.message}`))
              return
            }
          }
          resolve(results.data)
        },
        error: (err) => {
          reject(new Error(`Error al parsear CSV: ${err.message}`))
        }
      })
    })
  }, [])

  return { parsearCsv }
}
