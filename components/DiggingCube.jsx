'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useAudioPlayer } from '@/context/AudioPlayerContext'
import { Html, CameraControls, Billboard, Line } from '@react-three/drei'
import * as THREE from 'three'
import { mapTrackToPosition } from '@/utils/mapTrackToPosition'
import { ArrowLeft } from 'lucide-react'
import { useMoodBackground } from '@/context/MoodBackgroundContext'
import DiggingNode, { NODE_RADIUS } from './DiggingNode'
import ArtistCard from './ArtistCard'
import NodeActionMenu from './NodeActionMenu'
import AxisGuides from './AxisGuides'
import { useAppStore } from '@/store/useAppStore'

const EMPTY_ARRAY = []

const CLUSTER_OFFSET = 0.8

const CAMERA_PRESETS = {
  front: { position: [0, 0, 25], target: [0, 0, 0] },
  side: { position: [25, 0, 0], target: [0, 0, 0] },
  top: { position: [0, 25, 0], target: [0, 0, 0] },
  diagonal: { position: [20, 20, 20], target: [0, 0, 0] },
}

function positionFromFeatures(features, parentPos = [0, 0, 0], index = 0) {
  const pos = mapTrackToPosition(features)
  const angle = (index / 5) * Math.PI * 2
  const radius = CLUSTER_OFFSET
  const dx = Math.cos(angle) * radius
  const dz = Math.sin(angle) * radius
  return [
    parentPos[0] + pos.x + dx,
    parentPos[1] + pos.y,
    parentPos[2] + pos.z + dz,
  ]
}


function CameraPresetController({ preset, controlsRef }) {
  useEffect(() => {
    const controls = controlsRef?.current
    if (!controls) return
    const { position, target } = CAMERA_PRESETS[preset] ?? CAMERA_PRESETS.diagonal
    // enableTransition: true = smooth cinematic pan instead of instant snap
    controls.setLookAt(
      position[0], position[1], position[2],
      target[0], target[1], target[2],
      true
    )
  }, [preset, controlsRef])

  return null
}

function isValidPosition(pos) {
  return Array.isArray(pos) && pos.length >= 3 &&
    typeof pos[0] === 'number' && typeof pos[1] === 'number' && typeof pos[2] === 'number'
}

function safePosition(pos) {
  if (!isValidPosition(pos)) return [0, 0, 0]
  return [pos[0], pos[1], pos[2]]
}

