export type BookmarkSnapshot = {
  type?: 'news' | 'archive'   // undefined = 'news' for backward compat with existing saved bookmarks
  id: string
  title: string               // news: story title; archive: truncated opening
  summary: string | null      // news: summary; archive: null
  source: string              // news: publisher name; archive: author name
  url: string                 // news: external URL; archive: /archive/[id]
  image_url: string | null
  category: string | null     // news: section; archive: chapter name
  site_published_at: string | null
  country?: string            // archive only
  occurred_year?: number      // archive only
}

const KEY = 'tgif_bookmarks'

export function getBookmarks(): BookmarkSnapshot[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveBookmarks(bookmarks: BookmarkSnapshot[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bookmarks))
    window.dispatchEvent(new Event('tgif:bookmarks-updated'))
  } catch {}
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().some((b) => b.id === id)
}

export function addBookmark(snapshot: BookmarkSnapshot) {
  const existing = getBookmarks().filter((b) => b.id !== snapshot.id)
  saveBookmarks([snapshot, ...existing])
}

export function removeBookmark(id: string) {
  saveBookmarks(getBookmarks().filter((b) => b.id !== id))
}

export function getArchiveBookmarks(): BookmarkSnapshot[] {
  return getBookmarks().filter((b) => b.type === 'archive')
}

export function getNewsBookmarks(): BookmarkSnapshot[] {
  return getBookmarks().filter((b) => !b.type || b.type === 'news')
}
