'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import StoryCard from '@/components/StoryCard'
import SectionNav from '@/components/SectionNav'
import ArticleSheet from '@/components/ArticleSheet'
import FooterModal from '@/components/FooterModal'
import LanguagePicker from '@/components/LanguagePicker'
import { type Story } from '@/lib/supabase'
import { UI, LANGUAGES, type Language, LANG_STORAGE_KEY } from '@/lib/translations'
import { renderSummaryMarkdown } from '@/lib/summaryMarkdown'
import LikeButton from '@/components/LikeButton'
import BookmarkButton from '@/components/BookmarkButton'
import BookmarksPanel from '@/components/BookmarksPanel'
import { getBookmarks } from '@/lib/bookmarks'

type Section = { category: string; stories: Story[] }
type TranslatedStory = { title: string; summary: string }

type Props = {
  featured: Story | null
  sections: Section[]
  publishDate: string | null
  siteContent?: Record<string, string>
}

const SECTION_ORDER_KEY = 'section_order'

function slugify(cat: string) {
  return cat.toLowerCase().replace(/\s+/g, '-')
}

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

function renderBlock(text: string, i: number, isLast: boolean): React.ReactNode {
  const lines = text.split('\n')
  const bulletLines = lines.filter((l) => l.startsWith('- '))
  if (bulletLines.length > 0 && bulletLines.length === lines.filter((l) => l.trim()).length) {
    return (
      <ul key={i} className="list-disc pl-6 flex flex-col gap-1">
        {bulletLines.map((l, j) => <li key={j}>{parseInline(l.slice(2))}</li>)}
      </ul>
    )
  }
  return (
    <p key={i} className={isLast ? 'font-semibold text-gray-800' : ''}>
      {parseInline(text)}
    </p>
  )
}

function matches(story: Story, translated: TranslatedStory | undefined, query: string): boolean {
  const q = query.toLowerCase()
  const title = (translated?.title || story.title).toLowerCase()
  const summary = (translated?.summary || story.summary || '').toLowerCase()
  return title.includes(q) || summary.includes(q) || story.source.toLowerCase().includes(q)
}

async function translateBatch(texts: string[], target: string): Promise<string[]> {
  if (!texts.length || target === 'en') return texts
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, target }),
    })
    const data = await res.json()
    return data.translations ?? texts
  } catch {
    return texts
  }
}