function Scene({
  nodes,
  links,
  selectedNodeId,
  showCardTrackId,
  onSelectNode,
  onPlay,
  onExpand,
  onAbout,
  onClose,
  hoveredTrack,
  onHover,
  onUnhover,
  onExtractColor,
  activeNodeId,
  lastTriggerTime,
  savedTracks,
  addSavedTrack,
  loadingSimilar,
  onMenuPointerDown,
  previewFetchingFor,
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-8, -8, 8]} intensity={0.5} />

      <AxisGuides />

      {links.map((link, i) => {
        const from = safePosition(link.from)
        const to = safePosition(link.to)
        return (
          <Line
            key={i}
            points={[from, to]}
            color="#555"
            lineWidth={1}
          />
        )
      })}

      {nodes.map((track) => {
        const pos = safePosition(track.position)
        const trackKey = track?.id ?? track?.videoId ?? track?.spotifyId
        const isMenuOpen = !!selectedNodeId && (selectedNodeId === track.id || selectedNodeId === track?.videoId || selectedNodeId === track?.spotifyId)
        const isCardOpen = showCardTrackId === trackKey
        const isSaved = savedTracks.some((t) => (t.id ?? t.spotifyId) === (track?.id ?? track?.spotifyId))
        return (
          <group key={trackKey ?? track.id ?? 'node'} position={pos}>
            <DiggingNode
              track={track}
              isHovered={hoveredTrack?.id === track.id}
              isSelected={isMenuOpen || isCardOpen}
              onClick={() => onSelectNode(track)}
              onPointerOver={onHover}
              onPointerOut={onUnhover}
              onExtractColor={onExtractColor}
              isActiveNode={activeNodeId === track.id || activeNodeId === track.spotifyId}
              lastTriggerTime={lastTriggerTime}
            />
            {isMenuOpen && !isCardOpen && !loadingSimilar && (
              <Billboard follow lockX={false} lockY={false} lockZ={false}>
                <Html
                  position={[0, NODE_RADIUS + 0.3, 0]}
                  center
                  pointerEvents="none"
                  style={{ width: 300, pointerEvents: 'auto' }}
                >
                  <div className="pointer-events-auto w-[300px]" onPointerDown={(e) => { e.stopPropagation(); onMenuPointerDown?.() }}>
                    <NodeActionMenu
                      onPlay={() => onPlay(track)}
                      onExpand={() => onExpand(track)}
                      onAbout={() => onAbout(track)}
                      onSave={() => addSavedTrack(track, isSaved)}
                      onClose={onClose}
                      hasPreview={!!track?.previewUrl}
                      isFetchingPreview={previewFetchingFor === (track?.id ?? track?.videoId ?? track?.spotifyId)}
                      isSaved={isSaved}
                    />
                  </div>
                </Html>
              </Billboard>
            )}
            {isCardOpen && (
              <Billboard follow lockX={false} lockY={false} lockZ={false}>
                <Html
                  transform
                  position={[0, NODE_RADIUS + 0.2, 0]}
                  center
                  pointerEvents="auto"
                  style={{ pointerEvents: 'auto' }}
                >
                  <div className="pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
                    <ArtistCard track={track} onClose={() => onClose()} />
                  </div>
                </Html>
              </Billboard>
            )}
          </group>
        )
      })}
    </>
  )
}

