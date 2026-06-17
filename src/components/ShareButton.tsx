'use client'

import { useState, useRef, useEffect } from 'react'

const SITE_URL = 'https://thegoodifound.com'
const SITE_NAME = 'The Good I Found'

type Props = {
  title: string
  url: string
}

const platforms = [
  {
    name: 'X / Twitter',
    getUrl: (title: string, url: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} — via ${SITE_NAME} ${SITE_URL}`)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Facebook',
    getUrl: (_: string, url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    getUrl: (title: string, url: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} — via ${SITE_NAME} ${SITE_URL}\n${url}`)}`,
  },
  {
    name: 'LinkedIn',
    getUrl: (_: string, url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Email',
    getUrl: (title: string, url: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Found this on ${SITE_NAME}:\n\n${url}\n\n${SITE_URL}`)}`,
  },
]

export default function ShareButton({ title, url }: Props) {
  const [showFallback, setShowFallback] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showFallback) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowFallback(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFallback])

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} — via ${SITE_NAME}`, url })
      } catch {
        // user cancelled or browser blocked — do nothing
      }
      return
    }
    setShowFallback((v) => !v)
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={handleShare}
        aria-label="Share this story"
        className="flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </button>

      {showFallback && (
        <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 w-44">
          {platforms.map((p) => (
            <a
              key={p.name}
              href={p.getUrl(title, url)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowFallback(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              {p.name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
