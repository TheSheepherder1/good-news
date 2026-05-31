import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = req.nextUrl.searchParams.get('auth')
  const secret = process.env.ADMIN_PASSWORD
  if (!secret || auth !== secret) {
    return NextResponse.json({
      error: 'Unauthorized',
      debug: {
        hasSecret: !!secret,
        secretLength: secret?.length ?? 0,
        authLength: auth?.length ?? 0,
        authValue: auth,
      }
    }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  const storyId = formData.get('storyId') as string

  if (!file || !storyId) {
    return NextResponse.json({ error: 'Missing file or storyId' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${storyId}.${ext}`
  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await supabaseAdmin.storage
    .from('featured-images')
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('featured-images')
    .getPublicUrl(filename)

  const { error: updateError } = await supabaseAdmin
    .from('stories')
    .update({ image_url: publicUrl })
    .eq('id', storyId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ ok: true, url: publicUrl })
}
