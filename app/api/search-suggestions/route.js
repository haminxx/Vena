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
    const items = (Array.isArray(results) ? results : []).slice(0, 8).map((r) => ({
      title: r.title ?? r.name ?? '',
      artist: r.artist ?? r.artists?.[0]?.name ?? r.author ?? '',
      videoId: r.videoId ?? r.id,
      query: [r.title ?? r.name, r.artist ?? r.artists?.[0]?.name ?? r.author].filter(Boolean).join(' '),
    }))

    return NextResponse.json({ results: items })
  } catch (err) {
    console.error('[search-suggestions]', err)
    return NextResponse.json({ results: [] })
  }
}
