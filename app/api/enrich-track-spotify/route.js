import { NextResponse } from 'next/server'
import { appendFileSync } from 'fs'
import { join } from 'path'

function dbg(payload) {
  try {
    appendFileSync(join(process.cwd(), 'DEBUG_PREVIEW.log'), JSON.stringify(payload) + '\n', 'utf8')
  } catch (_) {}
}

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

    // #region agent log
    const entryData = {hasSpotifyId:!!spotifyIdParam,hasArtist:!!artist,hasTrack:!!track,hasCreds:!!(process.env.SPOTIFY_CLIENT_ID&&process.env.SPOTIFY_CLIENT_SECRET)};
    dbg({location:'enrich-track-spotify:entry',message:'API called',data:entryData,hypothesisId:'H1',timestamp:Date.now()});
    console.log('[DEBUG-PREVIEW] API entry:', JSON.stringify(entryData));
    // #endregion

    if (!spotifyIdParam && !artist && !track) {
      return NextResponse.json(
        { spotifyId: null, previewUrl: null },
        { status: 400, headers: { 'X-Debug-Preview': 'missing' } }
      )
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { spotifyId: null, previewUrl: null },
        { headers: { 'X-Debug-Preview': 'missing' } }
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
      return NextResponse.json(
        { spotifyId: null, previewUrl: null },
        { headers: { 'X-Debug-Preview': 'missing' } }
      )
    }

    const { access_token } = await tokenRes.json()
    const headers = { Authorization: `Bearer ${access_token}` }

    if (spotifyIdParam) {
      const trackRes = await fetch(
        `https://api.spotify.com/v1/tracks/${spotifyIdParam}`,
        { headers }
      )
      if (!trackRes.ok) {
        return NextResponse.json(
          { spotifyId: null, previewUrl: null },
          { headers: { 'X-Debug-Preview': 'missing' } }
        )
      }
      const t = await trackRes.json()
      const raw = t?.preview_url
      const previewUrl = raw && String(raw).trim().length > 0 ? String(raw).trim() : null
      // #region agent log
      dbg({location:'enrich-track-spotify:directFetch',message:'Direct fetch by spotifyId',data:{previewUrlFound:!!previewUrl},hypothesisId:'H1',timestamp:Date.now()});
      // #endregion
      return NextResponse.json(
        { spotifyId: t?.id ?? null, previewUrl },
        { headers: { 'X-Debug-Preview': previewUrl ? 'found' : 'missing' } }
      )
    }

    const query = [track, artist].filter(Boolean).join(' ')
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(query)}&limit=5`,
      { headers }
    )

    if (!searchRes.ok) {
      return NextResponse.json(
        { spotifyId: null, previewUrl: null },
        { headers: { 'X-Debug-Preview': 'missing' } }
      )
    }

    const data = await searchRes.json()
    const items = data.tracks?.items ?? []
    // Prefer first item with non-empty preview_url; fallback to first result
    const withPreview = items.find((item) => item?.preview_url && String(item.preview_url).trim().length > 0)
    const first = withPreview ?? items[0]
    const spotifyId = first?.id ?? null
    const rawPreview = first?.preview_url
    const previewUrl = rawPreview && String(rawPreview).trim().length > 0 ? String(rawPreview).trim() : null

    // #region agent log
    const exitData = {previewUrlFound:!!previewUrl,spotifyId:!!spotifyId,previewUrlLen:previewUrl?.length};
    dbg({location:'enrich-track-spotify:exit',message:'API returning',data:exitData,hypothesisId:'H1',timestamp:Date.now()});
    console.log('[DEBUG-PREVIEW] API exit:', JSON.stringify(exitData));
    // #endregion

    return NextResponse.json(
      { spotifyId, previewUrl },
      { headers: { 'X-Debug-Preview': previewUrl ? 'found' : 'missing', 'X-Debug-PreviewUrl-Len': String(previewUrl?.length ?? 0) } }
    )
  } catch (err) {
    console.error('[enrich-track-spotify]', err)
    return NextResponse.json(
      { spotifyId: null, previewUrl: null },
      { headers: { 'X-Debug-Preview': 'missing' } }
    )
  }
}
