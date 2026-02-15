'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html, Image } from '@react-three/drei'
import * as THREE from 'three'

const NODE_RADIUS = 0.25
const HOVER_SCALE = 1.2
const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="%23a78bfa" width="64" height="64"/><text x="32" y="38" font-size="24" fill="white" text-anchor="middle" font-family="sans-serif">?</text></svg>'
)

/**
 * 3D node: album art using drei Image, always faces camera (Billboard).
 * Uses track.album.images[1] (medium) for performance.
 */
export default function DiggingNode({
  track,
  isHovered,
  isSelected,
  onClick,
  onPointerOver,
  onPointerOut,
}) {
  const groupRef = useRef()
  const targetScale = isHovered ? HOVER_SCALE : 1

  const imageUrl = track.albumImageMedium ?? track.albumImage ?? track.albumImageLowRes ?? track.artistImage ?? track.image ?? FALLBACK_IMAGE
  const songTitle = track.title ?? 'Song'
  const artistName = typeof track.artist === 'string' ? track.artist : (track.artist?.name ?? 'Artist')

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.15
      )
    }
  })

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
        <group {...eventHandlers}>
          <Image
            url={imageUrl}
            transparent
            scale={[2, 2]}
          />
        </group>
      </Billboard>
      {isHovered && !isSelected && (
        <Html
          position={[0, NODE_RADIUS + 0.15, 0]}
          center
          style={{ pointerEvents: 'none', textAlign: 'center' }}
        >
          <div
            style={{
              whiteSpace: 'nowrap',
              fontSize: '11px',
              fontWeight: 600,
              color: 'white',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'block', marginBottom: '2px' }}>{songTitle}</div>
            <div style={{ fontSize: '10px', fontWeight: 400, opacity: 0.9 }}>{artistName}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

export { NODE_RADIUS }
