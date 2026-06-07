import { NextRequest, NextResponse } from 'next/server'
import { runIngestion } from '@/lib/ingest'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const adminSecret = process.env.ADMIN_PASSWORD
  const cronSecret = process.env.CRON_SECRET
  if (!adminSecret || (auth !== `Bearer ${adminSecret}` && auth !== `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runIngestion()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('Ingestion error:', err)
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
