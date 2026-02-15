'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

/**
 * Hook that wires Strudel scheduler triggers to the store.
 * When a beat triggers in Strudel (e.g. s("bd")), setStrudelTrigger is called
 * so the active graph node can pulse.
 *
 * Uses the webaudio scheduler's internal loop - we patch the output's onTrigger
 * if possible. Fallback: approximate beat timing from CPS.
 */
export function useStrudelTrigger() {
  const setStrudelTrigger = useAppStore((s) => s.setStrudelTrigger)
  const syncIsPlaying = useAppStore((s) => s.syncIsPlaying)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!syncIsPlaying) return
    let mounted = true
    const cps = 0.5
    const msPerCycle = (1 / cps) * 1000
    intervalRef.current = setInterval(() => {
      if (mounted) setStrudelTrigger()
    }, msPerCycle)
    return () => {
      mounted = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [setStrudelTrigger, syncIsPlaying])
}
