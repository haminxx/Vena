'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'

const NODE_RADIUS = 0.5
const HOVER_SCALE = 1.2
const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="%23a78bfa" width="64" height="64"/><text x="32" y="38" font-size="24" fill="white" text-anchor="middle" font-family="sans-serif">?</text></svg>'
)

const POPUP_WIDTH = 'w-[200px]'

/**
 * 3D node: perfect circle with album art texture, always faces camera (Billboard).
 * Uses CircleGeometry for circular shape. 50% smaller default size.
 */
const PULSE_SCALE = 1.5
const PULSE_DECAY = 0.25

export default function DiggingNode({
  track,
  isHovered,
  isSelected,
  onClick,
  onPointerOver,
  onPointerOut,
  onExtractColor,
  isActiveNode,
  lastTriggerTime,
}) {
  if (!track) return null
  const groupRef = useRef()
  const [texture, setTexture] = useState(null)
  const textureRef = useRef(null)
  const pulseRef = useRef(0)
  const baseScale = isHovered ? HOVER_SCALE : 1
  const targetScale = Math.max(baseScale, pulseRef.current)

  // Prioritize Spotify artist.images: [2]=small for node, [0]=large for card
  const imageUrl = track.artistImageSmall ?? track.artistImage ?? track.artistImageLarge ?? track.albumImageMedium ?? track.albumImage ?? track.albumImageLowRes ?? track.image ?? FALLBACK_IMAGE
  const songTitle = track.title ?? 'Song'
  const artistName = typeof track.artist === 'string' ? track.artist : (track.artist?.name ?? 'Artist')

  useEffect(() => {
    if (isActiveNode && lastTriggerTime) {
      pulseRef.current = PULSE_SCALE
    }
  }, [isActiveNode, lastTriggerTime])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const s = Number(pulseRef.current)
    const b = Number(baseScale)
    if (!Number.isFinite(s)) pulseRef.current = 0
    if (!Number.isFinite(b)) return
    if (pulseRef.current > baseScale) {
      pulseRef.current = Math.max(baseScale, pulseRef.current - PULSE_DECAY * delta * 10)
    }
    const scale = Math.max(baseScale, pulseRef.current)
    if (!Number.isFinite(scale)) return
    groupRef.current.scale.lerp(
      new THREE.Vector3(scale, scale, scale),
      0.15
    )
  })

  useEffect(() => {
    if (!imageUrl) return
    const loader = new THREE.TextureLoader()
    loader.load(
      imageUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        const img = tex.image
        if (img?.width && img?.height) {
          const w = img.width
          const h = img.height
          const aspect = w / h
          if (Math.abs(aspect - 1) > 0.01) {
            tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
            if (aspect > 1) {
              tex.repeat.set(1 / aspect, 1)
              tex.offset.set((1 - 1 / aspect) / 2, 0)
            } else {
              tex.repeat.set(1, aspect)
              tex.offset.set(0, (1 - aspect) / 2)
            }
          }
        }
        textureRef.current = tex
        setTexture(tex)
      },
      undefined,
      () => setTexture(null)
    )
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }
    }
  }, [imageUrl])

  useEffect(() => {
    if (!(isHovered || isSelected) || !imageUrl || !onExtractColor) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      import('colorthief').then(({ default: ColorThief }) => {
        try {
          const colorThief = new ColorThief()
          const [r, g, b] = colorThief.getColor(img)
          const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
          onExtractColor(hex)
        } catch {
          onExtractColor(null)
        }
      }).catch(() => onExtractColor(null))
    }
    img.onerror = () => onExtractColor(null)
    img.src = imageUrl
  }, [isHovered, isSelected, imageUrl, onExtractColor])

  const eventHandlers = {
    onClick: (e) => { e.stopPropagation(); onClick(track) },
    onPointerOver: (e) => {
      e.stopPropagation()
      document.body.style.cursor = 'pointer'
      onPointerOver(track)
    },
    onPointerOut: (e) => {
      e.stopPropagation()
      document.body.style.cursor = 'default'
      onPointerOut()
    },
  }

  return (
    <group ref={groupRef}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <mesh {...eventHandlers} renderOrder={1} frustumCulled={false}>
          <circleGeometry args={[NODE_RADIUS, 32]} />
          {texture ? (
            <meshBasicMaterial
              map={texture}
              color="#ffffff"
              transparent
              opacity={1}
              side={THREE.DoubleSide}
              depthWrite={true}
            />
          ) : (
            <meshBasicMaterial
              color="#1DB954"
              transparent={false}
              side={THREE.DoubleSide}
              depthWrite={true}
            />
          )}
        </mesh>
      </Billboard>
      {isHovered && !isSelected && (
        <Html
          position={[0, NODE_RADIUS + 0.2, 0]}
          center
          style={{ pointerEvents: 'none', textAlign: 'center', width: 200 }}
          className={POPUP_WIDTH}
        >
          <div
            className={`${POPUP_WIDTH} rounded-lg px-3 py-2 bg-black/70 backdrop-blur-md border border-white/10`}
            style={{
              whiteSpace: 'nowrap',
              fontSize: '11px',
              fontWeight: 600,
              color: 'white',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}
          >
            <div className="block mb-0.5 truncate">{songTitle}</div>
            <div className="text-[10px] font-normal opacity-90 truncate">{artistName}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

export { NODE_RADIUS, POPUP_WIDTH }
