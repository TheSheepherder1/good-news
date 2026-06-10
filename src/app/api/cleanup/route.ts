import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('stories')
    .delete()
    .lt('fetched_at', thirtyDaysAgo)
    .neq('status', 'published')
    .eq('is_custom', false)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Submission attestations are kept as proof of agreement to the
  // Share-a-Story terms for 7 years, then purged.
  const sevenYearsAgo = new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000).toISOString()

  const { data: attestations, error: attestationError } = await supabaseAdmin
    .from('submission_attestations')
    .delete()
    .lt('submitted_at', sevenYearsAgo)
    .select('id')

  if (attestationError) return NextResponse.json({ error: attestationError.message }, { status: 500 })

  return NextResponse.json({ ok: true, deleted: data?.length ?? 0, attestationsDeleted: attestations?.length ?? 0 })
}
