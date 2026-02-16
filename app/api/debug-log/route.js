import { NextResponse } from 'next/server'
import { appendFileSync } from 'fs'
import { join } from 'path'

export async function POST(request) {
  try {
    const body = await request.json()
    const line = JSON.stringify({ ...body, timestamp: body.timestamp ?? Date.now() }) + '\n'
    const logPath = join(process.cwd(), 'DEBUG_PREVIEW.log')
    appendFileSync(logPath, line, 'utf8')
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
