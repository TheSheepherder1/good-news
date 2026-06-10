import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { SECTIONS } from '@/lib/sections'
import { classifyStories } from '@/lib/ingest'
import { fetchUrlMetadata } from '@/lib/extractMetadata'

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.ADMIN_PASSWORD
  return !!secret && auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('reader_submissions')
    .select('*')
    .eq('status', 'new')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, action, category } = body

  if (!id || !['dismiss', 'approve'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: submission, error: fetchError } = await supabaseAdmin
    .from('reader_submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  if (action === 'dismiss') {
    const { error } = await supabaseAdmin
      .from('reader_submissions')
      .update({ status: 'dismissed', reviewed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // action === 'approve'
  if (!category || !SECTIONS.includes(category)) {
    return NextResponse.json({ error: 'A valid section is required to approve' }, { status: 400 })
  }

  let message = ''

  if (submission.type === 'article') {
    const { data: story, error: insertError } = await supabaseAdmin
      .from('stories')
      .insert({
        title: submission.title,
        summary: submission.summary,
        content: submission.content,
        image_url: submission.image_url,
        url: 'pending',
        source: submission.submitter_name,
        category,
        status: 'approved',
        is_custom: true,
        is_featured: false,
        ai_score: 10,
        ai_reason: 'Reader-submitted article',
        approved_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    const storyUrl = `https://thegoodifound.com/story/${story.id}`
    await supabaseAdmin.from('stories').update({ url: storyUrl }).eq('id', story.id)

    message = 'Published as a custom story in Approved.'
  } else {
    // type === 'url'
    const meta = await fetchUrlMetadata(submission.url)

    let siteName = meta.siteName
    if (!siteName) {
      try {
        siteName = new URL(submission.url).hostname.replace(/^www\./, '')
      } catch {
        siteName = 'Reader recommendation'
      }
    }

    const title = meta.title || submission.reason || submission.url
    const summary = meta.description || submission.reason || null

    const [classified] = await classifyStories([
      {
        title,
        url: submission.url,
        summary: summary || '',
        source: siteName,
        published_at: null,
        image_url: null,
        category,
        curated: false,
      },
    ])

    const { data: insertedRows, error: upsertError } = await supabaseAdmin
      .from('stories')
      .upsert(
        {
          title,
          summary,
          url: submission.url,
          source: siteName,
          published_at: null,
          status: 'pending',
          ai_score: classified.score,
          ai_reason: classified.reason,
          category,
        },
        { onConflict: 'url', ignoreDuplicates: true }
      )
      .select('id')

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

    if (insertedRows && insertedRows.length > 0) {
      message = `Added to Pending with AI score ${classified.score}/10.`
    } else {
      message = 'That story was already in the system — no new entry added.'
    }
  }

  const { error: reviewError } = await supabaseAdmin
    .from('reader_submissions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 })

  return NextResponse.json({ ok: true, message })
}
