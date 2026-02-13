/**
 * Parses search query for mood/instrument keywords and maps to Spotify audio feature targets.
 * Used for metadata-aware search (e.g. "Sad Piano" → low valence, high acousticness)
 */

const MOOD_KEYWORDS = {
  sad: { valence: 0.2 },
  happy: { valence: 0.9 },
  energetic: { energy: 0.9 },
  calm: { energy: 0.2 },
  ethereal: { valence: 0.7, energy: 0.3 },
  epic: { energy: 0.9 },
  dark: { valence: 0.2, energy: 0.5 },
  upbeat: { valence: 0.8, energy: 0.8 },
}

const INSTRUMENT_KEYWORDS = {
  piano: { acousticness: 0.8 },
  acoustic: { acousticness: 0.9 },
  electronic: { instrumentalness: 0.7, acousticness: 0.1 },
  orchestral: { instrumentalness: 0.9 },
  vocal: { instrumentalness: 0.1 },
}

/**
 * @param {string} query - e.g. "Sad Piano" or "Daft Punk"
 * @returns {{ cleanQuery: string, filters: Record<string, number> }}
 */
export function parseSearchMetadata(query) {
  if (!query || typeof query !== 'string') {
    return { cleanQuery: '', filters: {} }
  }

  const words = query.toLowerCase().split(/\s+/)
  const filters = {}

  for (const word of words) {
    for (const [key, vals] of Object.entries(MOOD_KEYWORDS)) {
      if (word.includes(key)) {
        Object.assign(filters, vals)
        break
      }
    }
    for (const [key, vals] of Object.entries(INSTRUMENT_KEYWORDS)) {
      if (word.includes(key)) {
        Object.assign(filters, vals)
        break
      }
    }
  }

  return {
    cleanQuery: query.trim(),
    filters,
  }
}
