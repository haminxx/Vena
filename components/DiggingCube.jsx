'use client'

import { useRef, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Billboard, Line } from '@react-three/drei'
import * as THREE from 'three'
import { mapTrackToPosition } from '@/utils/mapTrackToPosition'
import { Play, X, ArrowLeft } from 'lucide-react'

const CUBE_SIZE = 6
const NODE_RADIUS = 0.15
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

function TrackNode({ track, isHovered, isSelected, onClick, onPointerOver, onPointerOut }) {
  const meshRef = useRef()
  const scale = isHovered ? 1.5 : 1
  const color = isHovered ? '#00ffff' : '#a78bfa'

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15)
    }
  })

  const pos = Array.isArray(track.position) ? track.position : [0, 0, 0]

  return (
    <group position={pos}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(track) }}
        onPointerOver={(e) => { e.stopPropagation(); onPointerOver(track) }}
        onPointerOut={(e) => { e.stopPropagation(); onPointerOut() }}
      >
        <sphereGeometry args={[NODE_RADIUS, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.8 : 0.4}
        />
      </mesh>
      {isSelected && (
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <Html
            transform
            position={[0, NODE_RADIUS + 0.3, 0]}
            center
            style={{ pointerEvents: 'auto' }}
          >
            <TrackDetailCard track={track} onClose={() => onClick(null)} />
          </Html>
        </Billboard>
      )}
    </group>
  )
}

function TrackDetailCard({ track, onClose }) {
  const [playing, setPlaying] = useState(null)
  const audioRef = useRef(null)

  const handlePlay = (url) => {
    if (!url) return
    if (playing === url && audioRef.current) {
      audioRef.current.pause()
      setPlaying(null)
      return
    }
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(url)
    audioRef.current = audio
    audio.play()
    setPlaying(url)
    audio.onended = () => setPlaying(null)
  }

  const topTracks = track.topTracks ?? []

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative bg-white rounded-lg shadow-xl border border-gray-200 min-w-[220px] overflow-hidden"
      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
    >
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white"
      />
      <div className="p-4 pt-5">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 text-gray-400"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-3">
          <img
            src={track.artistImage || `https://i.pravatar.cc/80?u=${track.id}`}
            alt={track.artist}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{track.artist}</p>
            <p className="text-sm text-gray-500 truncate">{track.title}</p>
          </div>
        </div>
        {topTracks.length > 0 && (
          <>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Top Tracks</p>
            <ul className="space-y-1.5">
              {topTracks.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-700 truncate flex-1">{t.name}</span>
                  <button
                    onClick={() => handlePlay(t.preview)}
                    disabled={!t.preview}
                    className={`p-1.5 rounded-full ${t.preview ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-300'}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

function CameraPresetController({ preset }) {
  const { camera } = useThree()
  const prevPreset = useRef(preset)

  if (prevPreset.current !== preset) {
    prevPreset.current = preset
    const { position, target } = CAMERA_PRESETS[preset]
    camera.position.set(...position)
    camera.lookAt(...target)
  }

  return null
}

function WireframeCube({ size }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size)), [size])
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#333" />
    </lineSegments>
  )
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

      <WireframeCube size={CUBE_SIZE} />

      {links.map((link, i) => (
        <Line
          key={i}
          points={[link.from, link.to]}
          color="#555"
          lineWidth={1}
        />
      ))}

      {nodes.map((track) => (
        <TrackNode
          key={track.id}
          track={track}
          isHovered={hoveredTrack?.id === track.id}
          isSelected={selectedTrack?.id === track.id}
          onClick={onSelectTrack}
          onPointerOver={onHover}
          onPointerOut={onUnhover}
        />
      ))}
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
      for (let i = 0; i < (data.tracks ?? []).length; i++) {
        const t = data.tracks[i]
        const existing = nodes.find((n) => n.id === t.id)
        if (existing) continue
        const pos = t.features
          ? positionFromFeatures(t.features, parentPos, i)
          : [
              parentPos[0] + (Math.random() - 0.5) * CLUSTER_OFFSET * 2,
              parentPos[1] + (Math.random() - 0.5) * CLUSTER_OFFSET * 2,
              parentPos[2] + (Math.random() - 0.5) * CLUSTER_OFFSET * 2,
            ]
        newNodes.push({
          id: t.id,
          title: t.title,
          artist: t.artist,
          artistImage: t.image,
          previewUrl: t.previewUrl,
          spotifyId: t.id,
          audioFeatures: t.features,
          position: pos,
          parentId: track.id,
          topTracks: [],
        })
        newLinks.push({ from: parentPos, to: pos })
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
        <CameraPresetController preset={cameraPreset} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={20}
        />
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
