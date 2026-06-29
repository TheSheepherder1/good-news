'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ArchiveCard, { CHAPTER_COLORS } from '@/components/ArchiveCard'
import { getCountryName } from '@/lib/countries'
import { useArchivePageStrings } from '@/lib/useArchiveStrings'
import { getLangLabel } from '@/lib/languages'

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
  const [translatedOpenings, setTranslatedOpenings] = useState<Record<string, string>>({})
  const [translatedChapters, setTranslatedChapters] = useState<Record<string, string>>({})
  const [translatedEvents, setTranslatedEvents] = useState<Record<string, string>>({})

  const [lang, setLang] = useState('en')
  useEffect(() => {
    const stored = localStorage.getItem('tgif_lang')
    if (stored) setLang(stored)
  }, [])

  const s = useArchivePageStrings(lang)

  // Active filters
  const [chapter, setChapter] = useState('')
  const [country, setCountry] = useState('')
  const [year, setYear] = useState('')
  const [event, setEvent] = useState('')
  const [language, setLanguage] = useState('')
  const [tag, setTag] = useState('')
  const [author, setAuthor] = useState('')
  const [authorInput, setAuthorInput] = useState('')
  const [authorSuggestions, setAuthorSuggestions] = useState<{ name: string; story_count: number }[]>([])
  const [authorFocused, setAuthorFocused] = useState(false)
  const authorDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Filter panel open state
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)

  const offset = useRef(0)
  const PAGE = 24

  const activeCount = [chapter, country, year, event, language, tag, author].filter(Boolean).length

  const buildParams = useCallback((off: number) => {
    const p = new URLSearchParams({ limit: String(PAGE), offset: String(off) })
    if (chapter)  p.set('chapter', chapter)
    if (country)  p.set('country', country)
    if (year)     p.set('year', year)
    if (event)    p.set('event', event)
    if (language) p.set('language', language)
    if (tag)      p.set('tag', tag)
    if (author)   p.set('author', author)
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

  // Batch-translate all story openings when language or stories change
  useEffect(() => {
    if (lang === 'en' || stories.length === 0) {
      setTranslatedOpenings({})
      return
    }
    let cancelled = false
    const texts = stories.map((s) => s.opening || s.body || '')
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, target: lang }),
    })
      .then((r) => r.json())
      .then((data: { translations?: string[] }) => {
        if (cancelled) return
        const map: Record<string, string> = {}
        stories.forEach((story, i) => {
          if (data.translations?.[i]) map[story.id] = data.translations[i]
        })
        setTranslatedOpenings(map)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [lang, stories])

  // Translate chapter names when language or chapters change
  useEffect(() => {
    if (lang === 'en' || filters.chapters.length === 0) {
      setTranslatedChapters({})
      return
    }
    let cancelled = false
    const texts = filters.chapters.map((c) => c.name)
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, target: lang }),
    })
      .then((r) => r.json())
      .then((data: { translations?: string[] }) => {
        if (cancelled) return
        const map: Record<string, string> = {}
        filters.chapters.forEach((c, i) => {
          if (data.translations?.[i]) map[c.id] = data.translations[i]
        })
        setTranslatedChapters(map)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [lang, filters.chapters])

  // Translate world event names when language or events change
  useEffect(() => {
    if (lang === 'en' || filters.events.length === 0) {
      setTranslatedEvents({})
      return
    }
    let cancelled = false
    const texts = filters.events.map((e) => e.name)
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, target: lang }),
    })
      .then((r) => r.json())
      .then((data: { translations?: string[] }) => {
        if (cancelled) return
        const map: Record<string, string> = {}
        filters.events.forEach((e, i) => {
          if (data.translations?.[i]) map[e.id] = data.translations[i]
        })
        setTranslatedEvents(map)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [lang, filters.events])

  function clearAll() {
    setChapter(''); setCountry(''); setYear(''); setEvent(''); setLanguage(''); setTag('')
    setAuthor(''); setAuthorInput('')
  }

  const hasMore = stories.length < total

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#c8dde6] to-[#f8fbfa]">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/60 px-6 py-4">
        {/* Desktop: single row */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="The Good I Found" className="h-10 w-auto" />
            </Link>
            <Link href="/" className="text-sm font-semibold text-gray-800">{s.todaysNews}</Link>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/archive" className="font-semibold text-gray-800">{s.navArchive}</Link>
            <Link href="/archive/submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-1.5 rounded-full transition-colors">
              {s.navShareStory}
            </Link>
          </nav>
        </div>
        {/* Mobile: logo + Share a Story only */}
        <div className="md:hidden flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="The Good I Found" className="h-10 w-auto" />
          </Link>
          <Link href="/archive/submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-1.5 rounded-full transition-colors text-sm">
            {s.navShareStory}
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Hero text */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{s.archiveTitle}</h1>
          <p className="text-gray-500 max-w-xl mx-auto">{s.archiveSubtitle}</p>
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
              {s.allStories}
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
                  {translatedChapters[c.id] || c.name}
                  <span className="ml-1.5 text-xs opacity-60">{c.count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* More filters row — only shown when stories exist */}
        {!loading && total > 0 && (
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
            {s.filter}
            {activeCount > 0 && (
              <span className="bg-emerald-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{activeCount}</span>
            )}
          </button>

          {/* Active filter chips */}
          {country && <FilterChip label={getCountryName(country, lang)} onRemove={() => setCountry('')} />}
          {year && <FilterChip label={year} onRemove={() => setYear('')} />}
          {event && <FilterChip label={filters.events.find((e) => e.id === event)?.name || event} onRemove={() => setEvent('')} />}
          {language && <FilterChip label={getLangLabel(language)} onRemove={() => setLanguage('')} />}
          {tag && <FilterChip label={`#${tag}`} onRemove={() => setTag('')} />}
          {author && <FilterChip label={`Author: ${author}`} onRemove={() => { setAuthor(''); setAuthorInput('') }} />}
          {activeCount > 1 && (
            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1">
              {s.clearAll}
            </button>
          )}

          <span className="ml-auto text-sm text-gray-400">
            {total} {total === 1 ? s.storySingular : s.storyPlural}
          </span>
        </div>
        )}

        {/* Filter panel */}
        {moreFiltersOpen && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Country */}
            {filters.countries.length > 0 && (
              <FilterSelect
                label={s.filterCountry}
                value={country}
                onChange={setCountry}
                options={filters.countries.map((c) => ({ value: c.value, label: `${getCountryName(c.value, lang)} (${c.count})` }))}
                placeholder={s.anyCountry}
              />
            )}

            {/* Year */}
            {filters.years.length > 0 && (
              <FilterSelect
                label={s.filterYear}
                value={year}
                onChange={setYear}
                options={filters.years.map((y) => ({ value: String(y.value), label: `${y.value} (${y.count})` }))}
                placeholder={s.anyYear}
              />
            )}

            {/* World Event */}
            {filters.events.length > 0 && (
              <FilterSelect
                label={s.filterWorldEvent}
                value={event}
                onChange={setEvent}
                options={filters.events.map((e) => ({ value: e.id, label: `${e.name}${e.event_year ? ` (${e.event_year})` : ''} · ${e.count}` }))}
                placeholder={s.anyEvent}
              />
            )}

            {/* Language */}
            {filters.languages.length > 0 && (
              <FilterSelect
                label={s.filterLanguage}
                value={language}
                onChange={setLanguage}
                options={filters.languages.map((l) => ({ value: l.value, label: `${getLangLabel(l.value)} (${l.count})` }))}
                placeholder={s.anyLanguage}
              />
            )}

            {/* Author name — fuzzy autocomplete */}
            <div className="relative">
              <p className="text-xs font-medium text-gray-500 mb-1">{s.filterAuthor}</p>
              <input
                type="text"
                value={authorInput}
                onChange={(e) => {
                  const val = e.target.value
                  setAuthorInput(val)
                  setAuthor('')
                  if (authorDebounce.current) clearTimeout(authorDebounce.current)
                  if (val.trim().length < 2) { setAuthorSuggestions([]); return }
                  authorDebounce.current = setTimeout(async () => {
                    const res = await fetch(`/api/archive/authors?q=${encodeURIComponent(val.trim())}`)
                    const data = await res.json()
                    setAuthorSuggestions(Array.isArray(data) ? data : [])
                  }, 250)
                }}
                onFocus={() => setAuthorFocused(true)}
                onBlur={() => setTimeout(() => setAuthorFocused(false), 150)}
                placeholder={s.authorPlaceholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              />
              {/* Suggestions dropdown */}
              {authorFocused && authorSuggestions.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {authorSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.name}
                      type="button"
                      onMouseDown={() => {
                        setAuthor(suggestion.name)
                        setAuthorInput(suggestion.name)
                        setAuthorSuggestions([])
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
                    >
                      <span>{suggestion.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{suggestion.story_count} {suggestion.story_count === 1 ? s.storySingular : s.storyPlural}</span>
                    </button>
                  ))}
                </div>
              )}
              {author && (
                <button
                  onClick={() => { setAuthor(''); setAuthorInput(''); setAuthorSuggestions([]) }}
                  className="text-xs text-gray-400 hover:text-red-500 mt-1 transition-colors"
                >
                  {s.clearAuthor}
                </button>
              )}
            </div>

            {/* Tags */}
            {filters.tags.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-2">
                <p className="text-xs font-medium text-gray-500 mb-2">{s.filterTags}</p>
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
          <div className="text-center text-gray-400 py-24">{s.loadingStories}</div>
        ) : stories.length === 0 ? (
          <div className="text-center py-24 max-w-md mx-auto">
            {activeCount > 0 ? (
              <>
                <p className="text-gray-400 mb-3">{s.noStoriesFiltered}</p>
                <button onClick={clearAll} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                  {s.clearAllFilters}
                </button>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">📖</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">{s.emptyTitle}</h2>
                <p className="text-gray-400 mb-6">{s.emptyBody}</p>
                <Link
                  href="/archive/submit"
                  className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  {s.emptyShareFirst}
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {stories.map((story) => (
                <ArchiveCard
                  key={story.id}
                  story={story}
                  lang={lang}
                  translatedOpening={translatedOpenings[story.id]}
                  translatedChapterName={story.chapter ? translatedChapters[story.chapter.id] : undefined}
                  translatedEventName={story.world_event ? translatedEvents[story.world_event.id] : undefined}
                  historicalBadge={s.historicalBadge}
                  anonymousLabel={s.anonymous}
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
                  {loadingMore ? s.loadingMore : s.loadMore.replace('{n}', String(total - stories.length))}
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
