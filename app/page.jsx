'use client'

import { useState, useEffect, useCallback } from 'react'
import BrowserLayout from '@/components/BrowserLayout'
import ClientProviders from '@/components/ClientProviders'

export default function Home() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement)
  }, [])

  const handleF11 = useCallback((e) => {
    if (e.key === 'F11') {
      e.preventDefault()
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleF11)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleF11)
    }
  }, [handleFullscreenChange, handleF11])

  const handleMobileStart = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        setIsFullscreen(true)
      })
    }
  }, [])

  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-white text-xl">Press F11 to start</p>
        <button
          onClick={handleMobileStart}
          className="px-4 py-2 text-white border border-white/60 rounded-lg hover:bg-white/10 transition-colors text-sm"
        >
          Mobile Phone
        </button>
      </div>
    )
  }

  return (
    <ClientProviders>
      <BrowserLayout />
    </ClientProviders>
  )
}
