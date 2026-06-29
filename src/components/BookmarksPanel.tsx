'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { type BookmarkSnapshot, getArchiveBookmarks, getNewsBookmarks, removeBookmark } from '@/lib/bookmarks'
import { useUIStrings } from '@/lib/useUIStrings'
import { LANG_STORAGE_KEY } from '@/lib/translations'

type Props = {
  onClose: () => void
}

export default function BookmarksPanel({ onClose }: Props) {
  const [archiveBookmarks, setArchiveBookmarks] = useState<BookmarkSnapshot[]>([])
  const [newsBookmarks, setNewsBookmarks] = useState<BookmarkSnapshot[]>([])
  const [visible, setVisible] = useState(false)
  const [lang, setLang] = useState('en')
  const touchStartY = useRef(0)
  const [dragY, setDragY] = useState(0)

  const t = useUIStrings(lang)

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY)
    if (stored) setLang(stored)
    setArchiveBookmarks(getArchiveBookmarks())
    setNewsBookmarks(getNewsBookmarks())
    requestAnimationFrame(() => setVisible(true))
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    function onUpdate() {
      setArchiveBookmarks(getArchiveBookmarks())
      setNewsBookmarks(getNewsBookmarks())
    }
    window.addEventListener('tgif:bookmarks-updated', onUpdate)
    return () => window.removeEventListener('tgif:bookmarks-updated', onUpdate)
  }, [])

  function handleRemove(id: string) {
    removeBookmark(id)
    window.dispatchEvent(new CustomEvent('tgif:bookmark-change', { detail: { storyId: id, saved: false } }))
  }

  function onTouchStart(e: React.TouchEvent) { touchStartY.current = e.touches[0].clientY }
  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setDragY(delta)
  }
  function onTouchEnd() {
    if (dragY > 100) onClose()
    setDragY(0)
  }

  const hasAny = archiveBookmarks.length > 0 || newsBookmarks.length > 0

  const closeButton = (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
    >
      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )

  const content = (
    <>
      {!hasAny ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          <p className="text-gray-400 text-sm">{t.noSavedStories}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {archiveBookmarks.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">{t.archiveSection}</h3>
              <div className="flex flex-col divide-y divide-gray-100">
                {archiveBookmarks.map((b) => (
                  <BookmarkRow key={b.id} bookmark={b} onRemove={handleRemove} isArchive />
                ))}
              </div>
            </section>
          )}
          {newsBookmarks.length > 0 && (
            <section>
              {archiveBookmarks.length > 0 && (
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">{t.newsSection}</h3>
              )}
              <div className="flex flex-col divide-y divide-gray-100">
                {newsBookmarks.map((b) => (
                  <BookmarkRow key={b.id} bookmark={b} onRemove={handleRemove} isArchive={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Mobile bottom sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col transition-transform duration-300`}
        style={{ maxHeight: '88vh', transform: `translateY(${visible ? dragY : '100%'}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        {closeButton}
        <h2 className="text-center text-base font-semibold text-gray-800 pb-3 flex-shrink-0">{t.savedStories}</h2>
        <div className="overflow-y-auto flex-1 pb-8 px-4">{content}</div>
      </div>

      {/* Desktop centered panel */}
      <div
        className={`hidden md:flex fixed inset-0 z-50 items-center justify-center p-8 transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '80vh', pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-800">{t.savedStories}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto flex-1 px-8 py-4">{content}</div>
        </div>
      </div>
    </>
  )
}

function BookmarkRow({ bookmark: b, onRemove, isArchive }: { bookmark: BookmarkSnapshot; onRemove: (id: string) => void; isArchive: boolean }) {
  return (
    <div className="flex gap-3 py-4">
      {b.image_url && (
        <img
          src={b.image_url}
          alt=""
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          {isArchive ? (
            <Link
              href={b.url}
              className="text-gray-900 font-semibold text-sm leading-snug hover:text-emerald-700 transition-colors line-clamp-2"
            >
              {b.title}
            </Link>
          ) : (
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 font-semibold text-sm leading-snug hover:text-emerald-700 transition-colors line-clamp-2"
            >
              {b.title}
            </a>
          )}
          <button
            onClick={() => onRemove(b.id)}
            aria-label="Remove bookmark"
            className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400">
          {b.category ? `${b.category} · ` : ''}{b.source}
          {b.occurred_year ? ` · ${b.occurred_year}` : ''}
        </p>
        {!isArchive && b.summary && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{b.summary}</p>
        )}
      </div>
    </div>
  )
}
