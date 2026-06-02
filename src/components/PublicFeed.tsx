'use client'

import { useState, useRef, useCallback } from 'react'
import StoryCard from '@/components/StoryCard'
import SectionNav from '@/components/SectionNav'
import ArticleSheet from '@/components/ArticleSheet'
import FooterModal from '@/components/FooterModal'
import LanguagePicker from '@/components/LanguagePicker'
import { type Story } from '@/lib/supabase'
import { UI, type Language } from '@/lib/translations'

type Section = { category: string; stories: Story[] }
type TranslatedStory = { title: string; summary: string }

type Props = {
  featured: Story | null
  sections: Section[]
  publishDate: string | null
}

function slugify(cat: string) {
  return cat.toLowerCase().replace(/\s+/g, '-')
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

export default function PublicFeed({ featured, sections, publishDate }: Props) {
  const [sheetStory, setSheetStory] = useState<Story | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [modal, setModal] = useState<'about' | 'ai-policy' | 'advertising' | null>(null)
  const [lang, setLang] = useState<Language>('en')
  const [translating, setTranslating] = useState(false)
  // Cache: lang → Map<storyId, TranslatedStory>
  const cache = useRef<Partial<Record<Language, Map<string, TranslatedStory>>>>({})
  const [currentTranslations, setCurrentTranslations] = useState<Map<string, TranslatedStory>>(new Map())
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const desktopInputRef = useRef<HTMLInputElement>(null)

  const t = UI[lang]

  const allStories = [
    ...(featured ? [featured] : []),
    ...sections.flatMap((s) => s.stories),
  ]

  const handleLanguageChange = useCallback(async (newLang: Language) => {
    setLang(newLang)
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

  const query = searchQuery.trim()
  const isSearching = query.length > 0

  const filteredFeatured = featured && (!isSearching || matches(featured, currentTranslations.get(featured.id), query)) ? featured : null
  const filteredSections = sections
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
    if (window.innerWidth >= 768) {
      window.open(story.url, '_blank', 'noopener,noreferrer')
    } else {
      setSheetStory(story)
    }
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
      <ArticleSheet story={sheetStory} onClose={() => setSheetStory(null)} />

      <div className="sticky top-0 z-40 backdrop-blur-sm shadow-sm" style={{ backgroundColor: 'rgba(200, 230, 221, 0.95)' }}>
        <header className="max-w-7xl mx-auto px-4 pt-5 pb-4 md:pt-10 md:pb-6 text-center">

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
              <h1 className="text-[2.7rem] font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-merriweather)' }}>
                {t.siteTitle}
              </h1>
              <p className="mt-2 text-gray-500 text-lg">{t.tagline}</p>
              {publishDate && (
                <p className="mt-1 text-emerald-600 font-medium text-sm">{publishDate}</p>
              )}
              {(featured || sections.length > 0) && (
                <div className="mt-4 flex justify-center items-center gap-3 flex-wrap">
                  <SectionNav
                    categories={sortedCategories}
                    categoryLabels={t.categories}
                    hasFeatured={!!filteredFeatured}
                    topOfPageLabel={t.topOfPage}
                    sectionsLabel={t.sections}
                    featuredLabel={t.brightSpot}
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
              <div id="featured" className="scroll-mt-56 md:scroll-mt-60">
                <h2 className="text-[1.35rem] font-semibold uppercase tracking-widest mb-3" style={{ color: '#D4A017' }}>
                  {t.brightSpot}
                </h2>
                <div
                  className="bg-white rounded-3xl shadow-md border border-yellow-200 overflow-hidden flex flex-col md:grid md:grid-cols-3 cursor-pointer md:cursor-default"
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
                    </div>
                    <p className="text-gray-900 font-bold text-xl leading-snug line-clamp-3">
                      {getDisplayTitle(filteredFeatured)}
                    </p>
                    {filteredFeatured.summary && (
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-4">
                        {getDisplaySummary(filteredFeatured)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {filteredSections.map(({ category, stories }) => (
              <div key={category} id={slugify(category)} className="scroll-mt-56 md:scroll-mt-60 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-white/70">
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
            ))}

            {isSearching && totalResults === 0 && (
              <div className="text-center text-gray-400 py-20 text-lg">{t.noResults(query)}</div>
            )}
          </>
        )}
      </section>

      <footer className="border-t border-gray-200 mt-4 py-6 text-center text-xs text-gray-400 px-4 flex flex-col gap-3">
        <div className="flex justify-center gap-6">
          <button onClick={() => setModal('about')} className="hover:text-emerald-600 transition-colors font-medium">{t.about}</button>
          <button onClick={() => setModal('ai-policy')} className="hover:text-emerald-600 transition-colors font-medium">{t.aiPolicy}</button>
          <button onClick={() => setModal('advertising')} className="hover:text-emerald-600 transition-colors font-medium">{t.advertisingPolicy}</button>
        </div>
        <p>{t.footerCopyright}</p>
      </footer>

      {modal === 'about' && (
        <FooterModal title={t.about} onClose={() => setModal(null)}>
          <p>Content coming soon.</p>
        </FooterModal>
      )}
      {modal === 'ai-policy' && (
        <FooterModal title={t.aiPolicy} onClose={() => setModal(null)}>
          <p>Content coming soon.</p>
        </FooterModal>
      )}
      {modal === 'advertising' && (
        <FooterModal title={t.advertisingPolicy} onClose={() => setModal(null)}>
          <p>Content coming soon.</p>
        </FooterModal>
      )}
    </>
  )
}
