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
      // fallback
      if (id === '__top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const sections = [
    { label: topOfPageLabel, id: '__top' },
    ...(hasFeatured ? [{ label: featuredLabel, id: 'featured' }] : []),
    ...categories.map((c) => ({ label: categoryLabels[c] || c, id: slugify(c) })),
  ]

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
        <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {sections.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
