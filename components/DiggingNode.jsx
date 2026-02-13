'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const NODE_RADIUS = 0.15
const FALLBACK_COLOR = '#a78bfa'
const FALLBACK_COLOR_HOVER = '#00ffff'

/**
 * 3D node that displays the artist's profile picture as a texture on a sphere.
 * Falls back to a colored material if the image URL is missing or fails to load.
 */
export default function DiggingNode({
  track,
  isHovered,
  isSelected,
  onClick,
  onPointerOver,
  onPointerOut,
}) {
  const meshRef = useRef()
  const [texture, setTexture] = useState(null)
  const [textureError, setTextureError] = useState(false)

  const imageUrl = track.artistImage ?? track.image ?? null
  const scale = isHovered ? 1.5 : 1
  const color = isHovered ? FALLBACK_COLOR_HOVER : FALLBACK_COLOR

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15)
    }
  })

  const textureRef = useRef(null)
  useEffect(() => {
    setTextureError(false)
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
      () => setTextureError(true)
    )
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }
    }
  }, [imageUrl])

  return (
    <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(track) }}
        onPointerOver={(e) => { e.stopPropagation(); onPointerOver(track) }}
        onPointerOut={(e) => { e.stopPropagation(); onPointerOut() }}
      >
        <sphereGeometry args={[NODE_RADIUS, 32, 32]} />
        {texture ? (
          <meshStandardMaterial
            map={texture}
            emissive={isHovered ? color : '#333'}
            emissiveIntensity={isHovered ? 0.3 : 0.1}
          />
        ) : (
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isHovered ? 0.8 : 0.4}
          />
        )}
      </mesh>
  )
}

export { NODE_RADIUS }
