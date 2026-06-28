import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function auth(req: NextRequest) {
  const header = req.headers.get('authorization') || ''
  return header.replace('Bearer ', '') === process.env.ADMIN_PASSWORD
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('archive_chapters')
    .select('*')
    .order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { name, slug, description, parent_id, sort_order } = body
  if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('archive_chapters')
    .insert({ name, slug, description: description || null, parent_id: parent_id || null, sort_order: sort_order ?? 0 })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, chapter: data })
}

export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('archive_chapters')
    .update(updates)
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
