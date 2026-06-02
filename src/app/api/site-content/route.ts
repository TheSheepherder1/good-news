import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('key, value')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const settings: Record<string, string> = {}
  for (const row of data || []) settings[row.key] = row.value
  return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.ADMIN_PASSWORD
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updates: Record<string, string> = await req.json()

  for (const [key, value] of Object.entries(updates)) {
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({ key, value })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
