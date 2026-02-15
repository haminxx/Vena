/**
 * Maps Spotify Audio Features to 3D coordinates.
 * Normalized to distribute dots evenly inside bounding box [-15, -15, -15] to [15, 15, 15].
 *
 * Y-Axis (Tempo/Speed): 60-180 BPM → Y -10 (bottom) to +10 (top)
 * X-Axis (Organic vs Electronic): acousticness vs energy → Left (-X) vs Right (+X)
 * Z-Axis (Mood/Valence): High valence = Front (+Z), Low valence = Back (-Z)
 *
 * @param {Object} features - Spotify audio features
 * @param {number} features.tempo - BPM (60-180 typical)
 * @param {number} features.acousticness - 0-1 (organic)
 * @param {number} features.energy - 0-1 (electronic)
 * @param {number} features.valence - 0-1 (happy/sad)
 * @returns {{ x: number, y: number, z: number }}
 */
export function mapTrackToPosition(features) {
  if (!features) {
    return { x: 0, y: 0, z: 0 }
  }

  const {
    tempo = 120,
    acousticness = 0.5,
    energy = 0.5,
    valence = 0.5,
  } = features

  // Y-Axis: Tempo 60-180 → -10 to +10
  const clampedTempo = Math.max(60, Math.min(180, tempo))
  const y = ((clampedTempo - 60) / (180 - 60)) * 20 - 10

  // X-Axis: Organic (acousticness > 0.5) = Left (-X), Electronic (energy > 0.8) = Right (+X)
  // Combined: energy pushes right, acousticness pushes left
  let x = 0
  if (acousticness > 0.5) x -= (acousticness - 0.5) * 20
  if (energy > 0.8) x += (energy - 0.8) * 50
  if (x === 0) x = (energy - acousticness) * 10
  x = Math.max(-15, Math.min(15, x))

  // Z-Axis: Valence - High (>0.7) = Front (+Z), Low (<0.3) = Back (-Z)
  const z = (valence - 0.5) * 20
  const clampedZ = Math.max(-15, Math.min(15, z))

  return {
    x: Math.max(-15, Math.min(15, x)),
    y: Math.max(-10, Math.min(10, y)),
    z: clampedZ,
  }
}
