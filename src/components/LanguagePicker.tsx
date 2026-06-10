'use client'

import { useState, useRef, useEffect } from 'react'
import { LANGUAGES, type Language } from '@/lib/translations'

type Props = {
  current: Language
  translating: boolean
  onChange: (lang: Language) => void
  translatingLabel?: string
}

export default function LanguagePicker({ current, translating, onChange, translatingLabel = 'Translating…' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentLabel = LANGUAGES.find((l) => l.code === current)?.label ?? 'English'

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
          <span>{currentLabel}</span>
        )}
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => { onChange(code); setOpen(false) }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                code === current
                  ? 'text-emerald-700 font-semibold bg-emerald-50'
                  : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
