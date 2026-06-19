'use client'

import { useState, useEffect } from 'react'
import { type Story } from '@/lib/supabase'
import { isBookmarked, addBookmark, removeBookmark } from '@/lib/bookmarks'

type Props = {
  story: Story
  displayTitle?: string
}

export default function BookmarkButton({ story, displayTitle }: Props) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(isBookmarked(story.id))
  }, [story.id])

  useEffect(() => {
    function onSync(e: Event) {
      const { storyId, saved: newState } = (e as CustomEvent<{ storyId: string; saved: boolean }>).detail
      if (storyId === story.id) setSaved(newState)
    }
    window.addEventListener('tgif:bookmark-change', onSync)
    return () => window.removeEventListener('tgif:bookmark-change', onSync)
  }, [story.id])

  function broadcast(newState: boolean) {
    window.dispatchEvent(new CustomEvent('tgif:bookmark-change', { detail: { storyId: story.id, saved: newState } }))
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (saved) {
      removeBookmark(story.id)
      setSaved(false)
      broadcast(false)
    } else {
      addBookmark({
        id: story.id,
        title: displayTitle || story.title,
        summary: story.summary,
        source: story.source,
        url: story.url,
        image_url: story.image_url,
        category: story.category,
        site_published_at: story.site_published_at,
      })
      setSaved(true)
      broadcast(true)
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? 'Remove bookmark' : 'Bookmark this story'}
      className={`flex items-center justify-center transition-colors ${
        saved ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-500'
      }`}
    >
      {saved ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
      )}
    </button>
  )
}
