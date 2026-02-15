'use client'

import { Line, Html, Billboard } from '@react-three/drei'

const AXIS_LENGTH = 1000
const LABEL_OFFSET = 2

const labelStyle = {
  fontSize: '10px',
  fontWeight: 500,
  color: 'rgba(180,180,180,0.85)',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
}

/**
 * SolidWorks-style axis line: X=Red, Y=Green, Z=Blue, subtle and thin.
 */
function AxisLine({ start, end, color }) {
  return (
    <Line
      points={[start, end]}
      color={color}
      lineWidth={0.8}
      transparent
      opacity={0.3}
    />
  )
}

/**
 * CAD-style infinite axes: long lines (1000 units), RGB colors, labels at axis ends.
 */
export default function AxisGuides() {
  const L = AXIS_LENGTH

  return (
    <group>
      {/* X Axis: Red - labels at far ends only (no center labels) */}
      <AxisLine start={[-L, 0, 0]} end={[L, 0, 0]} color="#e53935" />
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Html position={[L + LABEL_OFFSET, 0, 0]} center style={labelStyle}>
          <span>Orchestral</span>
        </Html>
      </Billboard>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Html position={[-L - LABEL_OFFSET, 0, 0]} center style={labelStyle}>
          <span>Organic</span>
        </Html>
      </Billboard>

      {/* Y Axis: Green */}
      <AxisLine start={[0, -L, 0]} end={[0, L, 0]} color="#43a047" />
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Html position={[0, -L - LABEL_OFFSET, 0]} center style={labelStyle}>
          <span>Slower</span>
        </Html>
      </Billboard>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Html position={[0, L + LABEL_OFFSET, 0]} center style={labelStyle}>
          <span>Faster</span>
        </Html>
      </Billboard>

      {/* Z Axis: Blue */}
      <AxisLine start={[0, 0, -L]} end={[0, 0, L]} color="#1e88e5" />
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Html position={[0, 0, L + LABEL_OFFSET]} center style={labelStyle}>
          <span>Ethereal</span>
        </Html>
      </Billboard>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Html position={[0, 0, -L - LABEL_OFFSET]} center style={labelStyle}>
          <span>Epic</span>
        </Html>
      </Billboard>
    </group>
  )
}
