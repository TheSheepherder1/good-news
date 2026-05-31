import { NextRequest, NextResponse } from 'next/server'
import { runIngestion } from '@/lib/ingest'

export async function POST(req: NextRequest) {
  // Simple bearer token check — set CRON_SECRET in env for automated calls
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET || process.env.ADMIN_PASSWORD
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runIngestion()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('Ingestion error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
