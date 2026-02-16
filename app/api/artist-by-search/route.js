import { NextResponse } from 'next/server'

/**
 * GET /api/artist-by-search?artist=...&track=...
 * Fallback when artistId is missing: search Spotify for track, get artist, fetch details.
 * Returns same shape as /api/artist-details for ArtistCard compatibility.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const artist = searchParams.get('artist')?.trim()
    const track = searchParams.get('track')?.trim()

    if (!artist && !track) {
      return NextResponse.json({ error: 'Missing artist or track' }, { status: 400 })
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

    const query = [track, artist].filter(Boolean).join(' ')
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(query)}&limit=5`,
      { headers }
    )

    if (!searchRes.ok) {
      return NextResponse.json({ genres: [], topTracks: [], imageLarge: null })
    }

    const searchData = await searchRes.json()
    const tracks = searchData.tracks?.items ?? []
    const first = tracks[0]
    const artistId = first?.artists?.[0]?.id

    if (!artistId) {
      return NextResponse.json({ genres: [], topTracks: [], imageLarge: null })
    }

    const [artistRes, topTracksRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/artists/${artistId}`, { headers }),
      fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, { headers }),
    ])

    const artistData = artistRes.ok ? await artistRes.json() : null
    const topTracksData = topTracksRes.ok ? await topTracksRes.json() : { tracks: [] }

    const genres = artistData?.genres ?? []
    const topTracks = (topTracksData.tracks ?? []).slice(0, 5).map((t) => ({
      id: t.id,
      name: t.name,
      preview: t.preview_url,
    }))

    const imgs = artistData?.images ?? []
    const imageLarge = imgs[0]?.url ?? null

    return NextResponse.json({
      genres,
      topTracks,
      image: imageLarge,
      imageLarge,
      imageSmall: imgs[2]?.url ?? imgs[1]?.url ?? imgs[0]?.url ?? null,
    })
  } catch (err) {
    console.error('[artist-by-search]', err)
    return NextResponse.json({ genres: [], topTracks: [], imageLarge: null })
  }
}
