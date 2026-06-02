import { supabaseAdmin } from '@/lib/supabase'
import PublicFeed from '@/components/PublicFeed'
import { type Story } from '@/lib/supabase'
import { format } from 'date-fns'

export const revalidate = 120

const CATEGORY_ORDER = ['Humanity', 'Culture', 'Art', 'Health', 'Animals', 'Science', 'Good News', 'Environment', 'Technology', 'Space', 'Sports']

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
    .order('approved_at', { ascending: false })
    .limit(100)
  return data || []
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
  const [stories, siteContent] = await Promise.all([getPublishedStories(), getSiteContent()])

  const featured = stories.find((s) => s.is_featured) ?? null
  const rest = stories.filter((s) => !s.is_featured)

  const grouped = new Map<string, Story[]>()
  for (const story of rest) {
    const cat = story.category || 'Good News'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(story)
  }
  for (const [cat, catStories] of grouped) {
    grouped.set(cat, catStories.sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0)))
  }

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped.has(c)),
    ...[...grouped.keys()].filter((c) => !CATEGORY_ORDER.includes(c)).sort(),
  ]

  const sections = sortedCategories.map((category) => ({
    category,
    stories: grouped.get(category)!,
  }))

  const publishDate = stories[0]?.approved_at
    ? format(new Date(stories[0].approved_at), 'MMMM d, yyyy')
    : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #c8e6dd 0%, #f8fbfa 100%)' }}>
        <PublicFeed featured={featured} sections={sections} publishDate={publishDate} siteContent={siteContent} />
      </main>
    </>
  )
}
