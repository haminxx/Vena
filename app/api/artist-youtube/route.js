import { NextResponse } from 'next/server'
import YTMusic from 'ytmusic-api'

/**
 * GET /api/artist-youtube?videoId=... OR ?artist=...&track=...
 * Returns artist info and popular/related tracks from YouTube Music for the popup card.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')?.trim()
    const artist = searchParams.get('artist')?.trim()
    const track = searchParams.get('track')?.trim()

    if (!videoId && !artist && !track) {
      return NextResponse.json({ error: 'Missing videoId or artist/track' }, { status: 400 })
    }

    const ytmusic = new YTMusic()
    await ytmusic.initialize()

    let resolvedVideoId = videoId
    let artistName = artist ?? ''
    let imageUrl = null

    if (!resolvedVideoId) {
      const searchQuery = [track, artist].filter(Boolean).join(' ')
      const results = await ytmusic.search(searchQuery)
      const first = Array.isArray(results) ? results[0] : null
      resolvedVideoId = first?.videoId ?? first?.id ?? null
      if (first) {
        const ar = first.artist ?? first.artists?.[0]
        artistName = artistName || (typeof ar === 'string' ? ar : ar?.name ?? '')
        imageUrl = first.thumbnails?.[0]?.url ?? (resolvedVideoId ? `https://img.youtube.com/vi/${resolvedVideoId}/mqdefault.jpg` : null)
      }
    }

    const toArtistStr = (v) => {
      if (v == null) return ''
      if (typeof v === 'string') return v
      if (typeof v === 'object' && v?.name) return String(v.name)
      return ''
    }

    let popularTracks = []

    if (resolvedVideoId) {
      const upNexts = await ytmusic.getUpNexts(resolvedVideoId)
      const items = Array.isArray(upNexts) ? upNexts.slice(0, 8) : []
      popularTracks = items.map((r) => {
        const artistRaw = r.artists ?? r.artist ?? (Array.isArray(r.artists) ? r.artists[0] : null)
        return {
          id: r.videoId ?? r.id,
          videoId: r.videoId ?? r.id,
          name: r.title ?? r.name ?? '',
          artist: toArtistStr(artistRaw),
          thumbnail: r.thumbnails?.[0]?.url ?? (r.videoId ? `https://img.youtube.com/vi/${r.videoId}/mqdefault.jpg` : null),
        }
      })
      if (!imageUrl && items[0]) {
        imageUrl = items[0].thumbnails?.[0]?.url ?? (resolvedVideoId ? `https://img.youtube.com/vi/${resolvedVideoId}/mqdefault.jpg` : null)
      }
    }

    return NextResponse.json({
      artistName: artistName || 'Unknown Artist',
      genres: [],
      popularTracks,
      imageLarge: imageUrl,
      image: imageUrl,
    })
  } catch (err) {
    console.error('[artist-youtube]', err)
    return NextResponse.json({ artistName: '', genres: [], popularTracks: [], imageLarge: null })
  }
}