export default function DiggingCube({ dark = false, tabId, initialTrack, persistedNodes, persistedLinks, focusNodeId, onBack, onExpandNode, onSelectNode }) {
  const lastTriggerTime = useAppStore((s) => s.lastTriggerTime)
  const diggingState = useAppStore((s) => {
    const t = s.tabs.find((x) => x.id === tabId)
    return t?.data ?? null
  })
  const savedTracks = useAppStore((s) => {
    const t = s.tabs.find((x) => x.id === tabId)
    return t?.data?.savedTracks ?? EMPTY_ARRAY
  })
  const saveTrackToTab = useAppStore((s) => s.saveTrackToTab)
  const removeSavedTrackFromTab = useAppStore((s) => s.removeSavedTrackFromTab)
  const { setHoverTrack, setAlbumColorFromImage } = useMoodBackground()

  const handleToggleSave = useCallback(async (track, isSaved) => {
    if (isSaved) {
      removeSavedTrackFromTab(tabId, track?.id ?? track?.spotifyId ?? track?.videoId)
      return
    }
    let enriched = { ...track }
    if (!enriched.spotifyId || !enriched.previewUrl) {
      const artist = typeof track?.artist === 'string' ? track.artist : track?.artist?.name ?? ''
      const trackName = track?.title ?? ''
      if (artist || trackName) {
        try {
          const params = new URLSearchParams({ artist, track: trackName })
          const res = await fetch(`/api/enrich-track-spotify?${params}`)
          const data = await res.json()
          if (data?.spotifyId) enriched = { ...enriched, spotifyId: data.spotifyId }
          if (data?.previewUrl) enriched = { ...enriched, previewUrl: data.previewUrl }
        } catch (_) { /* ignore */ }
      }
    }
    saveTrackToTab(tabId, enriched)
  }, [tabId, saveTrackToTab, removeSavedTrackFromTab])
  const { play } = useAudioPlayer()
  const setDiggingState = useAppStore((s) => s.setDiggingState)

  const [nodes, setNodes] = useState(() => {
    if (persistedNodes?.length > 0) return persistedNodes
    if (!initialTrack) return []
    const pos = initialTrack.audioFeatures
      ? positionFromFeatures(initialTrack.audioFeatures, [0, 0, 0], 0)
      : [0, 0, 0]
    return [{ ...initialTrack, position: pos, parentId: null }]
  })
  const [links, setLinks] = useState(() => persistedLinks ?? [])

  useEffect(() => {
    if (persistedNodes?.length > 0) {
      setNodes(persistedNodes)
      setLinks(persistedLinks ?? [])
    } else if (initialTrack) {
      const pos = initialTrack.audioFeatures
        ? positionFromFeatures(initialTrack.audioFeatures, [0, 0, 0], 0)
        : [0, 0, 0]
      setNodes([{ ...initialTrack, position: pos, parentId: null }])
      setLinks([])
    } else {
      setNodes([])
      setLinks([])
    }
    setSelectedNodeId(null)
    setShowCardTrackId(null)
  }, [tabId])
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [showCardTrackId, setShowCardTrackId] = useState(null)
  const [hoveredTrack, setHoveredTrack] = useState(null)
  const [cameraPreset, setCameraPreset] = useState('diagonal')
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const controlsRef = useRef(null)

  useEffect(() => {
    if (initialTrack && controlsRef.current) {
      const pos = initialTrack.audioFeatures
        ? mapTrackToPosition(initialTrack.audioFeatures)
        : { x: 0, y: 0, z: 0 }
      const offset = 5
      controlsRef.current.setLookAt(pos.x + offset, pos.y + offset, pos.z + offset, pos.x, pos.y, pos.z, true)
    }
  }, [initialTrack?.id])

  useEffect(() => {
    if (focusNodeId && controlsRef.current && nodes.length > 0) {
      const node = nodes.find((n) => n.id === focusNodeId || n.spotifyId === focusNodeId)
      if (node?.position) {
        const [x, y, z] = Array.isArray(node.position) ? node.position : [0, 0, 0]
        const offset = 8
        controlsRef.current.setLookAt(x + offset, y + offset, z + offset, x, y, z, true)
      }
    }
  }, [focusNodeId, nodes])

  useEffect(() => {
    if (!tabId || nodes.length === 0) return
    const tab = useAppStore.getState().tabs.find((t) => t.id === tabId)
    const d = tab?.data ?? {}
    const storedNodes = d.graphNodes ?? []
    const storedLinks = d.graphLinks ?? []
    if (storedNodes === nodes && storedLinks === links) return
    setDiggingState(tabId, { ...d, nodes, links })
  }, [tabId, nodes, links, setDiggingState])

  // Pre-fetch Spotify preview when menu opens so Play works immediately (avoids async/autoplay block)
  const [previewFetchingFor, setPreviewFetchingFor] = useState(null)
  useEffect(() => {
    if (!selectedNodeId) {
      setPreviewFetchingFor(null)
      return
    }
    if (!nodes.length) return
    const track = nodes.find(
      (n) => (n.id ?? n.videoId ?? n.spotifyId) === selectedNodeId
    )
    if (!track?.previewUrl) {
      const artist = typeof track?.artist === 'string' ? track.artist : track?.artist?.name ?? ''
      const trackName = track?.title ?? ''
      if (artist || trackName) {
        setPreviewFetchingFor(selectedNodeId)
        const params = new URLSearchParams({ artist, track: trackName })
        fetch(`/api/enrich-track-spotify?${params}`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.previewUrl) {
              const key = track?.id ?? track?.videoId ?? track?.spotifyId
              setNodes((prev) =>
                prev.map((n) =>
                  (n.id ?? n.videoId ?? n.spotifyId) === key ? { ...n, previewUrl: data.previewUrl } : n
                )
              )
            }
          })
          .catch(() => {})
          .finally(() => setPreviewFetchingFor(null))
      }
    } else {
      setPreviewFetchingFor(null)
    }
  }, [selectedNodeId, nodes])

  const fetchSimilar = useCallback(async (track) => {
    const videoId = track.videoId ?? null
    const searchQuery = [track.title, typeof track.artist === 'string' ? track.artist : track.artist?.name].filter(Boolean).join(' ')
    if (!videoId && !searchQuery) return
    setLoadingSimilar(true)
    try {
      const params = videoId
        ? `videoId=${encodeURIComponent(videoId)}`
        : `search=${encodeURIComponent(searchQuery)}`
      const res = await fetch(`/api/related-tracks?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch related')
      const parentNode = nodes.find((n) => n.id === track.id)
      const parentPos = parentNode?.position ?? [0, 0, 0]
      const newNodes = []
      const newLinks = []
      const relatedTracks = (data.tracks ?? []).slice(0, 5)
      for (let i = 0; i < relatedTracks.length; i++) {
        const t = relatedTracks[i]
        const existing = nodes.find((n) => n.id === t.id || n.videoId === t.videoId)
        if (existing) continue
        const newPos = [
          parentPos[0] + (Math.random() - 0.5) * 4,
          parentPos[1] + (Math.random() - 0.5) * 4,
          parentPos[2] + (Math.random() - 0.5) * 4,
        ]
        newNodes.push({
          id: t.id,
          videoId: t.videoId,
          title: t.title,
          artist: t.artist,
          artistId: t.artistId,
          artistImage: t.artistImage ?? t.image ?? t.thumbnail,
          albumImage: t.albumImage ?? t.artistImage ?? t.image ?? t.thumbnail,
          albumImageMedium: t.albumImageMedium ?? t.albumImage ?? t.artistImage ?? t.image ?? t.thumbnail,
          previewUrl: t.previewUrl,
          spotifyId: t.spotifyId,
          audioFeatures: t.audioFeatures,
          position: newPos,
          parentId: track.id,
          topTracks: [],
        })
        newLinks.push({ from: parentPos, to: newPos })
      }
      setNodes((prev) => [...prev, ...newNodes])
      setLinks((prev) => [...prev, ...newLinks])
    } catch (err) {
      console.error('Similar tracks:', err)
    } finally {
      setLoadingSimilar(false)
      nodesExpandedAtRef.current = Date.now()
    }
  }, [nodes])

  const justClickedMenuRef = useRef(false)
  const nodesExpandedAtRef = useRef(0)
  const handleSelectNode = useCallback((track) => {
    if (!track) return
    if (justClickedMenuRef.current) {
      justClickedMenuRef.current = false
      return
    }
    if (Date.now() - nodesExpandedAtRef.current < 400) return
    const trackKey = track?.id ?? track?.videoId ?? track?.spotifyId
    const isSelecting = selectedNodeId !== trackKey
    setSelectedNodeId((prev) => (prev === trackKey ? null : trackKey))
    setShowCardTrackId(null)
    if (isSelecting) onSelectNode?.(track)
  }, [onSelectNode, selectedNodeId])

  const handlePlay = useCallback(async (track) => {
    let previewUrl = track?.previewUrl
    if (!previewUrl) {
      const artist = typeof track?.artist === 'string' ? track.artist : track?.artist?.name ?? ''
      const trackName = track?.title ?? ''
      if (artist || trackName) {
        try {
          const params = new URLSearchParams({ artist, track: trackName })
          const res = await fetch(`/api/enrich-track-spotify?${params}`)
          const data = await res.json()
          previewUrl = data?.previewUrl ?? null
          if (previewUrl) {
            const key = track?.id ?? track?.videoId ?? track?.spotifyId
            setNodes((prev) =>
              prev.map((n) =>
                (n.id ?? n.videoId ?? n.spotifyId) === key ? { ...n, previewUrl } : n
              )
            )
          }
        } catch (_) { /* ignore */ }
      }
    }
    if (previewUrl) play(previewUrl)
  }, [play])

  const handleExpand = useCallback(
    (track) => {
      justClickedMenuRef.current = true
      setSelectedNodeId(null)
      onExpandNode?.(track)
      fetchSimilar(track)
    },
    [fetchSimilar, onExpandNode]
  )

  const justOpenedCardRef = useRef(false)
  const handleAbout = useCallback((track) => {
    justOpenedCardRef.current = true
    setSelectedNodeId(null)
    setShowCardTrackId(track?.id ?? track?.videoId ?? track?.spotifyId ?? null)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedNodeId(null)
    setShowCardTrackId(null)
  }, [])

  const activeNodeId = focusNodeId ?? diggingState?.focusNodeId ?? selectedNodeId ?? showCardTrackId

  const prevMoodRef = useRef({ hoveredTrack: undefined, selectedNodeId: undefined, showCardTrackId: undefined })
  useEffect(() => {
    const prev = prevMoodRef.current
    const same = prev.hoveredTrack === hoveredTrack && prev.selectedNodeId === selectedNodeId && prev.showCardTrackId === showCardTrackId
    prevMoodRef.current = { hoveredTrack, selectedNodeId, showCardTrackId }
    if (same) return
    setHoverTrack(hoveredTrack ?? null)
    if (!hoveredTrack && !selectedNodeId && !showCardTrackId) {
      setAlbumColorFromImage(null)
    }
  }, [hoveredTrack, selectedNodeId, showCardTrackId, setHoverTrack, setAlbumColorFromImage])

  if (!initialTrack && !persistedNodes?.length && nodes.length === 0) {
    return null
  }

  return (
    <div className="w-full h-full min-h-0 flex-1 relative">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 hover:bg-white text-gray-700 shadow-md border border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </button>
      )}
      {loadingSimilar && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
          Loading similar tracks...
        </div>
      )}
      <Canvas
        camera={{ position: [6, 6, 6], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => gl.setClearColor(dark ? '#0a0a0a' : '#0f0f0f')}
        onPointerMissed={() => {
          if (justOpenedCardRef.current) {
            justOpenedCardRef.current = false
            return
          }
          setSelectedNodeId(null)
          setShowCardTrackId(null)
        }}
      >
        <color attach="background" args={[dark ? '#0a0a0a' : '#0f0f0f']} />
        <CameraControls
          ref={controlsRef}
          makeDefault
          minDistance={2}
          maxDistance={50}
          smoothTime={0.5}
        />
        <CameraPresetController preset={cameraPreset} controlsRef={controlsRef} />
        <Scene
          nodes={nodes}
          links={links}
          selectedNodeId={selectedNodeId}
          showCardTrackId={showCardTrackId}
          onSelectNode={handleSelectNode}
          onPlay={handlePlay}
          onExpand={handleExpand}
          onAbout={handleAbout}
          onClose={handleClose}
          hoveredTrack={hoveredTrack}
          onHover={setHoveredTrack}
          onUnhover={() => setHoveredTrack(null)}
          onExtractColor={setAlbumColorFromImage}
          activeNodeId={activeNodeId}
          lastTriggerTime={lastTriggerTime}
          savedTracks={savedTracks}
          addSavedTrack={handleToggleSave}
          loadingSimilar={loadingSimilar}
          onMenuPointerDown={() => { justClickedMenuRef.current = true }}
          previewFetchingFor={previewFetchingFor}
        />
      </Canvas>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        {(['front', 'side', 'top', 'diagonal']).map((preset) => (
          <button
            key={preset}
            onClick={() => setCameraPreset(preset)}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/90 hover:bg-white text-gray-700 shadow-md border border-gray-200"
          >
            {preset === 'front' && 'Front (X vs Y)'}
            {preset === 'side' && 'Side (Z vs Y)'}
            {preset === 'top' && 'Top (X vs Z)'}
            {preset === 'diagonal' && 'Diagonal'}
          </button>
        ))}
      </div>
    </div>
  )
}
