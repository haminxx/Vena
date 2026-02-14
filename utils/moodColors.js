/**
 * Luxury palettes for the ambient mood background.
 * Maps keywords to arrays of 2 colors [primary, secondary].
 */
export const MOOD_PALETTES = {
  energetic: ['#4a0404', '#d4af37'],
  epic: ['#4a0404', '#d4af37'],
  ethereal: ['#2c3e50', '#8e44ad'],
  chill: ['#2c3e50', '#8e44ad'],
  organic: ['#1b4332', '#d8f3dc'],
  happy: ['#1b4332', '#d8f3dc'],
  dark: ['#000000', '#14213d'],
  sad: ['#000000', '#14213d'],
  indie: ['#2c3e50', '#8e44ad'],
  'lo-fi': ['#2c3e50', '#8e44ad'],
  ambient: ['#2c3e50', '#8e44ad'],
  rock: ['#4a0404', '#d4af37'],
  metal: ['#4a0404', '#000000'],
  pop: ['#1b4332', '#d8f3dc'],
  jazz: ['#1b4332', '#2c3e50'],
  classical: ['#2c3e50', '#d4af37'],
}

/** Default luxury dark (Onyx / Midnight) when idle */
export const DEFAULT_PALETTE = ['#0a0a0f', '#1a1a2e']

/**
 * @param {string[]} tags - Array of mood/genre keywords (e.g. ['indie', 'chill'])
 * @returns {[string, string]} - [color1, color2] palette
 */
export function getColorFromTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return DEFAULT_PALETTE
  const lower = tags.map((t) => String(t).toLowerCase())
  for (const [key, palette] of Object.entries(MOOD_PALETTES)) {
    if (lower.some((tag) => tag.includes(key) || key.includes(tag))) {
      return palette
    }
  }
  return DEFAULT_PALETTE
}

/**
 * Derive mood tags from Spotify audio features.
 * @param {Object} features - { valence, energy, loudness, acousticness, instrumentalness }
 * @returns {string[]} - Mood tags for getColorFromTags
 */
export function getMoodFromAudioFeatures(features) {
  if (!features) return []
  const { valence = 0.5, energy = 0.5, loudness = -10, acousticness = 0.5 } = features
  const tags = []
  if (energy > 0.7 && loudness > -8) tags.push('energetic', 'epic')
  else if (valence > 0.6 && energy < 0.4) tags.push('ethereal', 'chill')
  else if (acousticness > 0.6) tags.push('organic', 'happy')
  else if (valence < 0.3 && energy < 0.4) tags.push('dark', 'sad')
  return tags
}

/**
 * Get palette for a track (genres + audio features).
 * @param {Object} track - { genres?, audioFeatures? }
 * @returns {[string, string]}
 */
export function getPaletteForTrack(track) {
  if (!track) return DEFAULT_PALETTE
  const genreTags = track.genres ?? []
  const featureTags = getMoodFromAudioFeatures(track.audioFeatures)
  return getColorFromTags([...genreTags, ...featureTags])
}
