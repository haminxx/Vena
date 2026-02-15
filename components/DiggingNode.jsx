'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'

const NODE_RADIUS = 0.125
const HOVER_SCALE = 1.2
const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="%23a78bfa" width="64" height="64"/><text x="32" y="38" font-size="24" fill="white" text-anchor="middle" font-family="sans-serif">?</text></svg>'
)

const POPUP_WIDTH = 'w-[200px]'

/**
 * 3D node: perfect circle with album art texture, always faces camera (Billboard).
 * Uses CircleGeometry for circular shape. 50% smaller default size.
 */
export default function DiggingNode({
  track,
  isHovered,
  isSelected,
  onClick,
  onPointerOver,
  onPointerOut,
  onExtractColor,
}) {
  const groupRef = useRef()
  const [texture, setTexture] = useState(null)
  const textureRef = useRef(null)
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
        <mesh {...eventHandlers}>
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
