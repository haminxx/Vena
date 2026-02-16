import { NextResponse } from 'next/server'
import YTMusic from 'ytmusic-api'

const toArtistStr = (v) => {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v?.name) return String(v.name)
  return ''
}

/**
 * GET /api/artist-youtube?videoId=... OR ?artist=...&track=...
 * Returns artist info, genre keywords, and popular/related tracks from YouTube Music.
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
    let artistId = null

    if (!resolvedVideoId || !artistId) {
      const searchQuery = [track, artist].filter(Boolean).join(' ')
      if (searchQuery) {
        const results = await ytmusic.search(searchQuery)
        const first = Array.isArray(results) ? results[0] : null
        if (!resolvedVideoId) resolvedVideoId = first?.videoId ?? first?.id ?? null
        if (first) {
          const ar = first.artist ?? first.artists ?? (Array.isArray(first.artists) ? first.artists[0] : null)
          artistName = artistName || (typeof ar === 'string' ? ar : ar?.name ?? '')
          if (!artistId && typeof ar === 'object' && ar?.artistId) artistId = ar.artistId
          if (!imageUrl) imageUrl = first.thumbnails?.[0]?.url ?? (resolvedVideoId ? `https://img.youtube.com/vi/${resolvedVideoId}/mqdefault.jpg` : null)
        }
      }
    }

    let popularTracks = []
    let genres = []

    // Try getArtist for richer data (image, topSongs) when we have artistId
    if (artistId) {
      try {
        const artistData = await ytmusic.getArtist(artistId)
        if (artistData?.thumbnails?.length > 0) {
          const best = artistData.thumbnails.find((t) => t.width >= 200) ?? artistData.thumbnails[0]
          imageUrl = best?.url ?? imageUrl
        }
        const topSongs = artistData?.topSongs ?? []
        if (topSongs.length > 0) {
          popularTracks = topSongs.slice(0, 8).map((r) => ({
            id: r.videoId ?? r.id,
            videoId: r.videoId ?? r.id,
            name: r.name ?? r.title ?? '',
            artist: toArtistStr(r.artist),
            thumbnail: r.thumbnails?.[0]?.url ?? (r.videoId ? `https://img.youtube.com/vi/${r.videoId}/mqdefault.jpg` : null),
          }))
        }
      } catch (_) { /* fallback to getUpNexts */ }
    }

    // Fallback: use getUpNexts for popular tracks
    if (popularTracks.length === 0 && resolvedVideoId) {
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

    // Try getVideo for tags (genre-like keywords)
    if (resolvedVideoId) {
      try {
        const videoData = await ytmusic.getVideo(resolvedVideoId)
        const tags = videoData?.tags ?? []
        if (Array.isArray(tags) && tags.length > 0) {
          genres = tags.filter((t) => typeof t === 'string' && t.length > 0).slice(0, 5)
        }
      } catch (_) { /* ignore */ }
    }

    return NextResponse.json({
      artistName: artistName || 'Unknown Artist',
      genres,
      popularTracks,
      imageLarge: imageUrl,
      image: imageUrl,
    })
  } catch (err) {
    console.error('[artist-youtube]', err)
    return NextResponse.json({ artistName: '', genres: [], popularTracks: [], imageLarge: null })
  }
}
