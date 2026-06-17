import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let storyId: string
  let action: string
  try {
    const body = await req.json()
    storyId = body.storyId
    action = body.action ?? 'like'
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!storyId || typeof storyId !== 'string') {
    return NextResponse.json({ error: 'Invalid storyId' }, { status: 400 })
  }

  const fn = action === 'unlike' ? 'decrement_story_likes' : 'increment_story_likes'
  const { data, error } = await supabaseAdmin.rpc(fn, { story_id: storyId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ likes: data })
}
