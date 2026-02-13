'use client'

import { useCallback } from 'react'
import { useBrowserState } from '@/context/BrowserState'

/**
 * Hook to access and manipulate the active tab's history stack.
 * Each history item: { query, graphData }
 */
export function useTabHistory() {
  const { tabs, activeTabId, updateTab } = useBrowserState()

  const activeTab = tabs.find((t) => t.id === activeTabId)
  const history = activeTab?.history ?? []
  const currentIndex = activeTab?.currentIndex ?? 0
  const currentState = history[currentIndex] ?? null

  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < history.length - 1

  const back = useCallback(() => {
    if (!activeTabId || !canGoBack) return
    updateTab(activeTabId, (t) => ({ ...t, currentIndex: Math.max(0, t.currentIndex - 1) }))
  }, [activeTabId, canGoBack, updateTab])

  const forward = useCallback(() => {
    if (!activeTabId || !canGoForward) return
    updateTab(activeTabId, (t) => ({
      ...t,
      currentIndex: Math.min(t.history.length - 1, t.currentIndex + 1),
    }))
  }, [activeTabId, canGoForward, updateTab])

  const push = useCallback(
    (state) => {
      if (!activeTabId) return
      updateTab(activeTabId, (t) => {
        const newHistory = t.history.slice(0, t.currentIndex + 1)
        newHistory.push(state)
        return {
          ...t,
          history: newHistory,
          currentIndex: newHistory.length - 1,
        }
      })
    },
    [activeTabId, updateTab]
  )

  const replace = useCallback(
    (state) => {
      if (!activeTabId) return
      updateTab(activeTabId, (t) => {
        const newHistory = [...t.history]
        newHistory[t.currentIndex] = state
        return { ...t, history: newHistory }
      })
    },
    [activeTabId, updateTab]
  )

  const refresh = useCallback(() => {
    if (!activeTabId || !currentState) return
    return currentState.query
  }, [activeTabId, currentState])

  return {
    history,
    currentIndex,
    currentState,
    canGoBack,
    canGoForward,
    back,
    forward,
    push,
    replace,
    refresh,
  }
}
