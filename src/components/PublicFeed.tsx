'use client'

import { useState } from 'react'
import StoryCard from '@/components/StoryCard'
import SectionNav from '@/components/SectionNav'
import ArticleSheet from '@/components/ArticleSheet'
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

export default function PublicFeed({ featured, sections, publishDate }: Props) {
  const [sheetStory, setSheetStory] = useState<Story | null>(null)

  function handleOpen(story: Story) {
    // Desktop: open in new tab; mobile: open sheet
    if (window.innerWidth >= 768) {
      window.open(story.url, '_blank', 'noopener,noreferrer')
    } else {
      setSheetStory(story)
    }
  }

  const sortedCategories = sections.map((s) => s.category)

  return (
    <>
      <ArticleSheet story={sheetStory} onClose={() => setSheetStory(null)} />

      <div className="sticky top-0 z-40 bg-emerald-50/95 backdrop-blur-sm shadow-sm md:relative md:top-auto md:bg-transparent md:shadow-none md:backdrop-blur-none">
        <header className="max-w-6xl mx-auto px-4 pt-5 pb-4 md:pt-10 md:pb-6 text-center">
          <h1 className="text-[2.7rem] font-bold text-gray-900 tracking-tight">The Good I Found</h1>
          <p className="mt-2 text-gray-500 text-lg">
            Stories of Kindness, Progress, and Hope from Around the World
          </p>
          {publishDate && (
            <p className="mt-1 text-emerald-600 font-medium text-sm">{publishDate}</p>
          )}
          {(featured || sections.length > 0) && (
            <div className="mt-4 flex justify-center">
              <SectionNav categories={sortedCategories} hasFeatured={!!featured} />
            </div>
          )}
        </header>
      </div>

      <section className="max-w-6xl mx-auto px-4 pb-16 flex flex-col gap-12">
        {featured === null && sections.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-lg">
            No stories yet — check back soon!
          </div>
        ) : (
          <>
            {featured && (
              <div id="featured" className="scroll-mt-44 md:scroll-mt-6">
                <h2 className="text-base font-semibold text-yellow-600 uppercase tracking-widest mb-3">
                  Today's Bright Spot
                </h2>
                <div
                  className="bg-white rounded-3xl shadow-md border border-yellow-200 overflow-hidden flex flex-col md:grid md:grid-cols-3 cursor-pointer md:cursor-default"
                  onClick={() => handleOpen(featured)}
                >
                  {featured.image_url && (
                    <img
                      src={featured.image_url}
                      alt=""
                      className="w-full h-52 md:h-full object-cover md:col-span-1"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div className={`p-6 flex flex-col gap-3 justify-center ${featured.image_url ? 'md:col-span-2' : 'md:col-span-3'}`}>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {featured.category || featured.source}
                      </span>
                      <span>{featured.source}</span>
                    </div>
                    <p className="text-gray-900 font-bold text-xl leading-snug hover:text-emerald-700 transition-colors">
                      {featured.title}
                    </p>
                    {featured.summary && (
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-4">{featured.summary}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {sections.map(({ category, stories }) => (
              <div key={category} id={slugify(category)} className="scroll-mt-44 md:scroll-mt-6">
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
          </>
        )}
      </section>

      <footer className="border-t border-gray-200 mt-4 py-6 text-center text-xs text-gray-400 px-4">
        All stories © their respective publishers. The Good I Found curates links to original sources and does not claim ownership of any content.
      </footer>
    </>
  )
}
