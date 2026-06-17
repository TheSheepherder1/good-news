'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  categories: string[]
  categoryLabels?: Record<string, string>
  hasFeatured: boolean
  topOfPageLabel?: string
  sectionsLabel?: string
  featuredLabel?: string
  onNavigate?: (id: string) => void
  onReorder?: (category: string, direction: 'up' | 'down') => void
  pinnedCategories?: string[]
}

function slugify(cat: string) {
  return cat.toLowerCase().replace(/\s+/g, '-')
}

export default function SectionNav({
  categories,
  categoryLabels = {},
  hasFeatured,
  topOfPageLabel = 'Top of Page',
  sectionsLabel = 'Sections',
  featuredLabel = "Today's Bright Spot",
  onNavigate,
  onReorder,
  pinnedCategories = [],
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(id: string) {
    setOpen(false)
    if (onNavigate) {
      onNavigate(id)
    } else {
      if (id === '__top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const reorderableCategories = categories.filter((c) => !pinnedCategories.includes(c))

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full shadow-sm hover:border-emerald-400 hover:text-emerald-700 transition-colors"
      >
        {sectionsLabel}
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">

          {/* Fixed nav items */}
          <button
            onClick={() => handleSelect('__top')}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            {topOfPageLabel}
          </button>
          {hasFeatured && (
            <button
              onClick={() => handleSelect('featured')}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              {featuredLabel}
            </button>
          )}

          {categories.length > 0 && <div className="border-t border-gray-100 my-1" />}

          {/* Section rows */}
          {categories.map((cat) => {
            const label = categoryLabels[cat] || cat
            const id = slugify(cat)
            const isPinned = pinnedCategories.includes(cat)
            const reorderIdx = reorderableCategories.indexOf(cat)
            const isFirst = reorderIdx === 0
            const isLast = reorderIdx === reorderableCategories.length - 1

            return (
              <div key={cat} className="flex items-center group">
                <button
                  onClick={() => handleSelect(id)}
                  className="flex-1 text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors min-w-0 truncate"
                >
                  {label}
                </button>

                {isPinned ? (
                  // Lock icon — shows this section is always first
                  <span className="pr-3 text-gray-300 flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                ) : onReorder ? (
                  <div className="flex items-center pr-1 flex-shrink-0">
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onReorder(cat, 'up') }}
                      disabled={isFirst}
                      aria-label={`Move ${label} up`}
                      className="p-2.5 text-gray-400 hover:text-emerald-600 disabled:opacity-20 disabled:cursor-default transition-colors rounded"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onReorder(cat, 'down') }}
                      disabled={isLast}
                      aria-label={`Move ${label} down`}
                      className="p-2.5 text-gray-400 hover:text-emerald-600 disabled:opacity-20 disabled:cursor-default transition-colors rounded"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
