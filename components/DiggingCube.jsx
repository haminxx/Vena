'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, CameraControls, Billboard, Line } from '@react-three/drei'
import * as THREE from 'three'
import { mapTrackToPosition } from '@/utils/mapTrackToPosition'
import { ArrowLeft } from 'lucide-react'
import DiggingNode, { NODE_RADIUS } from './DiggingNode'
import ArtistCard from './ArtistCard'

const CUBE_SIZE = 6
const CLUSTER_OFFSET = 0.8

const CAMERA_PRESETS = {
  front: { position: [0, 0, 10], target: [0, 0, 0] },
  side: { position: [10, 0, 0], target: [0, 0, 0] },
  top: { position: [0, 10, 0], target: [0, 0, 0] },
  diagonal: { position: [6, 6, 6], target: [0, 0, 0] },
}

function positionFromFeatures(features, parentPos = [0, 0, 0], index = 0) {
  const pos = mapTrackToPosition(features)
  const scale = CUBE_SIZE / 2
  const baseX = pos.x * scale
  const baseY = pos.y * scale
  const baseZ = pos.z * scale
  const angle = (index / 5) * Math.PI * 2
  const radius = CLUSTER_OFFSET
  const dx = Math.cos(angle) * radius
  const dz = Math.sin(angle) * radius
  return [
    parentPos[0] + baseX * 0.3 + dx,
    parentPos[1] + baseY * 0.3,
    parentPos[2] + baseZ * 0.3 + dz,
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

function Scene({
  nodes,
  links,
  selectedTrack,
  onSelectTrack,
  hoveredTrack,
  onHover,
  onUnhover,
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[8, 8, 8]} intensity={1} />
      <pointLight position={[-8, -8, 8]} intensity={0.5} />

      {links.map((link, i) => {
        const from = Array.isArray(link.from) ? link.from : [0, 0, 0]
        const to = Array.isArray(link.to) ? link.to : [0, 0, 0]
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
        const pos = Array.isArray(track.position) ? track.position : [0, 0, 0]
        return (
          <group key={track.id} position={pos}>
            <DiggingNode
              track={track}
              isHovered={hoveredTrack?.id === track.id}
              isSelected={selectedTrack?.id === track.id}
              onClick={onSelectTrack}
              onPointerOver={onHover}
              onPointerOut={onUnhover}
            />
            {selectedTrack?.id === track.id && (
              <Billboard follow lockX={false} lockY={false} lockZ={false}>
                <Html
                  transform
                  position={[0, NODE_RADIUS + 0.3, 0]}
                  center
                  pointerEvents="none"
                >
                  <div className="pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
                    <ArtistCard track={track} onClose={() => onSelectTrack(null)} />
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

export default function DiggingCube({ dark = false, initialTrack, onBack }) {
  const [nodes, setNodes] = useState(() => {
    if (!initialTrack) return []
    const pos = initialTrack.audioFeatures
      ? positionFromFeatures(initialTrack.audioFeatures, [0, 0, 0], 0)
      : [0, 0, 0]
    return [{ ...initialTrack, position: pos, parentId: null }]
  })
  const [links, setLinks] = useState([])
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [hoveredTrack, setHoveredTrack] = useState(null)
  const [cameraPreset, setCameraPreset] = useState('diagonal')
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const controlsRef = useRef(null)

  const fetchSimilar = useCallback(async (track) => {
    const seed = track.spotifyId || track.id
    if (!seed || typeof seed !== 'string' || seed.startsWith('track-')) return
    setLoadingSimilar(true)
    try {
      const res = await fetch(`/api/similar-tracks?seed=${encodeURIComponent(seed)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch similar')
      const parentNode = nodes.find((n) => n.id === track.id)
      const parentPos = parentNode?.position ?? [0, 0, 0]
      const newNodes = []
      const newLinks = []
      const tracks = (data.tracks ?? []).slice(0, 5)
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i]
        const existing = nodes.find((n) => n.id === t.id)
        if (existing) continue
        const pos = t.features
          ? positionFromFeatures(t.features, parentPos, i)
          : [
              parentPos[0] + (Math.random() - 0.5) * CLUSTER_OFFSET * 2,
              parentPos[1] + (Math.random() - 0.5) * CLUSTER_OFFSET * 2,
              parentPos[2] + (Math.random() - 0.5) * CLUSTER_OFFSET * 2,
            ]
        const newPos = [
          parentPos[0] + (Math.random() - 0.5) * 2,
          parentPos[1] + (Math.random() - 0.5) * 2,
          parentPos[2] + (Math.random() - 0.5) * 2,
        ]
        newNodes.push({
          id: t.id,
          title: t.title,
          artist: t.artist,
          artistId: t.artistId,
          artistImage: t.image,
          previewUrl: t.previewUrl,
          spotifyId: t.id,
          audioFeatures: t.features,
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
    }
  }, [nodes])

  const handleNodeClick = useCallback(
    (track) => {
      if (track === null) {
        setSelectedTrack(null)
        return
      }
      setSelectedTrack(track)
      fetchSimilar(track)
    },
    [fetchSimilar]
  )

  if (!initialTrack && nodes.length === 0) {
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
        onPointerMissed={() => setSelectedTrack(null)}
      >
        <color attach="background" args={[dark ? '#0a0a0a' : '#0f0f0f']} />
        <CameraControls
          ref={controlsRef}
          makeDefault
          minDistance={2}
          maxDistance={20}
          smoothTime={0.5}
        />
        <CameraPresetController preset={cameraPreset} controlsRef={controlsRef} />
        <Scene
          nodes={nodes}
          links={links}
          selectedTrack={selectedTrack}
          onSelectTrack={handleNodeClick}
          hoveredTrack={hoveredTrack}
          onHover={setHoveredTrack}
          onUnhover={() => setHoveredTrack(null)}
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
