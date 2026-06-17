'use client'

import { useEffect, useRef, useState } from 'react'
import { type Story } from '@/lib/supabase'
import { renderSummaryMarkdown } from '@/lib/summaryMarkdown'
import ShareButton from '@/components/ShareButton'

type Props = {
  story: Story | null
  onClose: () => void
  displayTitle?: string
  displaySummary?: string
}

export default function ArticleSheet({ story, onClose, displayTitle, displaySummary }: Props) {
  const [dragY, setDragY] = useState(0)
  const [visible, setVisible] = useState(false)
  const touchStartY = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Animate in on open, animate out on close
  useEffect(() => {
    if (story) {
      requestAnimationFrame(() => setVisible(true))
      document.body.style.overflow = 'hidden'
    } else {
      setVisible(false)
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [story])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setDragY(delta)
  }

  function onTouchEnd() {
    if (dragY > 100) onClose()
    setDragY(0)
  }

  if (!story) return null

  const readLabel = story.is_custom && story.url.includes('/story/') ? 'Read Full Story' : 'Read Full Article'
  const summaryText = displaySummary || story.summary

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Mobile bottom sheet */}
      <div
        ref={sheetRef}
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col transition-transform duration-300`}
        style={{
          maxHeight: '88vh',
          transform: `translateY(${visible ? dragY : '100%'}px)`,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="overflow-y-auto flex-1 pb-8">
          {story.image_url && (
            <img src={story.image_url} alt="" className="w-full h-52 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          <div className="px-5 pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {story.is_featured && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-semibold">Featured</span>}
              <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">{story.category || story.source}</span>
              <span className="text-xs text-gray-400">Source: {story.source}</span>
              <ShareButton title={displayTitle || story.title} url={story.url} />
            </div>
            <h2 className="text-gray-900 font-bold text-lg leading-snug">{displayTitle || story.title}</h2>
            {summaryText && (
              story.content_format === 'rich' ? (
                <div className="text-gray-600 text-sm leading-relaxed">{renderSummaryMarkdown(summaryText)}</div>
              ) : (
                <p className="text-gray-600 text-sm leading-relaxed">{summaryText}</p>
              )
            )}
            <a href={story.url} target="_blank" rel="noopener noreferrer"
              className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-3 rounded-xl text-center transition-colors flex items-center justify-center gap-2">
              {readLabel}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Desktop centered panel */}
      <div
        className={`hidden md:flex fixed inset-0 z-50 items-center justify-center p-8 transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '80vh', pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          {story.image_url && (
            <img src={story.image_url} alt="" className="w-full h-64 object-cover flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-8 py-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {story.is_featured && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-semibold">Featured</span>}
              <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">{story.category || story.source}</span>
              <span className="text-xs text-gray-400">Source: {story.source}</span>
              <ShareButton title={displayTitle || story.title} url={story.url} />
            </div>
            <h2 className="text-gray-900 font-bold text-xl leading-snug">{displayTitle || story.title}</h2>
            {summaryText && (
              story.content_format === 'rich' ? (
                <div className="text-gray-600 text-sm leading-relaxed">{renderSummaryMarkdown(summaryText)}</div>
              ) : (
                <p className="text-gray-600 text-sm leading-relaxed">{summaryText}</p>
              )
            )}
            <a href={story.url} target="_blank" rel="noopener noreferrer"
              className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-3 rounded-xl text-center transition-colors flex items-center justify-center gap-2">
              {readLabel}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
