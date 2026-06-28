'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ArchiveCard, { CHAPTER_COLORS } from '@/components/ArchiveCard'

const LANG_LABELS: Record<string, string> = {
  en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch',
  pt: 'Português', zh: '中文', ja: '日本語', ar: 'العربية',
  nl: 'Nederlands', pl: 'Polski', sr: 'Srpski', it: 'Italiano',
  ru: 'Русский', ko: '한국어', hi: 'हिंदी',
}

type Story = {
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
  tags: string[]
  chapter: { id: string; name: string; slug: string } | null
  world_event: { id: string; name: string } | null
}

type FilterOptions = {
  chapters: { id: string; name: string; slug: string; count: number }[]
  countries: { value: string; count: number }[]
  years: { value: number; count: number }[]
  events: { id: string; name: string; event_year: number | null; count: number }[]
  languages: { value: string; count: number }[]
  tags: { value: string; count: number }[]
}

const EMPTY_FILTERS: FilterOptions = {
  chapters: [], countries: [], years: [], events: [], languages: [], tags: [],
}

export default function ArchivePage() {
  const [stories, setStories] = useState<Story[]>([])
  const [filters, setFilters] = useState<FilterOptions>(EMPTY_FILTERS)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Active filters
  const [chapter, setChapter] = useState('')
  const [country, setCountry] = useState('')
  const [year, setYear] = useState('')
  const [event, setEvent] = useState('')
  const [language, setLanguage] = useState('')
  const [tag, setTag] = useState('')

  // Filter panel open state
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)

  const offset = useRef(0)
  const PAGE = 24

  const activeCount = [chapter, country, year, event, language, tag].filter(Boolean).length

  const buildParams = useCallback((off: number) => {
    const p = new URLSearchParams({ limit: String(PAGE), offset: String(off) })
    if (chapter)  p.set('chapter', chapter)
    if (country)  p.set('country', country)
    if (year)     p.set('year', year)
    if (event)    p.set('event', event)
    if (language) p.set('language', language)
    if (tag)      p.set('tag', tag)
    return p
  }, [chapter, country, year, event, language, tag])

  const fetchStories = useCallback(async () => {
    setLoading(true)
    offset.current = 0
    const res = await fetch(`/api/archive/stories?${buildParams(0)}`)
    const data = await res.json()
    setStories(data.stories || [])
    setFilters(data.filters || EMPTY_FILTERS)
    setTotal(data.total || 0)
    setLoading(false)
  }, [buildParams])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    offset.current += PAGE
    const res = await fetch(`/api/archive/stories?${buildParams(offset.current)}`)
    const data = await res.json()
    setStories((prev) => [...prev, ...(data.stories || [])])
    setLoadingMore(false)
  }, [buildParams])

  useEffect(() => { fetchStories() }, [fetchStories])

  function clearAll() {
    setChapter(''); setCountry(''); setYear(''); setEvent(''); setLanguage(''); setTag('')
  }

  const hasMore = stories.length < total

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#c8dde6] to-[#f8fbfa]">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/60 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="The Good I Found" className="h-10 w-auto" />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/archive" className="font-semibold text-gray-800">Archive</Link>
          <Link
            href="/archive/submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-1.5 rounded-full transition-colors"
          >
            Share a Story
          </Link>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Hero text */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">The Archive of Human Goodness</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            A permanent record of human kindness, courage, and goodness — collected from every corner of the world.
          </p>
        </div>

        {/* Chapter pills */}
        {filters.chapters.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <button
              onClick={() => setChapter('')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                !chapter
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              All Stories
            </button>
            {filters.chapters.map((c) => {
              const colorClass = CHAPTER_COLORS[c.slug] || 'bg-gray-50 text-gray-600 border-gray-200'
              const isActive = chapter === c.slug
              return (
                <button
                  key={c.id}
                  onClick={() => setChapter(chapter === c.slug ? '' : c.slug)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    isActive
                      ? colorClass + ' font-semibold shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {c.name}
                  <span className="ml-1.5 text-xs opacity-60">{c.count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* More filters row */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setMoreFiltersOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              moreFiltersOpen || activeCount > (chapter ? 1 : 0)
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filter
            {activeCount > 0 && (
              <span className="bg-emerald-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{activeCount}</span>
            )}
          </button>

          {/* Active filter chips */}
          {country && <FilterChip label={country} onRemove={() => setCountry('')} />}
          {year && <FilterChip label={year} onRemove={() => setYear('')} />}
          {event && <FilterChip label={filters.events.find((e) => e.id === event)?.name || event} onRemove={() => setEvent('')} />}
          {language && <FilterChip label={LANG_LABELS[language] || language} onRemove={() => setLanguage('')} />}
          {tag && <FilterChip label={`#${tag}`} onRemove={() => setTag('')} />}
          {activeCount > 1 && (
            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1">
              Clear all
            </button>
          )}

          <span className="ml-auto text-sm text-gray-400">
            {loading ? '…' : `${total} ${total === 1 ? 'story' : 'stories'}`}
          </span>
        </div>

        {/* Filter panel */}
        {moreFiltersOpen && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Country */}
            {filters.countries.length > 0 && (
              <FilterSelect
                label="Country"
                value={country}
                onChange={setCountry}
                options={filters.countries.map((c) => ({ value: c.value, label: `${c.value} (${c.count})` }))}
                placeholder="Any country"
              />
            )}

            {/* Year */}
            {filters.years.length > 0 && (
              <FilterSelect
                label="Year"
                value={year}
                onChange={setYear}
                options={filters.years.map((y) => ({ value: String(y.value), label: `${y.value} (${y.count})` }))}
                placeholder="Any year"
              />
            )}

            {/* World Event */}
            {filters.events.length > 0 && (
              <FilterSelect
                label="World Event"
                value={event}
                onChange={setEvent}
                options={filters.events.map((e) => ({ value: e.id, label: `${e.name}${e.event_year ? ` (${e.event_year})` : ''} · ${e.count}` }))}
                placeholder="Any event"
              />
            )}

            {/* Language */}
            {filters.languages.length > 0 && (
              <FilterSelect
                label="Language"
                value={language}
                onChange={setLanguage}
                options={filters.languages.map((l) => ({ value: l.value, label: `${LANG_LABELS[l.value] || l.value} (${l.count})` }))}
                placeholder="Any language"
              />
            )}

            {/* Tags */}
            {filters.tags.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {filters.tags.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTag(tag === t.value ? '' : t.value)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        tag === t.value
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      #{t.value}
                      <span className="ml-1 opacity-60">{t.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stories grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-24">Loading stories…</div>
        ) : stories.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 mb-3">No stories found for these filters.</p>
            <button onClick={clearAll} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {stories.map((story) => (
                <ArchiveCard
                  key={story.id}
                  story={story}
                  onChapterClick={setChapter}
                  onCountryClick={setCountry}
                  onYearClick={(y) => setYear(String(y))}
                  onEventClick={setEvent}
                  onTagClick={setTag}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-white border border-gray-200 hover:border-emerald-300 text-gray-600 font-medium px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : `Load more stories (${total - stories.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors leading-none">×</button>
    </span>
  )
}

function FilterSelect({
  label, value, onChange, options, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
