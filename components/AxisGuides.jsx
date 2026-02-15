'use client'

import { Line, Html, Billboard } from '@react-three/drei'

const AXIS_LENGTH = 10
const LABEL_OFFSET = 0.5

const labelStyle = {
  fontSize: '11px',
  fontWeight: 500,
  color: 'rgba(150,150,150,0.9)',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
}

/**
 * Dashed axis line using drei Line with dashed prop
 */
function DashedAxisLine({ start, end, color = '#666' }) {
  return (
    <Line
      points={[start, end]}
      color={color}
      dashed
      dashScale={1}
      dashSize={0.3}
      gapSize={0.2}
      transparent
      opacity={0.5}
    />
  )
}

/**
 * 3D axis guides with dashed lines and billboarded labels.
 * X: Organic (left) / Orchestral (right)
 * Y: Slower (bottom) / Faster (top)
 * Z: Epic (back) / Ethereal (front)
 */
export default function AxisGuides() {
  return (
    <group>
      {/* X Axis: no labels - center clean */}
      <DashedAxisLine start={[-AXIS_LENGTH, 0, 0]} end={[AXIS_LENGTH, 0, 0]} color="#888" />

      {/* Y Axis: Slower (-) to Faster (+) */}
      <DashedAxisLine start={[0, -AXIS_LENGTH, 0]} end={[0, AXIS_LENGTH, 0]} color="#888" />
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Html position={[0, -AXIS_LENGTH - LABEL_OFFSET, 0]} center style={labelStyle}>
          <span>Slower</span>
        </Html>
      </Billboard>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Html position={[0, AXIS_LENGTH + LABEL_OFFSET, 0]} center style={labelStyle}>
          <span>Faster</span>
        </Html>
      </Billboard>

      {/* Z Axis: no labels - center clean */}
      <DashedAxisLine start={[0, 0, -AXIS_LENGTH]} end={[0, 0, AXIS_LENGTH]} color="#888" />
    </group>
  )
}
