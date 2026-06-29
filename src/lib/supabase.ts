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
  content_format: 'text' | 'rich'
  likes: number
}

export type ArchiveChapter = {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  status: 'active' | 'retired'
  sort_order: number
  created_at: string
}

export type WorldEvent = {
  id: string
  name: string
  slug: string
  description: string | null
  event_year: number | null
  status: 'active' | 'retired'
  sort_order: number
  created_at: string
}

export type ArchiveStory = {
  id: string
  status: 'live' | 'review' | 'declined' | 'removed'
  opening: string | null
  body: string | null
  impact: string | null
  image_1_url: string | null
  image_1_caption: string | null
  image_2_url: string | null
  image_2_caption: string | null
  image_3_url: string | null
  image_3_caption: string | null
  occurred_year: number
  occurred_month: number | null
  country: string
  state_province: string | null
  city: string | null
  chapter_id: string | null
  world_event_id: string | null
  tags: string[]
  organization: string | null
  author_name: string
  is_anonymous: boolean
  relationship: string
  original_language: string
  ai_passed: boolean | null
  ai_score: number | null
  ai_reason: string | null
  is_seed: boolean
  is_home_featured: boolean
  submitted_at: string
  reviewed_at: string | null
  published_at: string | null
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
