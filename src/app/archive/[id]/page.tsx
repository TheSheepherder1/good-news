import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { CHAPTER_COLORS } from '@/components/ArchiveCard'
import LocalizedCountry from '@/components/LocalizedCountry'

export const revalidate = 3600

async function getStory(id: string) {
  const { data } = await supabaseAdmin
    .from('archive_stories')
    .select(`
      *,
      chapter:archive_chapters(id, name, slug),
      world_event:world_events(id, name, event_year),
      characters:archive_story_characters(name, sort_order)
    `)
    .eq('id', id)
    .eq('status', 'live')
    .single()
  return data
}

export default async function ArchiveStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const story = await getStory(id)
  if (!story) notFound()

  const chapter = story.chapter as { id: string; name: string; slug: string } | null
  const worldEvent = story.world_event as { id: string; name: string; event_year: number | null } | null
  const characters = ((story.characters as { name: string; sort_order: number }[]) || [])
    .sort((a, b) => a.sort_order - b.sort_order)

  const chapterColor = chapter ? (CHAPTER_COLORS[chapter.slug] || 'bg-gray-50 text-gray-600 border-gray-200') : ''
  const displayName = story.is_anonymous ? 'Anonymous' : story.author_name

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#c8dde6] to-[#f8fbfa]">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/60 px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="The Good I Found" className="h-10 w-auto" />
        </Link>
        <Link
          href="/archive/submit"
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-1.5 rounded-full text-sm transition-colors"
        >
          Share a Story
        </Link>
      </header>

      <article className="max-w-2xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/archive" className="hover:text-emerald-600 transition-colors">Archive</Link>
          {chapter && (
            <>
              <span>›</span>
              <Link
                href={`/archive?chapter=${chapter.slug}`}
                className={`font-medium px-2.5 py-0.5 rounded-full border ${chapterColor} hover:opacity-70 transition-opacity`}
              >
                {chapter.name}
              </Link>
            </>
          )}
        </nav>

        {/* Opening image */}
        {story.image_1_url && (
          <div className="rounded-2xl overflow-hidden mb-6 shadow-sm">
            <img src={story.image_1_url} alt={story.image_1_caption || ''} className="w-full object-cover max-h-96" />
            {story.image_1_caption && (
              <p className="text-xs text-gray-400 italic px-4 py-2 bg-white/70">{story.image_1_caption}</p>
            )}
          </div>
        )}

        {/* Opening */}
        {story.opening && (
          <p className="text-lg text-gray-800 leading-relaxed mb-6 font-medium">{story.opening}</p>
        )}

        {/* Mid image */}
        {story.image_2_url && (
          <div className="rounded-2xl overflow-hidden mb-6 shadow-sm">
            <img src={story.image_2_url} alt={story.image_2_caption || ''} className="w-full object-cover max-h-72" />
            {story.image_2_caption && (
              <p className="text-xs text-gray-400 italic px-4 py-2 bg-white/70">{story.image_2_caption}</p>
            )}
          </div>
        )}

        {/* Body */}
        {story.body && (
          <div className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">{story.body}</div>
        )}

        {/* Impact */}
        {story.impact && (
          <div className="border-l-4 border-emerald-300 pl-4 mb-6">
            <p className="text-base text-gray-600 leading-relaxed italic">{story.impact}</p>
          </div>
        )}

        {/* Closing image */}
        {story.image_3_url && (
          <div className="rounded-2xl overflow-hidden mb-6 shadow-sm">
            <img src={story.image_3_url} alt={story.image_3_caption || ''} className="w-full object-cover max-h-72" />
            {story.image_3_caption && (
              <p className="text-xs text-gray-400 italic px-4 py-2 bg-white/70">{story.image_3_caption}</p>
            )}
          </div>
        )}

        {/* Story metadata */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 mt-8 flex flex-col gap-3 text-sm border border-white/60">

          {/* Author */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-500">Story shared by </span>
              <span className="font-medium text-gray-800">{displayName}</span>
              {story.is_seed && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Historical Account</span>
              )}
            </div>
            <span className="text-xs text-gray-400">{story.relationship}</span>
          </div>

          {/* Location + time */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500">
            <span>
              {[story.city, story.state_province].filter(Boolean).join(', ')}
              {(story.city || story.state_province) && story.country ? ', ' : ''}
              {story.country && <LocalizedCountry code={story.country} />}
            </span>
            <span>
              {story.occurred_month
                ? `${new Date(2000, story.occurred_month - 1).toLocaleString('default', { month: 'long' })} ${story.occurred_year}`
                : String(story.occurred_year)}
            </span>
          </div>

          {/* Characters */}
          {characters.length > 0 && (
            <div className="text-gray-500">
              <span className="text-gray-400">People: </span>
              {characters.map((c) => c.name).join(', ')}
            </div>
          )}

          {/* World event */}
          {worldEvent && (
            <div>
              <Link
                href={`/archive?event=${worldEvent.id}`}
                className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full hover:opacity-70 transition-opacity"
              >
                {worldEvent.name}
                {worldEvent.event_year ? ` (${worldEvent.event_year})` : ''}
              </Link>
            </div>
          )}

          {/* Tags */}
          {story.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {story.tags.map((t: string) => (
                <Link
                  key={t}
                  href={`/archive?tag=${encodeURIComponent(t)}`}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full transition-colors"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Back + share a story */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link
            href="/archive"
            className="flex-1 text-center bg-white border border-gray-200 hover:border-emerald-300 text-gray-600 font-medium py-3 rounded-xl transition-colors"
          >
            ← Back to Archive
          </Link>
          <Link
            href="/archive/submit"
            className="flex-1 text-center bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Share your own story
          </Link>
        </div>

      </article>
    </main>
  )
}
