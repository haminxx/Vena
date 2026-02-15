import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_STEM_SERVICE ?? 'http://localhost:8000'

/**
 * POST /api/split-stems
 * Proxies to Python FastAPI backend for stem separation.
 * Body: { artist: string, track: string }
 * Returns: { vocals, drums, bass, other } URLs
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { artist, track } = body ?? {}
    if (!artist || !track) {
      return NextResponse.json(
        { error: 'artist and track required' },
        { status: 400 }
      )
    }
    const res = await fetch(`${BACKEND_URL}/split-stems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artist, track }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail ?? data.error ?? 'Stem split failed' },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[split-stems]', err)
    return NextResponse.json(
      { error: err.message ?? 'Backend unavailable. Is the Python service running on port 8000?' },
      { status: 502 }
    )
  }
}
