import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

function readThemeMode(): ThemeMode {
  if (typeof document === 'undefined') return 'light'

  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/** Tracks the theme that `ThemeToggle` writes to the document element. */
export function useThemeMode(): ThemeMode {
  const [mode, setMode] = useState<ThemeMode>(readThemeMode)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setMode(readThemeMode())
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  return mode
}
