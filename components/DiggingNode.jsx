'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Image, Html } from '@react-three/drei'
import * as THREE from 'three'

const NODE_SCALE = 0.5
const HOVER_SCALE = 1.2
const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="%23a78bfa" width="64" height="64"/><text x="32" y="38" font-size="24" fill="white" text-anchor="middle" font-family="sans-serif">?</text></svg>'
)

/**
 * 3D node using drei's Image component - billboards toward camera, handles loading.
 * Hover: scale 1.2x, cursor pointer, tooltip only (no full card).
 * Click: handled by parent (opens Post Card + expands graph).
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

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.15
      )
    }
  })

  const imageUrl = track.artistImage ?? track.image ?? FALLBACK_IMAGE
  const artistName = typeof track.artist === 'string' ? track.artist : (track.artist?.name ?? 'Artist')

  return (
    <group ref={groupRef}>
      <Image
        url={imageUrl}
        transparent
        scale={[NODE_SCALE, NODE_SCALE]}
        onClick={(e) => { e.stopPropagation(); onClick(track) }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          onPointerOver(track)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'default'
          onPointerOut()
        }}
      />
      {isHovered && !isSelected && (
        <Html
          position={[0, NODE_SCALE / 2 + 0.15, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            fontSize: '12px',
            fontWeight: 600,
            color: 'white',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        >
          {artistName}
        </Html>
      )}
    </group>
  )
}

export { NODE_SCALE as NODE_RADIUS }
