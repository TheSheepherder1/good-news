import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Returns the current featured story (any status), or null
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('stories')
    .select('id, title, status')
    .eq('is_featured', true)
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
