'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useArchivePageStrings } from '@/lib/useArchiveStrings'
import { getCountryName, LANG_TO_LOCALE } from '@/lib/countries'

type WorldEvent = { id: string; name: string; event_year: number | null }
type Character = { name: string }

type Props = {
  displayName: string
  isSeed: boolean
  relationship: string | null
  city: string | null
  stateProvince: string | null
  country: string | null
  occurredYear: number
  occurredMonth: number | null
  characters: Character[]
  worldEvent: WorldEvent | null
  tags: string[]
}

export default function ArchiveStoryDetailMeta({
  displayName, isSeed, relationship,
  city, stateProvince, country, occurredYear, occurredMonth,
  characters, worldEvent, tags,
}: Props) {
  const [lang, setLang] = useState('en')
  useEffect(() => {
    const stored = localStorage.getItem('tgif_lang')
    if (stored) setLang(stored)
  }, [])
  const s = useArchivePageStrings(lang)

  const locale = LANG_TO_LOCALE[lang] || lang
  const monthName = occurredMonth
    ? new Date(2000, occurredMonth - 1).toLocaleString(locale, { month: 'long' })
    : null
  const countryName = country ? getCountryName(country, lang) : null

  return (
    <>
      {/* Story metadata */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 mt-8 flex flex-col gap-3 text-sm border border-white/60">

        {/* Author */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-500">{s.storySharedBy} </span>
            <span className="font-medium text-gray-800">{displayName}</span>
            {isSeed && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                {s.historicalBadge}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{relationship}</span>
        </div>

        {/* Location + time */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500">
          <span>
            {[city, stateProvince].filter(Boolean).join(', ')}
            {(city || stateProvince) && countryName ? ', ' : ''}
            {countryName}
          </span>
          <span>{monthName ? `${monthName} ${occurredYear}` : String(occurredYear)}</span>
        </div>

        {/* Characters */}
        {characters.length > 0 && (
          <div className="text-gray-500">
            <span className="text-gray-400">{s.peopleLabel}: </span>
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
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
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
          {s.backToArchive}
        </Link>
        <Link
          href="/archive/submit"
          className="flex-1 text-center bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {s.shareYourStory}
        </Link>
      </div>
    </>
  )
}
