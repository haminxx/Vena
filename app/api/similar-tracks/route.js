import { NextResponse } from 'next/server'

/**
 * GET /api/similar-tracks?seed=spotify_track_id
 * Returns Spotify recommendations based on seed track.
 * Requires SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const seed = searchParams.get('seed')
    if (!seed) {
      return NextResponse.json({ error: 'Missing seed track ID' }, { status: 400 })
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

    const recRes = await fetch(
      `https://api.spotify.com/v1/recommendations?seed_tracks=${seed}&limit=10`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )

    if (!recRes.ok) {
      return NextResponse.json({ error: 'Recommendations failed' }, { status: 502 })
    }

    const rec = await recRes.json()
    const tracks = rec.tracks ?? []

    const ids = tracks.map((t) => t.id).filter(Boolean).join(',')
    if (!ids) {
      return NextResponse.json({ tracks: [], features: {} })
    }

    const featuresRes = await fetch(
      `https://api.spotify.com/v1/audio-features?ids=${ids}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )

    const featuresData = featuresRes.ok ? await featuresRes.json() : { audio_features: [] }
    const featuresMap = {}
    for (const f of featuresData.audio_features ?? []) {
      if (f?.id) featuresMap[f.id] = f
    }

    const result = tracks.map((t) => ({
      id: t.id,
      title: t.name,
      artist: t.artists?.[0]?.name ?? '',
      artistId: t.artists?.[0]?.id,
      previewUrl: t.preview_url,
      image: t.album?.images?.[0]?.url,
      features: featuresMap[t.id] ?? null,
    }))

    return NextResponse.json({ tracks: result })
  } catch (err) {
    console.error('[similar-tracks]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
