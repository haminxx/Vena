import { NextResponse } from 'next/server'
import YTMusic from 'ytmusic-api'

/**
 * GET /api/related-tracks?videoId=... OR ?search=...
 * Returns YouTube "Up Next" / related tracks for the digging graph expansion.
 * Uses ytmusic-api getUpNexts(videoId) for obscure/similar discovery.
 *
 * When videoId is provided: fetches related directly.
 * When only search (title+artist) is provided: searches YouTube first to get videoId, then fetches related.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')?.trim()
    const search = searchParams.get('search')?.trim()

    if (!videoId && !search) {
      return NextResponse.json({ error: 'Missing videoId or search' }, { status: 400 })
    }

    const ytmusic = new YTMusic()
    await ytmusic.initialize()

    let resolvedVideoId = videoId

    if (!resolvedVideoId && search) {
      const results = await ytmusic.search(search)
      const first = Array.isArray(results) ? results[0] : null
      resolvedVideoId = first?.videoId ?? first?.id ?? null
    }

    if (!resolvedVideoId) {
      return NextResponse.json({ error: 'Could not find track on YouTube', tracks: [] })
    }

    const upNexts = await ytmusic.getUpNexts(resolvedVideoId)
    const items = Array.isArray(upNexts) ? upNexts.slice(0, 5) : []

    const toArtistStr = (v) => {
      if (v == null) return ''
      if (typeof v === 'string') return v
      if (typeof v === 'object' && v?.name) return String(v.name)
      return ''
    }

    const tracks = items.map((r) => {
      const artistRaw = r.artists ?? r.artist ?? (Array.isArray(r.artists) ? r.artists[0] : null)
      const artist = toArtistStr(artistRaw)
      const thumb = r.thumbnails?.[0]?.url ?? (r.videoId ? `https://img.youtube.com/vi/${r.videoId}/mqdefault.jpg` : null)
      return {
        id: r.videoId ?? `yt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        videoId: r.videoId ?? r.id,
        title: r.title ?? r.name ?? '',
        artist,
        artistImage: thumb,
        thumbnail: thumb,
        spotifyId: null,
        audioFeatures: null,
      }
    })

    return NextResponse.json({ tracks })
  } catch (err) {
    console.error('[related-tracks]', err)
    return NextResponse.json({ error: err.message ?? 'Failed to fetch related', tracks: [] })
  }
}
