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

  const handleMobileStart = useCallback((e) => {
    e?.preventDefault?.()
    if (document.fullscreenElement || document.webkitFullscreenElement) return
    const req = document.documentElement.requestFullscreen
      ?? document.documentElement.webkitRequestFullscreen
      ?? document.documentElement.msRequestFullscreen
    try {
      if (req) {
        Promise.resolve(req.call(document.documentElement)).catch(() => {})
      }
    } catch (_) {}
    setTimeout(() => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setIsFullscreen(true)
      }
    }, 150)
  }, [])

  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-white text-xl">Press F11 to start</p>
        <button
          type="button"
          onClick={handleMobileStart}
          onTouchEnd={(e) => {
            e.preventDefault()
            handleMobileStart(e)
          }}
          className="px-4 py-2 text-white border border-white/60 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors text-sm touch-manipulation"
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
