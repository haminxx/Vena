'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

const BrowserStateContext = createContext(null)

export function BrowserStateProvider({ children }) {
  const tabs = useAppStore((s) => s.tabs)
  const activeTabId = useAppStore((s) => s.activeTabId)
  const setActiveTabId = useAppStore((s) => s.setActiveTabId)
  const addTab = useAppStore((s) => s.addTab)
  const closeTab = useAppStore((s) => s.closeTab)
  const updateTab = useAppStore((s) => s.updateTab)
  const setTabType = useAppStore((s) => s.setTabType)

  const [theme, setThemeState] = useState('light')

  useEffect(() => {
    setThemeState(localStorage.getItem('digbrowser-theme') || 'light')
  }, [])

  const setTheme = useCallback((value) => {
    setThemeState(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('digbrowser-theme', value)
    }
  }, [])

  const value = useMemo(
    () => ({
      tabs,
      activeTabId,
      setActiveTabId,
      addTab,
      closeTab,
      updateTab,
      setTabType,
      theme,
      setTheme,
    }),
    [tabs, activeTabId, setActiveTabId, addTab, closeTab, updateTab, setTabType, theme, setTheme]
  )

  return <BrowserStateContext.Provider value={value}>{children}</BrowserStateContext.Provider>
}

export function useBrowserState() {
  const ctx = useContext(BrowserStateContext)
  if (!ctx) throw new Error('useBrowserState must be used within BrowserStateProvider')
  return ctx
}
