export type BookmarkSnapshot = {
  id: string
  title: string
  summary: string | null
  source: string
  url: string
  image_url: string | null
  category: string | null
  site_published_at: string | null
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
