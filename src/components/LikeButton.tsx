'use client'

import { useState, useEffect } from 'react'

const LIKED_KEY = 'tgif_liked'
const LIKED_COUNTS_KEY = 'tgif_liked_counts'

type Props = {
  storyId: string
  initialCount: number
}

export default function LikeButton({ storyId, initialCount }: Props) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    try {
      const likedIds = JSON.parse(localStorage.getItem(LIKED_KEY) || '[]') as string[]
      if (likedIds.includes(storyId)) {
        setLiked(true)
        // Use whichever is higher: server count (may have caught up) or our stored expected count
        const storedCounts = JSON.parse(localStorage.getItem(LIKED_COUNTS_KEY) || '{}') as Record<string, number>
        const expected = storedCounts[storyId] ?? 0
        setCount((c) => Math.max(c, expected))
      }
    } catch {}
  }, [storyId, initialCount])

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation()
    if (liked) return
    setLiked(true)
    setCount((c) => {
      const next = c + 1
      try {
        // Store expected count so a refresh before ISR updates still shows the right number
        const storedCounts = JSON.parse(localStorage.getItem(LIKED_COUNTS_KEY) || '{}') as Record<string, number>
        storedCounts[storyId] = next
        localStorage.setItem(LIKED_COUNTS_KEY, JSON.stringify(storedCounts))
      } catch {}
      return next
    })
    try {
      const likedIds = JSON.parse(localStorage.getItem(LIKED_KEY) || '[]') as string[]
      localStorage.setItem(LIKED_KEY, JSON.stringify([...likedIds, storyId]))
    } catch {}
    fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId }),
    }).catch(() => {})
  }

  return (
    <button
      onClick={handleLike}
      aria-label={liked ? 'Liked' : 'Like this story'}
      className={`flex items-center gap-1 text-xs transition-colors select-none ${
        liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
      }`}
    >
      {liked ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.218l-.022.012-.007.003-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 4.875 6.75 9.75 9 9.75s9-4.875 9-9.75z" />
        </svg>
      )}
      <span>{count}</span>
    </button>
  )
}
