import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export type Story = {
  id: string
  title: string
  summary: string | null
  url: string
  source: string
  published_at: string | null
  fetched_at: string
  status: 'pending' | 'approved' | 'skipped' | 'published' | 'rejected'
  ai_score: number | null
  ai_reason: string | null
  image_url: string | null
  category: string | null
  approved_at: string | null
  is_featured: boolean
  is_custom: boolean
  content: string | null
  site_published_at: string | null
}

export type ReaderSubmission = {
  id: string
  type: 'article' | 'url'
  status: 'new' | 'approved' | 'dismissed'
  submitter_name: string
  submitter_email: string | null
  title: string | null
  summary: string | null
  content: string | null
  image_url: string | null
  attested: boolean
  url: string | null
  reason: string | null
  created_at: string
  reviewed_at: string | null
}
