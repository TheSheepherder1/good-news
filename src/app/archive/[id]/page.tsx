import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { CHAPTER_COLORS } from '@/components/ArchiveCard'
import ArchiveStoryContent from '@/components/ArchiveStoryContent'
import ArchiveStoryShareBtn from '@/components/ArchiveStoryShareBtn'
import ArchiveStoryDetailMeta from '@/components/ArchiveStoryDetailMeta'

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
        <ArchiveStoryShareBtn />
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

        <ArchiveStoryContent opening={story.opening} body={null} impact={null} />

        {/* Mid image */}
        {story.image_2_url && (
          <div className="rounded-2xl overflow-hidden mb-6 shadow-sm">
            <img src={story.image_2_url} alt={story.image_2_caption || ''} className="w-full object-cover max-h-72" />
            {story.image_2_caption && (
              <p className="text-xs text-gray-400 italic px-4 py-2 bg-white/70">{story.image_2_caption}</p>
            )}
          </div>
        )}

        <ArchiveStoryContent opening={null} body={story.body} impact={story.impact} />

        {/* Closing image */}
        {story.image_3_url && (
          <div className="rounded-2xl overflow-hidden mb-6 shadow-sm">
            <img src={story.image_3_url} alt={story.image_3_caption || ''} className="w-full object-cover max-h-72" />
            {story.image_3_caption && (
              <p className="text-xs text-gray-400 italic px-4 py-2 bg-white/70">{story.image_3_caption}</p>
            )}
          </div>
        )}

        <ArchiveStoryDetailMeta
          displayName={displayName}
          isSeed={story.is_seed}
          relationship={story.relationship}
          city={story.city}
          stateProvince={story.state_province}
          country={story.country}
          occurredYear={story.occurred_year}
          occurredMonth={story.occurred_month}
          characters={characters}
          worldEvent={worldEvent}
          tags={story.tags || []}
        />

      </article>
    </main>
  )
}
