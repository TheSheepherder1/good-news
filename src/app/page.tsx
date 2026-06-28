import { supabaseAdmin } from '@/lib/supabase'
import PublicFeed from '@/components/PublicFeed'
import { type Story } from '@/lib/supabase'
import { format } from 'date-fns'
import { CATEGORY_ORDER } from '@/lib/sections'

export type ArchiveFeatured = {
  id: string
  opening: string
  impact: string | null
  image_1_url: string | null
  author_name: string | null
  is_anonymous: boolean
  occurred_year: number | null
  country: string | null
  archive_chapters: { name: string; slug: string } | null
}

export const revalidate = 120

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'The Good I Found',
  url: 'https://www.thegoodifound.com',
  description: 'Your daily dose of good news — uplifting, heartwarming, and inspiring stories from around the world.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://thegoodifound.com/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

async function getPublishedStories(): Promise<Story[]> {
  const { data } = await supabaseAdmin
    .from('stories')
    .select('*')
    .eq('status', 'published')
    .order('site_published_at', { ascending: false })
    .limit(100)
  return data || []
}

async function getArchiveFeatured(): Promise<ArchiveFeatured | null> {
  const SELECT = 'id, opening, impact, image_1_url, author_name, is_anonymous, occurred_year, country, archive_chapters(name, slug)'

  // Prefer the admin-pinned story
  const { data: pinned } = await supabaseAdmin
    .from('archive_stories')
    .select(SELECT)
    .eq('status', 'live')
    .eq('is_home_featured', true)
    .maybeSingle()
  if (pinned) return pinned as unknown as ArchiveFeatured

  // Fall back to most recently published
  const { data } = await supabaseAdmin
    .from('archive_stories')
    .select(SELECT)
    .eq('status', 'live')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  return data ? (data as unknown as ArchiveFeatured) : null
}

async function getSiteContent(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin
    .from('site_settings')
    .select('key, value')
  const settings: Record<string, string> = {}
  for (const row of data || []) settings[row.key] = row.value
  return settings
}

export default async function Home() {
  const [stories, siteContent, archiveFeatured] = await Promise.all([
    getPublishedStories(),
    getSiteContent(),
    getArchiveFeatured(),
  ])

  const grouped = new Map<string, Story[]>()
  for (const story of stories) {
    const cat = story.category || 'Good News'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(story)
  }
  for (const [cat, catStories] of grouped) {
    grouped.set(cat, catStories.sort((a, b) => {
      const aTime = new Date(a.site_published_at ?? a.approved_at ?? 0).getTime()
      const bTime = new Date(b.site_published_at ?? b.approved_at ?? 0).getTime()
      return bTime - aTime
    }))
  }

  // All stories go into sections — no separate hero for news
  const rest = stories

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped.has(c)),
    ...[...grouped.keys()].filter((c) => !CATEGORY_ORDER.includes(c)).sort(),
  ]

  // "New!" virtual section — all stories from the latest publish batch,
  // ordered by their section's position in CATEGORY_ORDER so the reader
  // can see what's new across all categories at a glance.
  const latestBatchAt = rest.reduce<string | null>((max, s) => {
    if (!s.site_published_at) return max
    return !max || s.site_published_at > max ? s.site_published_at : max
  }, null)

  const newStories = latestBatchAt
    ? rest
        .filter((s) => s.site_published_at === latestBatchAt)
        .sort((a, b) => {
          const ai = CATEGORY_ORDER.indexOf(a.category ?? '')
          const bi = CATEGORY_ORDER.indexOf(b.category ?? '')
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
        })
    : []

  const sections = [
    ...(newStories.length > 0 ? [{ category: 'New!', stories: newStories }] : []),
    ...sortedCategories.map((category) => ({
      category,
      stories: grouped.get(category)!,
    })),
  ]

  const latestDate = stories[0]?.site_published_at ?? stories[0]?.approved_at
  const publishDate = latestDate ? format(new Date(latestDate), 'MMMM d, yyyy') : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #c8dde6 0%, #f8fbfa 100%)' }}>
        <PublicFeed featured={null} archiveFeatured={archiveFeatured} sections={sections} publishDate={publishDate} siteContent={siteContent} />
      </main>
    </>
  )
}
