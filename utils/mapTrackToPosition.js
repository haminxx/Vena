/**
 * Maps Spotify Audio Features to 3D coordinates inside a unit cube [-1, 1].
 *
 * Y (Vertical): BPM Scale
 *   +1 = Fast (high tempo), -1 = Slow (low tempo)
 *
 * X (Horizontal): Texture Scale
 *   -1 = Organic (high acousticness), +1 = Orchestral/Electronic (high instrumentalness)
 *
 * Z (Depth): Mood Scale
 *   +1 = Ethereal (high valence + low energy), -1 = Epic (high energy + high loudness)
 */

const BPM_MIN = 60
const BPM_MAX = 200
const LOUDNESS_MIN = -60
const LOUDNESS_MAX = 0

/**
 * @param {Object} features - Spotify audio features
 * @param {number} features.tempo - BPM (60-200 typical)
 * @param {number} features.acousticness - 0-1
 * @param {number} features.instrumentalness - 0-1
 * @param {number} features.valence - 0-1 (happiness)
 * @param {number} features.energy - 0-1
 * @param {number} features.loudness - dB (-60 to 0)
 * @returns {{ x: number, y: number, z: number }}
 */
export function mapTrackToPosition(features) {
  if (!features) {
    return { x: 0, y: 0, z: 0 }
  }

  const { tempo = 120, acousticness = 0.5, instrumentalness = 0.5, valence = 0.5, energy = 0.5, loudness = -10 } = features

  // Y: BPM (tempo) - normalize to [-1, 1]
  const y = Math.max(-1, Math.min(1, ((tempo - BPM_MIN) / (BPM_MAX - BPM_MIN)) * 2 - 1))

  // X: Organic (-1) vs Orchestral (+1)
  // Organic = high acousticness (left), Orchestral = high instrumentalness (right)
  const organicScore = acousticness
  const orchestralScore = instrumentalness
  const x = orchestralScore - organicScore

  // Z: Ethereal (+1) vs Epic (-1)
  // Ethereal = high valence + low energy
  // Epic = high energy + high loudness
  const etherealScore = valence * (1 - energy)
  const epicScore = energy * ((loudness - LOUDNESS_MIN) / (LOUDNESS_MAX - LOUDNESS_MIN))
  const z = etherealScore - epicScore

  return {
    x: Math.max(-1, Math.min(1, x)),
    y: Math.max(-1, Math.min(1, y)),
    z: Math.max(-1, Math.min(1, z)),
  }
}
