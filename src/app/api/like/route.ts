import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let storyId: string
  try {
    const body = await req.json()
    storyId = body.storyId
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!storyId || typeof storyId !== 'string') {
    return NextResponse.json({ error: 'Invalid storyId' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.rpc('increment_story_likes', { story_id: storyId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ likes: data })
}
