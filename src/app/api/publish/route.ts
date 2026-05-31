import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.ADMIN_PASSWORD
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { mode } = await req.json() as { mode: 'replace' | 'add' }

  // Replace mode: delete all currently published stories first
  if (mode === 'replace') {
    const { error: deleteError } = await supabaseAdmin
      .from('stories')
      .delete()
      .eq('status', 'published')
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Move all approved → published
  const { data, error } = await supabaseAdmin
    .from('stories')
    .update({ status: 'published' })
    .eq('status', 'approved')
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, published: data?.length ?? 0 })
}
