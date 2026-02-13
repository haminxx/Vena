'use client'

import { useState, useEffect, useCallback } from 'react'
import BrowserLayout from '@/components/BrowserLayout'

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

  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white text-xl">Press F11 to start</p>
      </div>
    )
  }

  return <BrowserLayout />
}
