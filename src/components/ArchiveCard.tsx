'use client'

import Link from 'next/link'
import { getCountryName } from '@/lib/countries'

const CHAPTER_COLORS: Record<string, string> = {
  kindness:    'bg-rose-50 text-rose-600 border-rose-200',
  courage:     'bg-orange-50 text-orange-600 border-orange-200',
  community:   'bg-sky-50 text-sky-600 border-sky-200',
  sacrifice:   'bg-purple-50 text-purple-600 border-purple-200',
  love:        'bg-pink-50 text-pink-600 border-pink-200',
  resilience:  'bg-amber-50 text-amber-700 border-amber-200',
  innovation:  'bg-indigo-50 text-indigo-600 border-indigo-200',
  environment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  joy:         'bg-yellow-50 text-yellow-700 border-yellow-200',
}

type ArchiveCardStory = {
  id: string
  opening: string | null
  body: string | null
  image_1_url: string | null
  occurred_year: number
  country: string
  city: string | null
  author_name: string
  is_anonymous: boolean
  is_seed: boolean
  chapter: { id: string; name: string; slug: string } | null
  world_event: { id: string; name: string } | null
  tags: string[]
}

export default function ArchiveCard({
  story,
  lang = 'en',
  translatedOpening,
  translatedChapterName,
  historicalBadge = 'Historical Account',
  anonymousLabel = 'Anonymous',
  onChapterClick,
  onCountryClick,
  onYearClick,
  onEventClick,
  onTagClick,
}: {
  story: ArchiveCardStory
  lang?: string
  translatedOpening?: string | null
  translatedChapterName?: string
  historicalBadge?: string
  anonymousLabel?: string
  onChapterClick?: (slug: string) => void
  onCountryClick?: (country: string) => void
  onYearClick?: (year: number) => void
  onEventClick?: (id: string) => void
  onTagClick?: (tag: string) => void
}) {
  const chapterColor = story.chapter
    ? (CHAPTER_COLORS[story.chapter.slug] || 'bg-gray-50 text-gray-600 border-gray-200')
    : ''

  const excerpt = translatedOpening ?? story.opening ?? story.body ?? ''
  const displayName = story.is_anonymous ? anonymousLabel : story.author_name

  return (
    <Link
      href={`/archive/${story.id}`}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all flex flex-col"
    >
      {/* Image */}
      {story.image_1_url && (
        <div className="aspect-[16/9] overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={story.image_1_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      )}

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Chapter badge */}
        {story.chapter && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onChapterClick?.(story.chapter!.slug) }}
            className={`self-start text-xs font-medium px-2.5 py-1 rounded-full border transition-opacity hover:opacity-70 ${chapterColor}`}
          >
            {translatedChapterName || story.chapter.name}
          </button>
        )}

        {/* Excerpt */}
        <p className="text-sm text-gray-700 line-clamp-4 flex-1 leading-relaxed">
          {excerpt}
        </p>

        {/* Tags */}
        {story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {story.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => { e.preventDefault(); onTagClick?.(tag) }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
            <span className="truncate">{displayName}</span>
            {story.is_seed && (
              <span className="bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0">{historicalBadge}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onCountryClick?.(story.country) }}
              className="hover:text-emerald-600 transition-colors"
            >
              {story.city ? `${story.city}, ` : ''}{getCountryName(story.country, lang)}
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onYearClick?.(story.occurred_year) }}
              className="hover:text-emerald-600 transition-colors"
            >
              {story.occurred_year}
            </button>
          </div>
        </div>

        {/* World event */}
        {story.world_event && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onEventClick?.(story.world_event!.id) }}
            className="self-start text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full hover:opacity-70 transition-opacity"
          >
            {story.world_event.name}
          </button>
        )}
      </div>
    </Link>
  )
}

export { CHAPTER_COLORS }
