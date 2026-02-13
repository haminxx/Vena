import { NextResponse } from 'next/server'
import YTMusic from 'ytmusic-api'

/**
 * POST /api/resolve-track
 * Input: { search: string } (e.g. "Daft Punk")
 * Returns: youtube_metadata, spotify_preview_url, spotify_analysis
 *
 * Requires env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 */
export async function POST(request) {
  try {
    const { search } = await request.json()
    if (!search || typeof search !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid search string' },
        { status: 400 }
      )
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.' },
        { status: 500 }
      )
    }

    // 1. Search YouTube Music
    const ytmusic = new YTMusic()
    await ytmusic.initialize()
    const ytResults = await ytmusic.search(search)
    const first = Array.isArray(ytResults) ? ytResults[0] : null

    if (!first) {
      return NextResponse.json(
        { error: 'No results found on YouTube Music' },
        { status: 404 }
      )
    }

    const title = first.title ?? first.name ?? ''
    const artist = first.artist ?? first.artists?.[0]?.name ?? first.author ?? ''
    const videoId = first.videoId ?? first.id ?? ''

    // 2. Get Spotify access token (Client Credentials)
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
      const err = await tokenRes.text()
      return NextResponse.json(
        { error: `Spotify auth failed: ${err}` },
        { status: 502 }
      )
    }

    const { access_token } = await tokenRes.json()

    // 3. Search Spotify for matching track
    const spotifyQuery = [title, artist].filter(Boolean).join(' ')
    const spotifySearchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(spotifyQuery)}&type=track&limit=5`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    )

    if (!spotifySearchRes.ok) {
      return NextResponse.json(
        { error: 'Spotify search failed' },
        { status: 502 }
      )
    }

    const spotifySearch = await spotifySearchRes.json()
    const tracks = spotifySearch.tracks?.items ?? []
    const spotifyTrack = tracks[0]

    if (!spotifyTrack) {
      return NextResponse.json(
        {
          error: 'No matching track found on Spotify',
          youtube_metadata: {
            title,
            artist,
            videoId,
            thumbnail: first.thumbnail ?? first.thumbnails?.[0]?.url,
            related: (ytResults.slice(1, 6) ?? []).map((r) => ({
          videoId: r.videoId ?? r.id,
          title: r.title ?? r.name,
          artist: r.artist ?? r.artists?.[0]?.name ?? r.author,
          thumbnail: r.thumbnail ?? r.thumbnails?.[0]?.url ?? (r.videoId ? `https://img.youtube.com/vi/${r.videoId}/mqdefault.jpg` : null),
        })),
          },
        },
        { status: 404 }
      )
    }

    const spotifyId = spotifyTrack.id
    const previewUrl = spotifyTrack.preview_url ?? null

    // 4. Fetch Spotify audio-analysis
    const analysisRes = await fetch(
      `https://api.spotify.com/v1/audio-analysis/${spotifyId}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    )

    let spotifyAnalysis = null
    if (analysisRes.ok) {
      spotifyAnalysis = await analysisRes.json()
    }

    // 5. Build response
    const youtube_metadata = {
      title,
      artist,
      videoId,
      thumbnail: first.thumbnail ?? first.thumbnails?.[0]?.url ?? null,
      related: (ytResults.slice(1, 6) ?? []).map((r) => ({
        videoId: r.videoId ?? r.id,
        title: r.title ?? r.name,
        artist: r.artist ?? r.artists?.[0]?.name ?? r.author,
        thumbnail: r.thumbnail ?? r.thumbnails?.[0]?.url ?? (r.videoId ? `https://img.youtube.com/vi/${r.videoId}/mqdefault.jpg` : null),
      })),
    }

    return NextResponse.json({
      youtube_metadata,
      spotify_preview_url: previewUrl,
      spotify_analysis: spotifyAnalysis,
    })
  } catch (err) {
    console.error('[resolve-track]', err)
    return NextResponse.json(
      { error: err.message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}
