import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sanitizeStoryHtml } from '@/lib/sanitizeHtml'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB

function tooLong(value: string, max: number): boolean {
  return value.length > max
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  // Honeypot — bots tend to fill every field. If this hidden field has a
  // value, silently pretend success without writing anything.
  const honeypot = (formData.get('website') as string | null) || ''
  if (honeypot.trim()) {
    return NextResponse.json({ ok: true })
  }

  const type = (formData.get('type') as string | null) || ''
  const submitterName = ((formData.get('submitter_name') as string | null) || '').trim()
  const submitterEmailRaw = ((formData.get('submitter_email') as string | null) || '').trim()
  const submitterEmail = submitterEmailRaw || null

  if (!['article', 'url'].includes(type)) {
    return NextResponse.json({ error: 'Invalid submission type' }, { status: 400 })
  }
  if (!submitterName) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (tooLong(submitterName, 100)) {
    return NextResponse.json({ error: 'Name is too long' }, { status: 400 })
  }
  if (submitterEmail) {
    if (tooLong(submitterEmail, 200) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
      return NextResponse.json({ error: 'Email looks invalid' }, { status: 400 })
    }
  }

  if (type === 'article') {
    const title = ((formData.get('title') as string | null) || '').trim()
    const summary = ((formData.get('summary') as string | null) || '').trim()
    const content = ((formData.get('content') as string | null) || '').trim()
    const attested = (formData.get('attested') as string | null) === 'true'
    const image = formData.get('image') as File | null

    if (!title || !summary || !content) {
      return NextResponse.json({ error: 'Title, summary, and full story are required' }, { status: 400 })
    }
    if (!attested) {
      return NextResponse.json({ error: 'Please confirm you agree to the submission terms' }, { status: 400 })
    }
    if (tooLong(title, 200)) return NextResponse.json({ error: 'Title is too long (200 max)' }, { status: 400 })
    if (tooLong(summary, 500)) return NextResponse.json({ error: 'Summary is too long (500 max)' }, { status: 400 })

    const sanitizedContent = sanitizeStoryHtml(content)
    const contentText = sanitizedContent.replace(/<[^>]*>/g, '')
    if (!contentText.trim()) {
      return NextResponse.json({ error: 'Title, summary, and full story are required' }, { status: 400 })
    }
    if (tooLong(contentText, 20000)) return NextResponse.json({ error: 'Story is too long (20,000 max)' }, { status: 400 })
    if (tooLong(sanitizedContent, 100000)) return NextResponse.json({ error: 'Story is too long' }, { status: 400 })

    if (image && image.size > 0) {
      if (!image.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Image must be a picture file' }, { status: 400 })
      }
      if (image.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Image is too large (5MB max)' }, { status: 400 })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('reader_submissions')
      .insert({
        type: 'article',
        submitter_name: submitterName,
        submitter_email: submitterEmail,
        title,
        summary,
        content: sanitizedContent,
        attested: true,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Log proof of agreement to the submission terms — retained for 7 years
    // (purged by /api/cleanup) regardless of what happens to the submission.
    const { error: attestationError } = await supabaseAdmin.from('submission_attestations').insert({
      submission_id: data.id,
      submitter_name: submitterName,
      submitter_email: submitterEmail,
    })
    if (attestationError) console.error('Failed to log submission attestation:', attestationError.message)

    if (image && image.size > 0) {
      const ext = image.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `submissions/${data.id}.${ext}`
      const buffer = await image.arrayBuffer()

      const { error: uploadError } = await supabaseAdmin.storage
        .from('featured-images')
        .upload(filename, buffer, { contentType: image.type, upsert: true })

      if (!uploadError) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('featured-images')
          .getPublicUrl(filename)
        await supabaseAdmin.from('reader_submissions').update({ image_url: publicUrl }).eq('id', data.id)
      }
    }

    return NextResponse.json({ ok: true })
  }

  // type === 'url'
  const url = ((formData.get('url') as string | null) || '').trim()
  const reason = ((formData.get('reason') as string | null) || '').trim()

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }
  if (tooLong(url, 2000)) return NextResponse.json({ error: 'URL is too long' }, { status: 400 })
  if (tooLong(reason, 1000)) return NextResponse.json({ error: 'That note is too long (1,000 max)' }, { status: 400 })

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol')
  } catch {
    return NextResponse.json({ error: 'Please enter a valid http(s) URL' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('reader_submissions')
    .insert({
      type: 'url',
      submitter_name: submitterName,
      submitter_email: submitterEmail,
      url,
      reason: reason || null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
