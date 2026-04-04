import { useEffect } from 'react'

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: { allowInInput?: boolean },
) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!options?.allowInInput) {
        const tag = (e.target as HTMLElement)?.tagName
        const isInput =
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          (e.target as HTMLElement)?.isContentEditable
        if (isInput) return
      }
      if (e.key === key) {
        e.preventDefault()
        callback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback, options?.allowInInput])
}
