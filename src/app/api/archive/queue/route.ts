import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function auth(req: NextRequest) {
  const header = req.headers.get('authorization') || ''
  return header.replace('Bearer ', '') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'review'

  const { data, error } = await supabaseAdmin
    .from('archive_stories')
    .select(`
      *,
      chapter:archive_chapters(name),
      world_event:world_events(name),
      characters:archive_story_characters(name, sort_order)
    `)
    .eq('status', status)
    .order('submitted_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, action, chapter_id } = await req.json()
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })

  if (action === 'approve') {
    const updates: Record<string, unknown> = {
      status: 'live',
      reviewed_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    }
    if (chapter_id) updates.chapter_id = chapter_id

    const { error } = await supabaseAdmin
      .from('archive_stories')
      .update(updates)
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: 'Story approved and live.' })
  }

  if (action === 'decline') {
    const { error } = await supabaseAdmin
      .from('archive_stories')
      .update({ status: 'declined', reviewed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: 'Story declined.' })
  }

  if (action === 'feature') {
    // Unset any existing home feature, then set this one
    await supabaseAdmin.from('archive_stories').update({ is_home_featured: false }).eq('is_home_featured', true)
    const { error } = await supabaseAdmin.from('archive_stories').update({ is_home_featured: true }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: 'Story set as home feature.' })
  }

  if (action === 'unfeature') {
    const { error } = await supabaseAdmin.from('archive_stories').update({ is_home_featured: false }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: 'Story removed from home.' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
