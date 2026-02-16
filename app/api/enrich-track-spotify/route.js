import { NextResponse } from 'next/server'

/**
 * GET /api/enrich-track-spotify?artist=...&track=...
 * Searches Spotify for the track and returns spotifyId for saved track enrichment.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const artist = searchParams.get('artist')?.trim()
    const track = searchParams.get('track')?.trim()

    if (!artist && !track) {
      return NextResponse.json({ spotifyId: null }, { status: 400 })
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.json({ spotifyId: null })
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

    if (!tokenRes.ok) return NextResponse.json({ spotifyId: null })

    const { access_token } = await tokenRes.json()
    const headers = { Authorization: `Bearer ${access_token}` }

    const query = [track, artist].filter(Boolean).join(' ')
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(query)}&limit=3`,
      { headers }
    )

    if (!searchRes.ok) return NextResponse.json({ spotifyId: null })

    const data = await searchRes.json()
    const first = data.tracks?.items?.[0]
    const spotifyId = first?.id ?? null

    return NextResponse.json({ spotifyId })
  } catch (err) {
    console.error('[enrich-track-spotify]', err)
    return NextResponse.json({ spotifyId: null })
  }
}
