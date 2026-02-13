'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'

const NODE_RADIUS = 0.25
const HOVER_SCALE = 1.2
const RING_RADIUS = 0.28
const RING_TUBE = 0.02
const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="%23a78bfa" width="64" height="64"/><text x="32" y="38" font-size="24" fill="white" text-anchor="middle" font-family="sans-serif">?</text></svg>'
)

/**
 * 3D node: circular "token" with artist image, always faces camera (Billboard).
 * Thin white Torus ring for "poker chip" / badge feel.
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
  const [texture, setTexture] = useState(null)
  const textureRef = useRef(null)
  const targetScale = isHovered ? HOVER_SCALE : 1

  const imageUrl = track.artistImage ?? track.image ?? FALLBACK_IMAGE
  const artistName = typeof track.artist === 'string' ? track.artist : (track.artist?.name ?? 'Artist')

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.15
      )
    }
  })

  // useTexture can fail on remote URLs (CORS); TextureLoader handles loading robustly
  useEffect(() => {
    if (!imageUrl) return
    const loader = new THREE.TextureLoader()
    loader.load(
      imageUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
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
          {/* Circular token with artist image */}
          <mesh>
            <circleGeometry args={[NODE_RADIUS, 32]} />
            {texture ? (
              <meshBasicMaterial
                map={texture}
                transparent
                side={THREE.DoubleSide}
              />
            ) : (
              <meshBasicMaterial
                color="#a78bfa"
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
              />
            )}
          </mesh>
          {/* Thin white ring - poker chip / badge feel */}
          <mesh>
            <torusGeometry args={[RING_RADIUS, RING_TUBE, 8, 32]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
        </group>
      </Billboard>
      {isHovered && !isSelected && (
        <Html
          position={[0, NODE_RADIUS + 0.15, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <span
            style={{
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
          </span>
        </Html>
      )}
    </group>
  )
}

export { NODE_RADIUS }
