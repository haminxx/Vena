import { NextResponse } from 'next/server'

/**
 * GET /api/artist-details?artistId=spotify_artist_id
 * Returns artist genres and top tracks for the Artist Post Card.
 * Requires SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('artistId')
    if (!artistId) {
      return NextResponse.json({ error: 'Missing artistId' }, { status: 400 })
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Spotify credentials not configured' },
        { status: 500 }
      )
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
      return NextResponse.json({ error: 'Spotify auth failed' }, { status: 502 })
    }

    const { access_token } = await tokenRes.json()
    const headers = { Authorization: `Bearer ${access_token}` }

    const [artistRes, topTracksRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/artists/${artistId}`, { headers }),
      fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, { headers }),
    ])

    const artist = artistRes.ok ? await artistRes.json() : null
    const topTracksData = topTracksRes.ok ? await topTracksRes.json() : { tracks: [] }

    const genres = artist?.genres ?? []
    const topTracks = (topTracksData.tracks ?? []).slice(0, 5).map((t) => ({
      id: t.id,
      name: t.name,
      preview: t.preview_url,
    }))

    return NextResponse.json({
      genres,
      topTracks,
      image: artist?.images?.[0]?.url ?? null,
    })
  } catch (err) {
    console.error('[artist-details]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
