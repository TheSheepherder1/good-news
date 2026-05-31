'use client'

import { useState, useRef } from 'react'
import StoryCard from '@/components/StoryCard'
import SectionNav from '@/components/SectionNav'
import ArticleSheet from '@/components/ArticleSheet'
import FooterModal from '@/components/FooterModal'
import { type Story } from '@/lib/supabase'

type Section = { category: string; stories: Story[] }

type Props = {
  featured: Story | null
  sections: Section[]
  publishDate: string | null
}

function slugify(cat: string) {
  return cat.toLowerCase().replace(/\s+/g, '-')
}

function matches(story: Story, query: string): boolean {
  const q = query.toLowerCase()
  return (
    story.title.toLowerCase().includes(q) ||
    (story.summary?.toLowerCase().includes(q) ?? false) ||
    story.source.toLowerCase().includes(q)
  )
}

export default function PublicFeed({ featured, sections, publishDate }: Props) {
  const [sheetStory, setSheetStory] = useState<Story | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [modal, setModal] = useState<'about' | 'ai-policy' | 'advertising' | null>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const desktopInputRef = useRef<HTMLInputElement>(null)

  const query = searchQuery.trim()
  const isSearching = query.length > 0

  const filteredFeatured = featured && (!isSearching || matches(featured, query)) ? featured : null
  const filteredSections = sections
    .map((s) => ({ ...s, stories: isSearching ? s.stories.filter((st) => matches(st, query)) : s.stories }))
    .filter((s) => s.stories.length > 0)

  const totalResults = (filteredFeatured ? 1 : 0) + filteredSections.reduce((n, s) => n + s.stories.length, 0)
  const sortedCategories = filteredSections.map((s) => s.category)

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

  function clearDesktopSearch() {
    setSearchQuery('')
    desktopInputRef.current?.focus()
  }

  return (
    <>
      <ArticleSheet story={sheetStory} onClose={() => setSheetStory(null)} />

      <div className="sticky top-0 z-40 bg-emerald-50/95 backdrop-blur-sm shadow-sm">
        <header className="max-w-7xl mx-auto px-4 pt-5 pb-4 md:pt-10 md:pb-6 text-center">

          {/* Mobile search bar — replaces header content when open */}
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
                  placeholder="Search stories…"
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
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
              <h1 className="text-[2.7rem] font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-merriweather)' }}>The Good I Found</h1>
              <p className="mt-2 text-gray-500 text-lg">
                Stories of Kindness, Progress, and Hope from Around the World
              </p>
              {publishDate && (
                <p className="mt-1 text-emerald-600 font-medium text-sm">{publishDate}</p>
              )}
              {(featured || sections.length > 0) && (
                <div className="mt-4 flex justify-center items-center gap-3 flex-wrap">
                  <SectionNav categories={sortedCategories} hasFeatured={!!filteredFeatured} />

                  {/* Desktop search bar — inline with Sections */}
                  <div className="hidden md:flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm w-64 hover:border-emerald-300 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                      ref={desktopInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search stories…"
                      className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
                    />
                    {searchQuery && (
                      <button onClick={clearDesktopSearch} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

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

      <section className="max-w-7xl mx-auto px-4 pb-16 flex flex-col gap-12">
        {/* Search results summary */}
        {isSearching && (
          <p className="text-sm text-gray-400 -mb-6 pt-4">
            {totalResults === 0 ? `No stories found for "${query}"` : `${totalResults} ${totalResults === 1 ? 'story' : 'stories'} matching "${query}"`}
          </p>
        )}

        {!isSearching && featured === null && sections.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-lg">
            No stories yet — check back soon!
          </div>
        ) : (
          <>
            {filteredFeatured && (
              <div id="featured" className="scroll-mt-56 md:scroll-mt-6">
                <h2 className="text-base font-semibold text-yellow-600 uppercase tracking-widest mb-3">
                  Today's Bright Spot
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
                        {filteredFeatured.category || filteredFeatured.source}
                      </span>
                      <span>Source: {filteredFeatured.source}</span>
                    </div>
                    <p className="text-gray-900 font-bold text-xl leading-snug hover:text-emerald-700 transition-colors">
                      {filteredFeatured.title}
                    </p>
                    {filteredFeatured.summary && (
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-4">{filteredFeatured.summary}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {filteredSections.map(({ category, stories }) => (
              <div key={category} id={slugify(category)} className="scroll-mt-56 md:scroll-mt-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {stories.map((story) => (
                    <StoryCard key={story.id} story={story} onOpen={handleOpen} />
                  ))}
                </div>
              </div>
            ))}

            {isSearching && totalResults === 0 && (
              <div className="text-center text-gray-400 py-20 text-lg">
                No stories found for "{query}"
              </div>
            )}
          </>
        )}
      </section>

      <footer className="border-t border-gray-200 mt-4 py-6 text-center text-xs text-gray-400 px-4 flex flex-col gap-3">
        <div className="flex justify-center gap-6">
          <button onClick={() => setModal('about')} className="hover:text-emerald-600 transition-colors font-medium">About</button>
          <button onClick={() => setModal('ai-policy')} className="hover:text-emerald-600 transition-colors font-medium">AI Policy</button>
          <button onClick={() => setModal('advertising')} className="hover:text-emerald-600 transition-colors font-medium">Advertising Policy</button>
        </div>
        <p>All stories © their respective publishers. The Good I Found curates links to original sources and does not claim ownership of any content.</p>
      </footer>

      {modal === 'about' && (
        <FooterModal title="About" onClose={() => setModal(null)}>
          <p>Content coming soon.</p>
        </FooterModal>
      )}
      {modal === 'ai-policy' && (
        <FooterModal title="AI Policy" onClose={() => setModal(null)}>
          <p>Content coming soon.</p>
        </FooterModal>
      )}
      {modal === 'advertising' && (
        <FooterModal title="Advertising Policy" onClose={() => setModal(null)}>
          <p>Content coming soon.</p>
        </FooterModal>
      )}
    </>
  )
}
