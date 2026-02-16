import { NextResponse } from 'next/server'

/**
 * GET /api/enrich-track-spotify?spotifyId=... OR ?artist=...&track=...
 * When spotifyId provided: direct lookup. Else: search by artist+track.
 * Returns spotifyId and previewUrl for saved track enrichment / play.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const spotifyIdParam = searchParams.get('spotifyId')?.trim()
    const artist = searchParams.get('artist')?.trim()
    const track = searchParams.get('track')?.trim()

    if (!spotifyIdParam && !artist && !track) {
      return NextResponse.json({ spotifyId: null, previewUrl: null }, { status: 400 })
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.json({ spotifyId: null, previewUrl: null })
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

    if (!tokenRes.ok) return NextResponse.json({ spotifyId: null, previewUrl: null })

    const { access_token } = await tokenRes.json()
    const headers = { Authorization: `Bearer ${access_token}` }

    if (spotifyIdParam) {
      const trackRes = await fetch(
        `https://api.spotify.com/v1/tracks/${spotifyIdParam}`,
        { headers }
      )
      if (!trackRes.ok) return NextResponse.json({ spotifyId: null, previewUrl: null })
      const t = await trackRes.json()
      return NextResponse.json({
        spotifyId: t?.id ?? null,
        previewUrl: t?.preview_url ?? null,
      })
    }

    const query = [track, artist].filter(Boolean).join(' ')
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(query)}&limit=5`,
      { headers }
    )

    if (!searchRes.ok) return NextResponse.json({ spotifyId: null, previewUrl: null })

    const data = await searchRes.json()
    const items = data.tracks?.items ?? []
    const withPreview = items.find((t) => t?.preview_url)
    const first = withPreview ?? items[0]
    const spotifyId = first?.id ?? null
    const previewUrl = first?.preview_url ?? null

    return NextResponse.json({ spotifyId, previewUrl })
  } catch (err) {
    console.error('[enrich-track-spotify]', err)
    return NextResponse.json({ spotifyId: null, previewUrl: null })
  }
}
