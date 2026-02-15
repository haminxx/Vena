'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/store/useAppStore'
import { useStrudelTrigger } from '@/hooks/useStrudelTrigger'
import { useAudioPlayer } from '@/context/AudioPlayerContext'
import '@strudel.cycles/react/dist/style.css'

const MiniRepl = dynamic(
  () => import('@strudel.cycles/react').then((m) => m.MiniRepl),
  { ssr: false, loading: () => <div className="p-4 text-gray-500">Loading Strudel...</div> }
)

export async function initStrudel() {
  if (typeof window === 'undefined') return
  try {
    const { evalScope, controls } = await import('@strudel.cycles/core')
    const { samples, initAudioOnFirstClick } = await import('@strudel.cycles/webaudio')

    async function prebake() {
      try {
        await samples(
          'https://strudel.cc/tidal-drum-machines.json',
          'github:ritchse/tidal-drum-machines/main/machines/'
        )
      } catch (e1) {
        try {
          await samples(
            'https://strudel.tidalcycles.org/tidal-drum-machines.json',
            'github:ritchse/tidal-drum-machines/main/machines/'
          )
        } catch {}
      }
      try {
        await samples(
          'https://strudel.cc/EmuSP12.json',
          'https://strudel.cc/EmuSP12/'
        )
      } catch (e2) {
        try {
          await samples(
            'https://strudel.tidalcycles.org/EmuSP12.json',
            'https://strudel.tidalcycles.org/EmuSP12/'
          )
        } catch {}
      }
    }

    await evalScope(
      controls,
      import('@strudel.cycles/core'),
      import('@strudel.cycles/mini'),
      import('@strudel.cycles/webaudio'),
      import('@strudel.cycles/tonal')
    )
    await prebake()
    initAudioOnFirstClick()
    return true
  } catch (err) {
    console.error('[Strudel] init failed:', err)
    return false
  }
}

let strudelInitialized = false

export default function SyncView({ dark = false }) {
  const savedTracks = useAppStore((s) => s.savedTracks) ?? []
  const syncIsPlaying = useAppStore((s) => s.syncIsPlaying)
  const [ready, setReady] = useState(false)
  const { play: playSpotify, stop: stopSpotify } = useAudioPlayer()
  useStrudelTrigger()

  useEffect(() => {
    if (!ready) return
    const run = async () => {
      try {
        const webaudio = await import('@strudel.cycles/webaudio')
        const sched = webaudio.getScheduler?.()
        if (syncIsPlaying) {
          sched?.start?.()
        } else {
          sched?.stop?.()
          stopSpotify()
        }
      } catch {}
    }
    run()
  }, [syncIsPlaying, ready, stopSpotify])
  const [replRef, setReplRef] = useState(null)

  useEffect(() => {
    if (strudelInitialized) {
      setReady(true)
      return
    }
    initStrudel().then((ok) => {
      strudelInitialized = ok
      setReady(ok)
    })
  }, [])

  const handleSelectTrack = useCallback(async (track) => {
    const bpm = track?.bpm ?? track?.audioFeatures?.tempo ?? 120
    const cpm = bpm / 4
    try {
      const webaudio = await import('@strudel.cycles/webaudio')
      const sched = webaudio.getScheduler?.()
      if (sched?.setCps) {
        sched.setCps(cpm / 60)
      }
    } catch {
      try {
        const scope = await import('@strudel.cycles/core')
        if (scope.eval) {
          scope.eval(`setcpm(${cpm})`)
        }
      } catch {}
    }
  }, [])

  const isDark = dark
  const bg = isDark ? 'bg-gray-900' : 'bg-gray-100'
  const border = isDark ? 'border-gray-700' : 'border-gray-200'
  const text = isDark ? 'text-gray-200' : 'text-gray-800'
  const muted = isDark ? 'text-gray-400' : 'text-gray-500'
  const sidebarBg = isDark ? 'bg-gray-800' : 'bg-gray-200'
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-300'

  return (
    <div className={`flex-1 flex overflow-hidden ${bg}`}>
      {/* Samples Sidebar - Chrome DevTools style */}
      <div className={`w-56 shrink-0 flex flex-col border-r ${border} ${sidebarBg}`}>
        <div className={`px-3 py-2 border-b ${border} font-mono text-xs font-semibold ${text}`}>
          Saved Tracks
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {savedTracks.length === 0 ? (
            <p className={`text-xs ${muted} px-2 py-4`}>
              Save tracks from the Digging tab to sync tempo here.
            </p>
          ) : (
            <ul className="space-y-1">
              {savedTracks.map((track) => {
                const name = track?.title ?? 'Unknown'
                const artist = typeof track?.artist === 'string' ? track.artist : track?.artist?.name ?? ''
                const bpm = track?.bpm ?? track?.audioFeatures?.tempo ?? '—'
                return (
                  <li key={track?.id ?? track?.spotifyId ?? name}>
                    <button
                      onClick={() => handleSelectTrack(track)}
                      className={`w-full text-left px-2 py-2 rounded text-xs ${text} ${hoverBg} transition-colors`}
                    >
                      <div className="truncate font-medium">{name}</div>
                      <div className={`truncate ${muted}`}>{artist}</div>
                      <div className={`text-[10px] ${muted} mt-0.5`}>{bpm} BPM</div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* MiniRepl - DevTools console style */}
      <div className={`flex-1 flex flex-col min-w-0 ${isDark ? 'bg-[#1e1e1e]' : 'bg-[#fff]'}`}>
        <div className={`px-3 py-2 border-b ${border} font-mono text-xs ${muted}`}>
          Strudel REPL — Write patterns (e.g. s(&quot;bd hh&quot;)) and evaluate with Ctrl+Enter
        </div>
        <div className="flex-1 min-h-[300px] overflow-hidden">
          {ready && (
            <div className="h-full w-full [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto">
              <MiniRepl />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
