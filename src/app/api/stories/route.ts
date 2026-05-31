import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') || 'published'
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '50'), 300)

  const { data, error } = await supabaseAdmin
    .from('stories')
    .select('*')
    .eq('status', status)
    .order(status === 'pending' ? 'fetched_at' : 'approved_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.ADMIN_PASSWORD
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, status, is_featured, category, image_url } = body

  // Handle category update
  if (category !== undefined) {
    const { error } = await supabaseAdmin.from('stories').update({ category }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Handle image_url update (including null to remove)
  if ('image_url' in body) {
    const { error } = await supabaseAdmin.from('stories').update({ image_url: image_url ?? null }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Handle featured toggle
  if (is_featured === true) {
    // Unset any existing featured story first
    await supabaseAdmin.from('stories').update({ is_featured: false }).eq('is_featured', true)
    const { error } = await supabaseAdmin.from('stories').update({ is_featured: true }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (is_featured === false) {
    const { error } = await supabaseAdmin.from('stories').update({ is_featured: false }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Handle status change
  if (!id || !['approved', 'skipped', 'pending', 'published', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { status }
  if (status === 'approved') updates.approved_at = new Date().toISOString()

  const { error } = await supabaseAdmin.from('stories').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
