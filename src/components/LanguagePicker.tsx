'use client'

import { useState, useRef, useEffect } from 'react'
import { SUPPORTED_LANGUAGES, getLangLabel } from '@/lib/languages'

type Props = {
  current: string
  translating: boolean
  onChange: (lang: string) => void
  translatingLabel?: string
}

export default function LanguagePicker({ current, translating, onChange, translatingLabel = 'Translating…' }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const q = search.toLowerCase()
  const filtered = q
    ? SUPPORTED_LANGUAGES.filter(
        (l) => l.native.toLowerCase().includes(q) || l.english.toLowerCase().includes(q)
      )
    : SUPPORTED_LANGUAGES

  // English always pinned first; remove it from the filtered list then prepend
  const english = SUPPORTED_LANGUAGES.find((l) => l.code === 'en')!
  const withoutEn = filtered.filter((l) => l.code !== 'en')
  const displayList = [english, ...withoutEn]

  function handleSelect(code: string) {
    onChange(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={translating}
        className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-full shadow-sm hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-60 transition-colors"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        {translating ? (
          <span className="text-emerald-600">{translatingLabel}</span>
        ) : (
          <span>{getLangLabel(current)}</span>
        )}
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-50 flex flex-col">
          <div className="px-3 pt-3 pb-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 placeholder-gray-400"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {displayList.map(({ code, native, english }) => (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  code === current
                    ? 'text-emerald-700 font-semibold bg-emerald-50'
                    : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                {native === english ? native : `${native} · ${english}`}
              </button>
            ))}
            {displayList.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400">No languages found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
