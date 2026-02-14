'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMoodBackground } from '@/context/MoodBackgroundContext'
import { DEFAULT_PALETTE } from '@/utils/moodColors'

const TRANSITION = { duration: 1.5, ease: 'easeInOut' }

/**
 * Luxurious mesh gradient background - 2-3 large blurred radial circles that drift.
 * Priority: hover > playing > idle (default Onyx/Midnight).
 */
export default function AmbientBackground() {
  const { hoverPalette, playingPalette } = useMoodBackground()

  const [color1, color2] = hoverPalette ?? playingPalette ?? DEFAULT_PALETTE

  const circles = useMemo(
    () => [
      { x: '20%', y: '30%', size: '80vmax', color: color1 },
      { x: '70%', y: '60%', size: '60vmax', color: color2 },
      { x: '50%', y: '80%', size: '50vmax', color: color1 },
    ],
    [color1, color2]
  )

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ zIndex: -1 }}
      aria-hidden
    >
      {circles.map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            left: c.x,
            top: c.y,
            width: c.size,
            height: c.size,
            filter: 'blur(100px)',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 15, 0],
            background: `radial-gradient(circle, ${c.color}80 0%, ${c.color}40 50%, transparent 70%)`,
          }}
          transition={{
            x: { duration: 15 + i * 2, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 18 + i * 3, repeat: Infinity, ease: 'easeInOut' },
            background: { duration: 1.5, ease: 'easeInOut' },
          }}
        />
      ))}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `linear-gradient(135deg, ${color1}22 0%, ${color2}11 50%, #0a0a0f 100%)`,
        }}
        transition={TRANSITION}
      />
    </div>
  )
}
