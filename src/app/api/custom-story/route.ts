import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.ADMIN_PASSWORD
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, summary, content, source, category, externalUrl } = await req.json()

  if (!title?.trim() || !source?.trim() || !category?.trim()) {
    return NextResponse.json({ error: 'Title, source and category are required' }, { status: 400 })
  }

  const useExternalUrl = !!externalUrl?.trim()

  const { data, error } = await supabaseAdmin
    .from('stories')
    .insert({
      title: title.trim(),
      summary: summary?.trim() || null,       // shown on card
      content: content?.trim() || null,       // shown on hosted story page
      url: useExternalUrl ? externalUrl.trim() : 'pending',
      source: source.trim(),
      category: category.trim(),
      status: 'approved',
      is_custom: true,
      is_featured: false,
      ai_score: 10,
      ai_reason: 'Custom story created by admin',
      approved_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let storyUrl = externalUrl?.trim() || ''
  if (!useExternalUrl) {
    storyUrl = `https://thegoodifound.com/story/${data.id}`
    await supabaseAdmin.from('stories').update({ url: storyUrl }).eq('id', data.id)
  }

  return NextResponse.json({ ok: true, id: data.id, url: storyUrl })
}