export default function PublicFeed({ featured, sections, publishDate, siteContent = {} }: Props) {
  const [sheetStory, setSheetStory] = useState<Story | null>(null)
  const [sheetDisplay, setSheetDisplay] = useState<{ title: string; summary: string } | null>(null)
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const [localDate, setLocalDate] = useState<string | null>(null)
  const lastScrollY = useRef(0)
  const scrollDelta = useRef(0)
  const isTransitioning = useRef(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [nearBottom, setNearBottom] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [modal, setModal] = useState<'about' | 'ai-policy' | 'advertising' | null>(null)
  const [aboutTranslations, setAboutTranslations] = useState<Record<string, string[]>>({})
  const [translatingAbout, setTranslatingAbout] = useState(false)
  const [lang, setLang] = useState<Language>('en')
  const [translating, setTranslating] = useState(false)
  // Cache: lang → Map<storyId, TranslatedStory>
  const cache = useRef<Partial<Record<Language, Map<string, TranslatedStory>>>>({})
  const [currentTranslations, setCurrentTranslations] = useState<Map<string, TranslatedStory>>(new Map())
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [userOrder, setUserOrder] = useState<string[] | null>(null)
  const [bookmarksOpen, setBookmarksOpen] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)

  const aboutParagraphs = (siteContent.about_text || '').split('\n\n').filter(Boolean)

  async function openAboutModal() {
    setModal('about')
    if (lang === 'en' || aboutTranslations[lang]) return
    setTranslatingAbout(true)
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: aboutParagraphs, target: lang }),
    })
    const data = await res.json()
    if (data.translations) {
      setAboutTranslations((prev) => ({ ...prev, [lang]: data.translations }))
    }
    setTranslatingAbout(false)
  }

  const currentAboutParagraphs = (lang !== 'en' && aboutTranslations[lang]) ? aboutTranslations[lang] : aboutParagraphs

  useEffect(() => {
    setLocalDate(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(SECTION_ORDER_KEY)
    if (stored) {
      try { setUserOrder(JSON.parse(stored)) } catch { /* ignore corrupt data */ }
    }
  }, [])

  useEffect(() => {
    setBookmarkCount(getBookmarks().length)
    function onUpdate() { setBookmarkCount(getBookmarks().length) }
    window.addEventListener('tgif:bookmarks-updated', onUpdate)
    return () => window.removeEventListener('tgif:bookmarks-updated', onUpdate)
  }, [])

  // Apply the reader's saved section order. "New!" is always pinned first.
  // Any section added to the site after the reader saved their order appends at the end.
  const displaySections = useMemo(() => {
    const pinned = sections.filter((s) => s.category === 'New!')
    const reorderable = sections.filter((s) => s.category !== 'New!')
    if (!userOrder) return sections
    return [
      ...pinned,
      ...[
        ...userOrder
          .map((cat) => reorderable.find((s) => s.category === cat))
          .filter((s): s is Section => s != null),
        ...reorderable.filter((s) => !userOrder.includes(s.category)),
      ],
    ]
  }, [sections, userOrder])

  function handleReorder(category: string, direction: 'up' | 'down') {
    const reorderableCats = displaySections
      .filter((s) => s.category !== 'New!')
      .map((s) => s.category)
    const idx = reorderableCats.indexOf(category)
    if (idx === -1) return
    const newOrder = [...reorderableCats]
    if (direction === 'up' && idx > 0) {
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
    } else if (direction === 'down' && idx < newOrder.length - 1) {
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
    } else return
    setUserOrder(newOrder)
    localStorage.setItem(SECTION_ORDER_KEY, JSON.stringify(newOrder))
  }

  useEffect(() => {
    const THRESHOLD = 12
    function handleScroll() {
      if (isTransitioning.current) return
      const current = window.scrollY
      const diff = current - lastScrollY.current
      lastScrollY.current = current

      if (current > 80) setHasScrolled(true)
      setNearBottom(current + window.innerHeight >= document.documentElement.scrollHeight - 80)

      if (current < 60) {
        setHeaderCollapsed(false)
        scrollDelta.current = 0
        return
      }

      if (diff > 0) {
        scrollDelta.current = Math.max(0, scrollDelta.current) + diff
        if (scrollDelta.current > THRESHOLD) {
          isTransitioning.current = true
          setHeaderCollapsed(true)
          scrollDelta.current = 0
          setTimeout(() => { isTransitioning.current = false }, 350)
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function scrollToSection(id: string) {
    if (id === '__top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.getElementById(id)
    if (!el) return
    const headerHeight = headerRef.current?.offsetHeight ?? 220
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const t = UI[lang]

  // Deduplicate by ID — "New!" section contains the same stories as their
  // regular sections, so we avoid double-translating or double-searching them.
  const allStories = [
    ...(featured ? [featured] : []),
    ...displaySections.flatMap((s) => s.stories),
  ].filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i)

  const handleLanguageChange = useCallback(async (newLang: Language) => {
    setLang(newLang)
    localStorage.setItem(LANG_STORAGE_KEY, newLang)
    if (newLang === 'en') {
      setCurrentTranslations(new Map())
      return
    }
    // Use cache if available
    if (cache.current[newLang]) {
      setCurrentTranslations(cache.current[newLang]!)
      return
    }
    setTranslating(true)
    // Send all titles and summaries in one server call
    const titles = allStories.map((s) => s.title)
    const summaries = allStories.map((s) => s.summary || '')
    const [translatedTitles, translatedSummaries] = await Promise.all([
      translateBatch(titles, newLang),
      translateBatch(summaries, newLang),
    ])
    const map = new Map<string, TranslatedStory>()
    allStories.forEach((story, i) => {
      map.set(story.id, {
        title: translatedTitles[i] || story.title,
        summary: translatedSummaries[i] || story.summary || '',
      })
    })
    cache.current[newLang] = map
    setCurrentTranslations(map)
    setTranslating(false)
  }, [allStories])

  // Restore the reader's previously chosen language on first load
  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as Language | null
    if (stored && stored !== 'en' && LANGUAGES.some((l) => l.code === stored)) {
      handleLanguageChange(stored)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const query = searchQuery.trim()
  const isSearching = query.length > 0

  const filteredFeatured = featured && (!isSearching || matches(featured, currentTranslations.get(featured.id), query)) ? featured : null
  const filteredSections = displaySections
    .filter((s) => !isSearching || s.category !== 'New!')
    .map((s) => ({
      ...s,
      stories: isSearching
        ? s.stories.filter((st) => matches(st, currentTranslations.get(st.id), query))
        : s.stories,
    }))
    .filter((s) => s.stories.length > 0)

  const totalResults = (filteredFeatured ? 1 : 0) + filteredSections.reduce((n, s) => n + s.stories.length, 0)
  const sortedCategories = filteredSections.map((s) => s.category)

  function getDisplayTitle(story: Story) {
    return currentTranslations.get(story.id)?.title || story.title
  }
  function getDisplaySummary(story: Story) {
    return currentTranslations.get(story.id)?.summary || story.summary || ''
  }
  function getCategoryLabel(cat: string) {
    return t.categories[cat] || cat
  }

  function handleOpen(story: Story) {
    setSheetStory(story)
    setSheetDisplay({ title: getDisplayTitle(story), summary: getDisplaySummary(story) })
  }

  function openMobileSearch() {
    setMobileSearchOpen(true)
    setTimeout(() => mobileInputRef.current?.focus(), 50)
  }

  function closeMobileSearch() {
    setMobileSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <>
      <ArticleSheet story={sheetStory} onClose={() => { setSheetStory(null); setSheetDisplay(null) }} displayTitle={sheetDisplay?.title} displaySummary={sheetDisplay?.summary} lang={lang} />
      {bookmarksOpen && <BookmarksPanel onClose={() => setBookmarksOpen(false)} />}

      <div ref={headerRef} className="sticky top-0 z-40 backdrop-blur-sm shadow-sm" style={{ backgroundColor: 'rgba(200, 221, 230, 0.95)' }}>
        <header className={`max-w-7xl mx-auto px-4 text-center transition-all duration-1000 ease-out ${headerCollapsed ? 'pt-2 pb-4' : 'pt-5 pb-4 md:pt-10 md:pb-6'}`}>

          {/* Mobile: search bar open */}
          {mobileSearchOpen ? (
            <div className="flex items-center gap-2 py-1 md:hidden">
              <div className="flex-1 flex items-center gap-2 bg-white border border-emerald-300 rounded-full px-4 py-2 shadow-sm">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none"
                  style={{ fontSize: '16px' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button onClick={closeMobileSearch} className="text-sm text-gray-500 font-medium whitespace-nowrap">
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className={`overflow-hidden transition-all duration-1000 ease-out ${headerCollapsed ? 'max-h-0 opacity-0 mt-0' : 'max-h-72 opacity-100'}`}>
                <h1 className="flex justify-center">
                  <img src="/logo.svg" alt="The Good I Found" height={90} className="h-[72px] md:h-[90px] w-auto" />
                </h1>
                <p className="mt-2 text-gray-600 text-base">{t.tagline}</p>
                {localDate && (
                  <p className="mt-1 text-emerald-500 text-base">{localDate}</p>
                )}
              </div>
              {(featured || sections.length > 0) && (
                <div className="mt-4 flex justify-center items-center gap-3 flex-wrap">
                  <SectionNav
                    categories={sortedCategories}
                    categoryLabels={t.categories}
                    hasFeatured={!!filteredFeatured}
                    topOfPageLabel={t.topOfPage}
                    sectionsLabel={t.sections}
                    featuredLabel={t.brightSpot}
                    onNavigate={scrollToSection}
                    onReorder={handleReorder}
                    pinnedCategories={['New!']}
                  />

                  {/* Desktop search */}
                  <div className="hidden md:flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm w-56 hover:border-emerald-300 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                      ref={desktopInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
                    />
                    {searchQuery && (
                      <button onClick={() => { setSearchQuery(''); desktopInputRef.current?.focus() }} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Language picker — desktop and mobile */}
                  <LanguagePicker current={lang} translating={translating} onChange={handleLanguageChange} />

                  {/* Mobile search icon */}
                  <button
                    onClick={openMobileSearch}
                    className="md:hidden flex items-center justify-center w-9 h-9 bg-white border border-gray-200 rounded-full shadow-sm hover:border-emerald-400 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                  </button>

                  {/* Bookmarks */}
                  <button
                    onClick={() => setBookmarksOpen(true)}
                    aria-label="Saved stories"
                    className="relative flex items-center justify-center w-9 h-9 bg-white border border-gray-200 rounded-full shadow-sm hover:border-emerald-400 hover:text-emerald-700 text-gray-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                    {bookmarkCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {bookmarkCount > 9 ? '9+' : bookmarkCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </header>
      </div>

      <section className="max-w-7xl mx-auto px-4 pb-16 pt-4 flex flex-col gap-16">
        {isSearching && (
          <p className="text-sm text-gray-400 -mb-6 pt-4">
            {totalResults === 0
              ? t.noResults(query)
              : t.resultCount(totalResults, query)}
          </p>
        )}

        {!isSearching && featured === null && sections.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-lg">{t.noStories}</div>
        ) : (
          <>
            {filteredFeatured && (
              <div id="featured" className="scroll-mt-56 md:scroll-mt-60 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-white/70">
                <h2 className="text-[1.35rem] font-semibold uppercase tracking-widest mb-3" style={{ color: '#F0B429' }}>
                  {t.brightSpot}
                </h2>
                <div
                  className="bg-white rounded-3xl shadow-md overflow-hidden flex flex-col md:grid md:grid-cols-3 cursor-pointer md:cursor-default border-4"
                  style={{ borderColor: '#F0B429' }}
                  onClick={() => handleOpen(filteredFeatured)}
                >
                  {filteredFeatured.image_url && (
                    <img
                      src={filteredFeatured.image_url}
                      alt=""
                      className="w-full h-52 md:h-full object-cover md:col-span-1"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div className={`p-6 flex flex-col gap-3 justify-center ${filteredFeatured.image_url ? 'md:col-span-2' : 'md:col-span-3'}`}>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {getCategoryLabel(filteredFeatured.category || filteredFeatured.source)}
                      </span>
                      <span>{t.sourcePrefix}{filteredFeatured.source}</span>
                      <LikeButton storyId={filteredFeatured.id} initialCount={filteredFeatured.likes ?? 0} />
                      <BookmarkButton story={filteredFeatured} displayTitle={getDisplayTitle(filteredFeatured)} />
                    </div>
                    <p className="text-gray-900 font-bold text-xl leading-snug line-clamp-3">
                      {getDisplayTitle(filteredFeatured)}
                    </p>
                    {filteredFeatured.summary && (
                      filteredFeatured.content_format === 'rich' ? (
                        <div className="text-gray-500 text-sm leading-relaxed line-clamp-4">
                          {renderSummaryMarkdown(getDisplaySummary(filteredFeatured))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-4">
                          {getDisplaySummary(filteredFeatured)}
                        </p>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isSearching && filteredSections.length > 0 && (
              <div className="hidden md:flex items-center justify-center gap-4 -my-8">
                <Link
                  href="/contribute"
                  className="flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-2xl border border-emerald-100 py-2 px-6 shadow-sm hover:bg-white/60 hover:border-emerald-200 transition-all group"
                >
                  <span className="text-lg">✍️</span>
                  <span className="text-emerald-700 font-semibold text-sm group-hover:text-emerald-800 transition-colors">{t.shareStoryWithUs}</span>
                </Link>
                <a
                  href="https://ko-fi.com/thegoodifound"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white/40 backdrop-blur-sm rounded-2xl border border-blue-100 py-2 px-6 shadow-sm hover:bg-white/60 hover:border-blue-200 transition-all group"
                >
                  <span className="text-rose-500 text-lg">❤️</span>
                  <span className="text-blue-700 text-sm">{t.enjoyingGoodNews}</span>
                  <span className="text-blue-700 font-semibold text-sm group-hover:text-blue-800 transition-colors">{t.supportTheGood} →</span>
                </a>
              </div>
            )}

            {filteredSections.map(({ category, stories }, index) => (
              <React.Fragment key={category}>
                <div id={slugify(category)} className="scroll-mt-56 md:scroll-mt-60 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-white/70">
                  <h2 className="text-lg font-semibold text-emerald-800 uppercase tracking-widest mb-5">
                    {getCategoryLabel(category)}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {stories.map((story) => (
                      <StoryCard
                        key={story.id}
                        story={story}
                        onOpen={handleOpen}
                        displayTitle={getDisplayTitle(story)}
                        displaySummary={getDisplaySummary(story)}
                        sourcePrefix={t.sourcePrefix}
                        categoryLabel={getCategoryLabel(story.category || story.source)}
                      />
                    ))}
                  </div>
                </div>

                {!isSearching && (index + 1) % 3 === 0 && (
                  <div className="hidden md:flex items-center justify-center gap-4 -my-8">
                    <Link
                      href="/contribute"
                      className="flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-2xl border border-emerald-100 py-2 px-6 shadow-sm hover:bg-white/60 hover:border-emerald-200 transition-all group"
                    >
                      <span className="text-lg">✍️</span>
                      <span className="text-emerald-700 font-semibold text-sm group-hover:text-emerald-800 transition-colors">{t.shareStoryWithUs}</span>
                    </Link>
                    <a
                      href="https://ko-fi.com/thegoodifound"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white/40 backdrop-blur-sm rounded-2xl border border-blue-100 py-2 px-6 shadow-sm hover:bg-white/60 hover:border-blue-200 transition-all group"
                    >
                      <span className="text-rose-500 text-lg">❤️</span>
                      <span className="text-blue-700 text-sm">{t.enjoyingGoodNews}</span>
                      <span className="text-blue-700 font-semibold text-sm group-hover:text-blue-800 transition-colors">{t.supportTheGood} →</span>
                    </a>
                  </div>
                )}
              </React.Fragment>
            ))}

            {isSearching && totalResults === 0 && (
              <div className="text-center text-gray-400 py-20 text-lg">{t.noResults(query)}</div>
            )}
          </>
        )}
      </section>

      <footer className="border-t border-gray-200 mt-4 py-6 text-center text-xs text-gray-400 px-4 flex flex-col gap-3">
        <div className="flex justify-center gap-6 flex-wrap">
          <button onClick={openAboutModal} className="hover:text-emerald-600 transition-colors font-medium">{t.about}</button>
          <button onClick={() => setModal('ai-policy')} className="hover:text-emerald-600 transition-colors font-medium">{t.aiPolicy}</button>
          <button onClick={() => setModal('advertising')} className="hover:text-emerald-600 transition-colors font-medium">{t.advertisingPolicy}</button>
          <Link href="/contribute" className="hover:text-emerald-600 transition-colors font-medium">{t.shareStory}</Link>
          <a
            href="https://ko-fi.com/thegoodifound"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-rose-500 transition-colors font-medium"
          >
            {t.supportUs}
          </a>
          <a
            href="/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RSS Feed"
            className="hover:text-orange-500 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
            </svg>
            RSS
          </a>
        </div>
        <p>{t.footerCopyright}</p>
      </footer>

      {modal === 'about' && (
        <FooterModal title={siteContent.about_title || 'About The Good I Found'} onClose={() => setModal(null)}>
          {translatingAbout ? (
            <p className="text-gray-400 italic">Translating…</p>
          ) : (
            <div className="flex flex-col gap-4">
              {currentAboutParagraphs.map((para, i) => renderBlock(para, i, i === currentAboutParagraphs.length - 1))}
            </div>
          )}
        </FooterModal>
      )}
      {modal === 'ai-policy' && (
        <FooterModal title={siteContent.ai_policy_title || t.aiPolicy} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-4">
            {(siteContent.ai_policy_text || 'Content coming soon.').split('\n\n').filter(Boolean).map((p, i, arr) => renderBlock(p, i, i === arr.length - 1))}
          </div>
        </FooterModal>
      )}
      {modal === 'advertising' && (
        <FooterModal title={siteContent.advertising_title || t.advertisingPolicy} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-4">
            {(siteContent.advertising_text || 'Content coming soon.').split('\n\n').filter(Boolean).map((p, i, arr) => renderBlock(p, i, i === arr.length - 1))}
          </div>
        </FooterModal>
      )}

      {/* Mobile floating support button — appears after first scroll */}
      <a
        href="https://ko-fi.com/thegoodifound"
        target="_blank"
        rel="noopener noreferrer"
        className={`md:hidden fixed bottom-6 right-4 z-30 flex items-center gap-2 bg-white border border-blue-200 shadow-lg rounded-full px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-all duration-300 ${hasScrolled && !nearBottom ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <span>❤️</span>
        <span>{t.supportTheGood}</span>
      </a>
    </>
  )
}
