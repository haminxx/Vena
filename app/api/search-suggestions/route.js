import { NextResponse } from 'next/server'

/**
 * GET /api/search-suggestions?q=...
 * Returns Spotify search results (tracks + artists) for autocomplete.
 * Uses Spotify Web API /search with type=track,artist, limit=5.
 *
 * Requires env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.json({ results: [] })
    }

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.json({ results: [] })
    }

    const { access_token } = await tokenRes.json()

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track,artist&limit=5`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )

    if (!searchRes.ok) {
      return NextResponse.json({ results: [] })
    }

    const data = await searchRes.json()
    const tracks = data.tracks?.items ?? []
    const artists = data.artists?.items ?? []

    const results = []

    for (const t of tracks.slice(0, 5)) {
      const artistName = t.artists?.[0]?.name ?? ''
      results.push({
        type: 'track',
        spotifyId: t.id,
        title: t.name,
        artist: artistName,
        artistId: t.artists?.[0]?.id ?? null,
        thumbnail: t.album?.images?.[0]?.url ?? null,
        query: [t.name, artistName].filter(Boolean).join(' '),
      })
    }

    for (const a of artists.slice(0, 3)) {
      if (results.length >= 5) break
      results.push({
        type: 'artist',
        spotifyId: a.id,
        title: a.name,
        artist: null,
        artistId: a.id,
        thumbnail: a.images?.[0]?.url ?? null,
        query: a.name,
      })
    }

    return NextResponse.json({ results: results.slice(0, 5) })
  } catch (err) {
    console.error('[search-suggestions]', err)
    return NextResponse.json({ results: [] })
  }
}
