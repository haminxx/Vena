import { NextResponse } from 'next/server'
import YTMusic from 'ytmusic-api'

/**
 * GET /api/search-suggestions?q=...
 * Returns first 8 song results from YouTube Music for autocomplete.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const ytmusic = new YTMusic()
    await ytmusic.initialize()
    const results = await ytmusic.search(q)
    const toArtistStr = (v) => {
      if (v == null) return ''
      if (typeof v === 'string') return v
      if (typeof v === 'object' && v?.name) return String(v.name)
      return ''
    }
    const items = (Array.isArray(results) ? results : []).slice(0, 8).map((r) => {
      const artistRaw = r.artist ?? r.artists?.[0] ?? r.author
      const artist = toArtistStr(artistRaw)
      const title = r.title ?? r.name ?? ''
      return {
        title,
        artist,
        videoId: r.videoId ?? r.id,
        query: [title, artist].filter(Boolean).join(' '),
      }
    })

    return NextResponse.json({ results: items })
  } catch (err) {
    console.error('[search-suggestions]', err)
    return NextResponse.json({ results: [] })
  }
}
