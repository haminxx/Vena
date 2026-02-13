'use client'

import { useEffect } from 'react'
import { useBrowserState } from '@/context/BrowserState'

export default function ThemeSync() {
  const { theme } = useBrowserState()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return null
}
