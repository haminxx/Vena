import { NextResponse } from 'next/server'
import YTMusic from 'ytmusic-api'

/**
 * POST /api/resolve-track
 * Input: { search: string } OR { spotifyId: string } (from Spotify search selection)
 * Returns: youtube_metadata, spotify_preview_url, spotify_analysis
 *
 * When spotifyId is provided: uses Spotify first, then finds YouTube version (bridge).
 * When search is provided: uses YouTube first, then enriches with Spotify.
 *
 * Requires env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 */
export async function POST(request) {
  try {
    const { search, filters, spotifyId: inputSpotifyId } = await request.json()

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.' },
        { status: 500 }
      )
    }

    const toArtistStr = (v) => {
      if (v == null) return ''
      if (typeof v === 'string') return v
      if (typeof v === 'object' && v?.name) return String(v.name)
      return ''
    }

    let title, artist, videoId, spotifyTrack, ytResults, access_token

    if (inputSpotifyId && typeof inputSpotifyId === 'string') {
      // Bridge: Spotify selection -> find on YouTube
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
        return NextResponse.json({ error: `Spotify auth failed: ${err}` }, { status: 502 })
      }
      const tokenData = await tokenRes.json()
      access_token = tokenData.access_token

      const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${inputSpotifyId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (!trackRes.ok) {
        return NextResponse.json({ error: 'Track not found on Spotify' }, { status: 404 })
      }
      spotifyTrack = await trackRes.json()
      title = spotifyTrack.name ?? ''
      artist = spotifyTrack.artists?.[0]?.name ?? ''

      const ytmusic = new YTMusic()
      await ytmusic.initialize()
      const searchQuery = [title, artist].filter(Boolean).join(' ')
      ytResults = await ytmusic.search(searchQuery)
      const first = Array.isArray(ytResults) ? ytResults[0] : null
      videoId = first?.videoId ?? first?.id ?? ''
    } else {
      // Original flow: search string -> YouTube first
      if (!search || typeof search !== 'string') {
        return NextResponse.json(
          { error: 'Missing or invalid search string' },
          { status: 400 }
        )
      }
      const ytmusic = new YTMusic()
      await ytmusic.initialize()
      ytResults = await ytmusic.search(search)
      const first = Array.isArray(ytResults) ? ytResults[0] : null

      if (!first) {
        return NextResponse.json(
          { error: 'No results found on YouTube Music' },
          { status: 404 }
        )
      }

      title = first.title ?? first.name ?? ''
      const artistRaw = first.artist ?? first.artists?.[0] ?? first.author
      artist = toArtistStr(artistRaw)
      videoId = first.videoId ?? first.id ?? ''
    }

    if (!spotifyTrack) {
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
        return NextResponse.json({ error: `Spotify auth failed: ${err}` }, { status: 502 })
      }
      const tokenData = await tokenRes.json()
      access_token = tokenData.access_token

      const spotifyQuery = [title, artist].filter(Boolean).join(' ')
      const spotifySearchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(spotifyQuery)}&type=track&limit=5`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      if (!spotifySearchRes.ok) {
        return NextResponse.json({ error: 'Spotify search failed' }, { status: 502 })
      }
      const spotifySearch = await spotifySearchRes.json()
      spotifyTrack = spotifySearch.tracks?.items?.[0] ?? null
    }

    if (!spotifyTrack) {
      const firstYt = Array.isArray(ytResults) ? ytResults[0] : null
      return NextResponse.json(
        {
          error: 'No matching track found on Spotify',
          youtube_metadata: {
            title,
            artist,
            videoId,
            thumbnail: firstYt?.thumbnail ?? firstYt?.thumbnails?.[0]?.url ?? null,
            related: (ytResults?.slice(1, 6) ?? []).map((r) => {
              const ar = r.artist ?? r.artists?.[0] ?? r.author
              return {
                videoId: r.videoId ?? r.id,
                title: r.title ?? r.name,
                artist: toArtistStr(ar),
                thumbnail: r.thumbnail ?? r.thumbnails?.[0]?.url ?? (r.videoId ? `https://img.youtube.com/vi/${r.videoId}/mqdefault.jpg` : null),
              }
            }),
          },
        },
        { status: 404 }
      )
    }

    const spotifyId = spotifyTrack.id
    const artistId = spotifyTrack.artists?.[0]?.id ?? null
    const previewUrl = spotifyTrack.preview_url ?? null

    // Fetch artist for Spotify artist images (images[0]=large for card, images[2]=small for node)
    let artistImageLarge = null
    let artistImageSmall = null
    if (artistId) {
      const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (artistRes.ok) {
        const artistData = await artistRes.json()
        const imgs = artistData.images ?? []
        artistImageLarge = imgs[0]?.url ?? null
        artistImageSmall = imgs[2]?.url ?? imgs[1]?.url ?? imgs[0]?.url ?? null
      }
    }

    // 4. Fetch audio-features (for 3D positioning)
    let audioFeatures = null
    const featuresRes = await fetch(
      `https://api.spotify.com/v1/audio-features/${spotifyId}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    if (featuresRes.ok) audioFeatures = await featuresRes.json()

    // 5. Fetch Spotify audio-analysis
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

    const firstYt = Array.isArray(ytResults) ? ytResults[0] : null
    const fallbackThumb = firstYt?.thumbnail ?? firstYt?.thumbnails?.[0]?.url ?? spotifyTrack.album?.images?.[0]?.url ?? null

    const youtube_metadata = {
      title,
      artist,
      videoId,
      thumbnail: artistImageSmall ?? artistImageLarge ?? fallbackThumb,
      artistImageLarge: artistImageLarge ?? fallbackThumb,
      artistImageSmall: artistImageSmall ?? artistImageLarge ?? fallbackThumb,
      spotifyId,
      artistId,
      previewUrl,
      audioFeatures,
      related: (ytResults?.slice(1, 6) ?? []).map((r) => {
        const ar = r.artist ?? r.artists?.[0] ?? r.author
        return {
          videoId: r.videoId ?? r.id,
          title: r.title ?? r.name,
          artist: toArtistStr(ar),
          thumbnail: r.thumbnail ?? r.thumbnails?.[0]?.url ?? (r.videoId ? `https://img.youtube.com/vi/${r.videoId}/mqdefault.jpg` : null),
        }
      }),
    }

    return NextResponse.json({
      youtube_metadata,
      spotify_preview_url: previewUrl,
      spotify_analysis: spotifyAnalysis,
      spotify_id: spotifyId,
      audio_features: audioFeatures,
    })
  } catch (err) {
    console.error('[resolve-track]', err)
    return NextResponse.json(
      { error: err.message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}
