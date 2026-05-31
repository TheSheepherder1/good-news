import { supabaseAdmin } from '@/lib/supabase'
import StoryCard from '@/components/StoryCard'
import SectionNav from '@/components/SectionNav'
import { type Story } from '@/lib/supabase'
import { format } from 'date-fns'

export const revalidate = 120

const CATEGORY_ORDER = ['Good News', 'Science', 'Animals', 'Health', 'Environment', 'Technology', 'Culture']

function slugify(cat: string) {
  return cat.toLowerCase().replace(/\s+/g, '-')
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

export default async function Home() {
  const stories = await getPublishedStories()

  const featured = stories.find((s) => s.is_featured)
  const rest = stories.filter((s) => !s.is_featured)

  const grouped = new Map<string, Story[]>()
  for (const story of rest) {
    const cat = story.category || 'Good News'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(story)
  }

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped.has(c)),
    ...[...grouped.keys()].filter((c) => !CATEGORY_ORDER.includes(c)).sort(),
  ]

  const publishDate = stories[0]?.approved_at
    ? format(new Date(stories[0].approved_at), 'MMMM d, yyyy')
    : null

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      <header className="max-w-6xl mx-auto px-4 pt-10 pb-6 text-center">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Good News</h1>
        <p className="mt-2 text-gray-500 text-lg">
          Uplifting stories from the People around our World
        </p>
        {publishDate && (
          <p className="mt-1 text-emerald-600 font-medium text-sm">{publishDate}</p>
        )}
        {stories.length > 0 && (
          <div className="mt-4 flex justify-center">
            <SectionNav
              categories={sortedCategories}
              hasFeatured={!!featured}
            />
          </div>
        )}
      </header>

      <section className="max-w-6xl mx-auto px-4 pb-16 flex flex-col gap-12">
        {stories.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-lg">
            No stories yet — check back soon!
          </div>
        ) : (
          <>
            {/* Featured hero */}
            {featured && (
              <div id="featured" className="scroll-mt-6">
                <h2 className="text-xs font-semibold text-yellow-600 uppercase tracking-widest mb-3">
                  Featured Story
                </h2>
                <div className="bg-white rounded-3xl shadow-md border border-yellow-200 overflow-hidden flex flex-col md:flex-row">
                  {featured.image_url && (
                    <img
                      src={featured.image_url}
                      alt=""
                      className="w-full md:w-96 h-56 md:h-auto object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div className="p-6 flex flex-col gap-3 justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {featured.category || featured.source}
                      </span>
                      <span>{featured.source}</span>
                    </div>
                    <a
                      href={featured.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 font-bold text-xl leading-snug hover:text-emerald-700 transition-colors"
                    >
                      {featured.title}
                    </a>
                    {featured.summary && (
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-4">{featured.summary}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Category sections */}
            {sortedCategories.map((category) => {
              const categoryStories = grouped.get(category) || []
              return (
                <div key={category} id={slugify(category)} className="scroll-mt-6">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categoryStories.map((story) => (
                      <StoryCard key={story.id} story={story} />
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </section>
    </main>
  )
}
