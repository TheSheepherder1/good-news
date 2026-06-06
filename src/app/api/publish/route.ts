import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.ADMIN_PASSWORD
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { mode } = await req.json() as { mode: 'replace' | 'add' }

  // Replace mode: archive currently published stories (kept for dedup, not deleted)
  if (mode === 'replace') {
    const { error: archiveError } = await supabaseAdmin
      .from('stories')
      .update({ status: 'archived', is_featured: false })
      .eq('status', 'published')
    if (archiveError) return NextResponse.json({ error: archiveError.message }, { status: 500 })
  }

  // Move all approved → published, stamping the publish time
  const { data, error } = await supabaseAdmin
    .from('stories')
    .update({ status: 'published', site_published_at: new Date().toISOString() })
    .eq('status', 'approved')
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, published: data?.length ?? 0 })
}
