'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import StoryCard from '@/components/StoryCard'
import SubmissionCard from '@/components/SubmissionCard'
import { type Story, type ReaderSubmission, type ArchiveChapter, type WorldEvent, type ArchiveStory } from '@/lib/supabase'
import { SECTIONS, CATEGORY_ORDER } from '@/lib/sections'

type Tab = 'pending' | 'approved' | 'skipped' | 'published' | 'submissions' | 'chapters' | 'events' | 'archive-queue' | 'archive-live'

const TAB_LABELS: Record<Tab, string> = {
  pending: 'Pending',
  approved: 'Approved',
  skipped: 'Skipped',
  published: 'Published',
  submissions: 'Public Created',
  chapters: 'Chapters',
  events: 'World Events',
  'archive-queue': 'Story Review',
  'archive-live': 'Live Stories',
}

// Local (viewer's timezone) date, e.g. "2026-06-09" — not the UTC date from the ISO string.
function localDateKey(iso: string): string {
  const d = new Date(iso)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function sortPublished(stories: Story[]): Story[] {
  const featured = stories.filter((s) => s.is_featured)
  const rest = stories.filter((s) => !s.is_featured)
  rest.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category || '')
    const bi = CATEGORY_ORDER.indexOf(b.category || '')
    const catA = ai === -1 ? 999 : ai
    const catB = bi === -1 ? 999 : bi
    if (catA !== catB) return catA - catB
    return (b.ai_score ?? 0) - (a.ai_score ?? 0)
  })
  return [...featured, ...rest]
}

type FeatureConflict = {
  newStory: Story
  existingId: string
  existingTitle: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [stories, setStories] = useState<Story[]>([])
  const [originalCategories, setOriginalCategories] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [tab, setTab] = useState<Tab>('pending')
  const [msg, setMsg] = useState('')
  const [featureConflict, setFeatureConflict] = useState<FeatureConflict | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showUnpublishAllModal, setShowUnpublishAllModal] = useState(false)
  const [unpublishingAll, setUnpublishingAll] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showContentModal, setShowContentModal] = useState(false)
  const [contentForm, setContentForm] = useState({
    about_title: 'About The Good I Found',
    about_text: '',
    ai_policy_title: 'AI Policy',
    ai_policy_text: '',
    advertising_title: 'Advertising Policy',
    advertising_text: '',
  })
  const [savingContent, setSavingContent] = useState(false)
  const [revalidating, setRevalidating] = useState(false)
  const [publishedSearch, setPublishedSearch] = useState('')
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const sectionDropdownRef = useRef<HTMLDivElement>(null)
  const dateDropdownRef = useRef<HTMLDivElement>(null)
  const [createForm, setCreateForm] = useState<{ title: string; summary: string; content: string; source: string; category: string; externalUrl: string }>({ title: '', summary: '', content: '', source: '', category: SECTIONS[0], externalUrl: '' })
  const [createImageFile, setCreateImageFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [submissions, setSubmissions] = useState<ReaderSubmission[]>([])
  const [submissionsCount, setSubmissionsCount] = useState<number | null>(null)

  // Archive tabs
  const [chapters, setChapters] = useState<ArchiveChapter[]>([])
  const [worldEvents, setWorldEvents] = useState<WorldEvent[]>([])
  const [archiveQueue, setArchiveQueue] = useState<ArchiveStory[]>([])
  const [archiveQueueCount, setArchiveQueueCount] = useState<number | null>(null)
  const [archiveLive, setArchiveLive] = useState<ArchiveStory[]>([])
  const [settingHomeFeatured, setSettingHomeFeatured] = useState<string | null>(null)

  // Chapter form modal
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [chapterForm, setChapterForm] = useState({ name: '', slug: '', description: '', parent_id: '' })
  const [savingChapter, setSavingChapter] = useState(false)

  // Event form modal
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventForm, setEventForm] = useState({ name: '', slug: '', description: '', event_year: '', status: 'active' })
  const [savingEvent, setSavingEvent] = useState(false)

  const fetchStories = useCallback(async (status: Exclude<Tab, 'submissions'>) => {
    setLoading(true)
    const res = await fetch(`/api/stories?status=${status}&limit=150`)
    const data = await res.json()
    const stories = Array.isArray(data) ? data : []
    setStories(status === 'published' ? sortPublished(stories) : stories)
    // Capture original AI-assigned categories on first load
    const cats: Record<string, string> = {}
    stories.forEach((s: Story) => { if (s.category) cats[s.id] = s.category })
    setOriginalCategories(cats)
    setLoading(false)
  }, [])

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/reader-submissions', {
      headers: { Authorization: `Bearer ${password}` },
    })
    const data = await res.json()
    const rows = Array.isArray(data) ? data : []
    setSubmissions(rows)
    setSubmissionsCount(rows.length)
    setLoading(false)
  }, [password])

  const fetchChapters = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/archive/chapters', { headers: { Authorization: `Bearer ${password}` } })
    const data = await res.json()
    setChapters(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [password])

  const fetchWorldEvents = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/archive/events', { headers: { Authorization: `Bearer ${password}` } })
    const data = await res.json()
    setWorldEvents(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [password])

  const fetchArchiveQueue = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/archive/queue?status=review', { headers: { Authorization: `Bearer ${password}` } })
    const data = await res.json()
    const rows = Array.isArray(data) ? data : []
    setArchiveQueue(rows)
    setArchiveQueueCount(rows.length)
    setLoading(false)
  }, [password])

  const fetchArchiveLive = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/archive/queue?status=live', { headers: { Authorization: `Bearer ${password}` } })
    const data = await res.json()
    setArchiveLive(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [password])

  useEffect(() => {
    if (authed) {
      if (tab === 'submissions') fetchSubmissions()
      else if (tab === 'chapters') fetchChapters()
      else if (tab === 'events') fetchWorldEvents()
      else if (tab === 'archive-queue') fetchArchiveQueue()
      else if (tab === 'archive-live') fetchArchiveLive()
      else fetchStories(tab)
    }
    setPublishedSearch('')
    setSelectedSections([])
    setSelectedDates([])
    setSectionDropdownOpen(false)
    setDateDropdownOpen(false)
  }, [authed, tab, fetchStories, fetchSubmissions, fetchChapters, fetchWorldEvents, fetchArchiveQueue, fetchArchiveLive])

  // Badge counts for submissions and archive queue — fetched on load regardless of active tab.
  useEffect(() => {
    if (!authed) return
    fetch('/api/reader-submissions', { headers: { Authorization: `Bearer ${password}` } })
      .then((res) => res.json())
      .then((data) => setSubmissionsCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
    fetch('/api/archive/queue?status=review', { headers: { Authorization: `Bearer ${password}` } })
      .then((res) => res.json())
      .then((data) => setArchiveQueueCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
  }, [authed, password])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(e.target as Node)) {
        setSectionDropdownOpen(false)
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setDateDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const availableSections = CATEGORY_ORDER.filter((cat) => stories.some((s) => s.category === cat))

  const availableDates = [...new Set(
    stories.filter((s) => s.site_published_at).map((s) => localDateKey(s.site_published_at!))
  )].sort().reverse()

  async function callAPI(path: string, body?: object) {
    return fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${password}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async function patchStory(id: string, updates: object) {
    await fetch('/api/stories', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify({ id, ...updates }),
    })
  }

  async function updateStatus(id: string, status: 'approved' | 'skipped') {
    await patchStory(id, { status })
    setStories((prev) => prev.filter((s) => s.id !== id))
  }

  async function rescueStory(id: string) {
    await patchStory(id, { status: 'approved' })
    setStories((prev) => prev.filter((s) => s.id !== id))
    setMsg('Story moved to Approved.')
  }

  async function handleFeature(story: Story) {
    // Check if another story is already featured
    const existingFeatured = stories.find((s) => s.is_featured && s.id !== story.id)

    if (!existingFeatured) {
      // Also check via API in case featured story is in a different tab/status
      const res = await fetch('/api/featured')
      const featured = await res.json()
      if (featured && featured.id !== story.id) {
        setFeatureConflict({ newStory: story, existingId: featured.id, existingTitle: featured.title })
        return
      }
    } else {
      setFeatureConflict({ newStory: story, existingId: existingFeatured.id, existingTitle: existingFeatured.title })
      return
    }

    await confirmFeature(story)
  }

  async function confirmFeature(story: Story) {
    await patchStory(story.id, { is_featured: true })
    // Update local state: unset others, set this one
    setStories((prev) =>
      prev.map((s) => ({ ...s, is_featured: s.id === story.id }))
    )
    setFeatureConflict(null)
    setMsg(`"${story.title.slice(0, 60)}…" set as featured.`)
  }

  async function unpublishStory(id: string) {
    await patchStory(id, { status: 'skipped' })
    setStories((prev) => prev.filter((s) => s.id !== id))
    setMsg('Story unpublished and moved to Skipped.')
  }

  async function unpublishAll() {
    const ids = displayedStories.map((s) => s.id)
    setUnpublishingAll(true)
    await Promise.all(ids.map((id) => patchStory(id, { status: 'skipped' })))
    setStories((prev) => prev.filter((s) => !ids.includes(s.id)))
    setMsg(`Unpublished ${ids.length} ${ids.length === 1 ? 'story' : 'stories'} and moved to Skipped.`)
    setUnpublishingAll(false)
    setShowUnpublishAllModal(false)
  }

  async function removeImage(id: string) {
    await patchStory(id, { image_url: null })
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, image_url: null } : s))
    setMsg('Image removed.')
  }

  async function changeCategory(id: string, category: string) {
    await patchStory(id, { category })
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, category } : s))
  }

  async function approveSubmission(id: string, category: string) {
    const res = await fetch('/api/reader-submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ id, action: 'approve', category }),
    })
    const data = await res.json()
    if (data.ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
      setSubmissionsCount((c) => (c ?? 1) - 1)
      setMsg(data.message || 'Submission approved.')
    } else {
      setMsg(`Error: ${data.error}`)
    }
  }

  async function dismissSubmission(id: string) {
    const res = await fetch('/api/reader-submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ id, action: 'dismiss' }),
    })
    const data = await res.json()
    if (data.ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
      setSubmissionsCount((c) => (c ?? 1) - 1)
      setMsg('Submission dismissed.')
    } else {
      setMsg(`Error: ${data.error}`)
    }
  }

  async function uploadFeaturedImage(storyId: string, file: File): Promise<boolean> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('storyId', storyId)
    const res = await fetch(`/api/upload-image?auth=${encodeURIComponent(password)}`, { method: 'POST', body: formData })
    const data = await res.json()
    if (data.ok) {
      setStories((prev) => prev.map((s) => s.id === storyId ? { ...s, image_url: data.url } : s))
      setMsg('Image uploaded successfully.')
      return true
    } else {
      setMsg(`Upload error: ${data.error}`)
      return false
    }
  }

  function insertWrapper(textKey: string, wrapper: string) {
    const el = document.querySelector(`textarea[data-key="${textKey}"]`) as HTMLTextAreaElement
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const val = contentForm[textKey as keyof typeof contentForm]
    const newVal = val.substring(0, start) + wrapper + val.substring(start, end) + wrapper + val.substring(end)
    setContentForm((f) => ({ ...f, [textKey]: newVal }))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + wrapper.length, end + wrapper.length)
    })
  }

  function insertBullet(textKey: string) {
    const el = document.querySelector(`textarea[data-key="${textKey}"]`) as HTMLTextAreaElement
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const val = contentForm[textKey as keyof typeof contentForm]
    const lineStart = val.lastIndexOf('\n', start - 1) + 1
    if (start === end) {
      // No selection — prefix current line
      const newVal = val.substring(0, lineStart) + '- ' + val.substring(lineStart)
      setContentForm((f) => ({ ...f, [textKey]: newVal }))
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + 2, start + 2) })
    } else {
      // Selection — prefix each selected line
      const before = val.substring(0, lineStart)
      const selected = val.substring(lineStart, end).split('\n').map((l) => '- ' + l).join('\n')
      const after = val.substring(end)
      setContentForm((f) => ({ ...f, [textKey]: before + selected + after }))
    }
  }

  async function openContentModal() {
    const res = await fetch('/api/site-content')
    const data = await res.json()
    setContentForm({
      about_title: data.about_title || 'About The Good I Found',
      about_text: data.about_text || '',
      ai_policy_title: data.ai_policy_title || 'AI Policy',
      ai_policy_text: data.ai_policy_text || '',
      advertising_title: data.advertising_title || 'Advertising Policy',
      advertising_text: data.advertising_text || '',
    })
    setShowContentModal(true)
  }

  async function saveContent() {
    setSavingContent(true)
    await fetch('/api/site-content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify(contentForm),
    })
    setSavingContent(false)
    setShowContentModal(false)
    setMsg('Site content saved.')
  }

  async function revalidateSite() {
    setRevalidating(true)
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${password}` },
    })
    setMsg('Public page refreshed.')
    setRevalidating(false)
  }

  async function createCustomStory() {
    if (!createForm.title.trim() || !createForm.source.trim()) {
      setMsg('Title and source are required.')
      return
    }
    setCreating(true)
    const res = await fetch('/api/custom-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify(createForm),
    })
    const data = await res.json()
    if (!data.ok) {
      setMsg(`Error: ${data.error}`)
      setCreating(false)
      return
    }
    // Upload image if provided
    if (createImageFile) {
      const formData = new FormData()
      formData.append('file', createImageFile)
      formData.append('storyId', data.id)
      await fetch(`/api/upload-image?auth=${encodeURIComponent(password)}`, { method: 'POST', body: formData })
    }
    setCreating(false)
    setShowCreateModal(false)
    setCreateForm({ title: '', summary: '', content: '', source: '', category: SECTIONS[0], externalUrl: '' })
    setCreateImageFile(null)
    setMsg('Custom story created and added to Approved.')
    setTab('approved')
    fetchStories('approved')
  }

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function saveChapter() {
    if (!chapterForm.name.trim()) return
    setSavingChapter(true)
    const slug = chapterForm.slug.trim() || slugify(chapterForm.name)
    const res = await fetch('/api/archive/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ ...chapterForm, slug, parent_id: chapterForm.parent_id || null }),
    })
    const data = await res.json()
    setSavingChapter(false)
    if (data.ok) {
      setShowChapterModal(false)
      setChapterForm({ name: '', slug: '', description: '', parent_id: '' })
      fetchChapters()
      setMsg('Chapter saved.')
    } else {
      setMsg(`Error: ${data.error}`)
    }
  }

  async function toggleChapterStatus(chapter: ArchiveChapter) {
    const newStatus = chapter.status === 'active' ? 'retired' : 'active'
    await fetch('/api/archive/chapters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ id: chapter.id, status: newStatus }),
    })
    setChapters((prev) => prev.map((c) => c.id === chapter.id ? { ...c, status: newStatus } : c))
    setMsg(`Chapter ${newStatus === 'active' ? 'restored' : 'retired'}.`)
  }

  async function saveEvent() {
    if (!eventForm.name.trim()) return
    setSavingEvent(true)
    const slug = slugify(eventForm.name)
    const res = await fetch('/api/archive/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ ...eventForm, slug, event_year: eventForm.event_year ? Number(eventForm.event_year) : null }),
    })
    const data = await res.json()
    setSavingEvent(false)
    if (data.ok) {
      setShowEventModal(false)
      setEventForm({ name: '', slug: '', description: '', event_year: '', status: 'active' })
      fetchWorldEvents()
      setMsg('World event saved.')
    } else {
      setMsg(`Error: ${data.error}`)
    }
  }

  async function toggleEventStatus(event: WorldEvent) {
    const newStatus = event.status === 'active' ? 'retired' : 'active'
    await fetch('/api/archive/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ id: event.id, status: newStatus }),
    })
    setWorldEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, status: newStatus } : e))
    setMsg(`Event ${newStatus === 'active' ? 'restored (active)' : 'retired'}.`)
  }

  async function reviewArchiveStory(id: string, action: 'approve' | 'decline') {
    const res = await fetch('/api/archive/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ id, action }),
    })
    const data = await res.json()
    if (data.ok) {
      setArchiveQueue((prev) => prev.filter((s) => s.id !== id))
      setArchiveQueueCount((c) => Math.max(0, (c ?? 1) - 1))
      setMsg(data.message)
    } else {
      setMsg(`Error: ${data.error}`)
    }
  }

  async function setHomeFeatured(id: string, action: 'feature' | 'unfeature') {
    setSettingHomeFeatured(id)
    const res = await fetch('/api/archive/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ id, action }),
    })
    const data = await res.json()
    if (data.ok) {
      setArchiveLive((prev) => prev.map((s) => ({
        ...s,
        is_home_featured: action === 'feature' ? s.id === id : s.id === id ? false : s.is_home_featured,
      })))
      setMsg(data.message)
    } else {
      setMsg(`Error: ${data.error}`)
    }
    setSettingHomeFeatured(null)
  }

  async function runIngest() {
    setIngesting(true)
    setMsg('')
    const res = await callAPI('/api/ingest')
    const data = await res.json()
    if (data.ok) {
      setMsg(`Fetched ${data.fetched} stories · ${data.inserted} new in queue · ${data.skipped} duplicates removed`)
      setTab('pending')
      fetchStories('pending')
    } else {
      setMsg(`Error: ${data.error}`)
    }
    setIngesting(false)
  }

  async function publishStories(mode: 'replace' | 'add') {
    setShowPublishModal(false)
    setPublishing(true)
    setMsg('')
    const res = await callAPI('/api/publish', { mode })
    const data = await res.json()
    if (data.ok) {
      const action = mode === 'replace' ? 'replaced the public page with' : 'added'
      setMsg(`Published — ${action} ${data.published} ${data.published === 1 ? 'story' : 'stories'}.`)
      if (tab === 'approved') fetchStories('approved')
    } else {
      setMsg(`Error: ${data.error}`)
    }
    setPublishing(false)
  }

  const displayedStories = (() => {
    if (tab !== 'published') return stories
    let list = stories
    if (selectedSections.length > 0) {
      list = list.filter((s) => s.category && selectedSections.includes(s.category))
    }
    if (selectedDates.length > 0) {
      list = list.filter((s) => {
        if (!s.site_published_at) return false
        return selectedDates.includes(localDateKey(s.site_published_at))
      })
    }
    const q = publishedSearch.trim().toLowerCase()
    if (q) {
      list = list.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        (s.summary || '').toLowerCase().includes(q) ||
        s.source.toLowerCase().includes(q)
      )
    }
    return list
  })()

  const approvedCount = tab === 'approved' ? stories.length : null

  if (!authed) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-8 w-80 flex flex-col gap-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">Admin</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setAuthed(true)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            onClick={() => setAuthed(true)}
            className="bg-emerald-500 text-white rounded-lg py-2 font-medium hover:bg-emerald-600 transition-colors"
          >
            Sign in
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Edit Content modal */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-900 text-lg">Edit Site Content</h2>

            {[
              { titleKey: 'about_title', textKey: 'about_text', label: 'About' },
              { titleKey: 'ai_policy_title', textKey: 'ai_policy_text', label: 'AI Policy' },
              { titleKey: 'advertising_title', textKey: 'advertising_text', label: 'Advertising Policy' },
            ].map(({ titleKey, textKey, label }) => (
              <div key={titleKey} className="flex flex-col gap-2 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Modal Title</label>
                  <input
                    type="text"
                    value={contentForm[titleKey as keyof typeof contentForm]}
                    onChange={(e) => setContentForm((f) => ({ ...f, [titleKey]: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">Content (separate paragraphs with a blank line)</label>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => insertWrapper(textKey, '**')} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded transition-colors">B</button>
                      <button type="button" onClick={() => insertWrapper(textKey, '*')} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 italic text-sm rounded transition-colors">I</button>
                      <button type="button" onClick={() => insertBullet(textKey)} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors">•</button>
                    </div>
                  </div>
                  <textarea
                    data-key={textKey}
                    rows={6}
                    value={contentForm[textKey as keyof typeof contentForm]}
                    onChange={(e) => setContentForm((f) => ({ ...f, [textKey]: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none font-mono"
                  />
                </div>
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveContent}
                disabled={savingContent}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {savingContent ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setShowContentModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Story modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-900 text-lg">Create Custom Story</h2>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Section</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Source Name</label>
              <input
                type="text"
                placeholder="e.g. The Good I Found"
                value={createForm.source}
                onChange={(e) => setCreateForm((f) => ({ ...f, source: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Title</label>
              <input
                type="text"
                placeholder="Story headline"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                External URL <span className="text-gray-400 font-normal">(optional — leave blank to host story here)</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com/article"
                value={createForm.externalUrl}
                onChange={(e) => setCreateForm((f) => ({ ...f, externalUrl: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                Story Description <span className="text-gray-400 font-normal">(shown on the card)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Short description that appears on the story card…"
                value={createForm.summary}
                onChange={(e) => setCreateForm((f) => ({ ...f, summary: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            {!createForm.externalUrl && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Full Story <span className="text-gray-400 font-normal">(shown on your story page)</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Write your full story here…"
                  value={createForm.content}
                  onChange={(e) => setCreateForm((f) => ({ ...f, content: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Photo (optional)</label>
              <label className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 text-gray-500 text-sm py-2 px-3 rounded-lg cursor-pointer transition-colors">
                {createImageFile ? createImageFile.name : 'Choose image…'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setCreateImageFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={createCustomStory}
                disabled={creating}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {creating ? 'Creating…' : 'Approve'}
              </button>
              <button
                onClick={() => { setShowCreateModal(false); setCreateForm({ title: '', summary: '', content: '', source: '', category: SECTIONS[0], externalUrl: '' }); setCreateImageFile(null) }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish mode modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-2">Publish Stories</h2>
            <p className="text-gray-500 text-sm mb-6">How would you like to update the public page?</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => publishStories('replace')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-3 px-4 text-sm font-medium text-left transition-colors"
              >
                <div className="font-semibold">Replace public page</div>
                <div className="text-emerald-100 text-xs mt-0.5">Remove current stories and publish today's approvals</div>
              </button>
              <button
                onClick={() => publishStories('add')}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg py-3 px-4 text-sm font-medium text-left transition-colors"
              >
                <div className="font-semibold">Add to public page</div>
                <div className="text-indigo-100 text-xs mt-0.5">Keep existing stories and add today's approvals alongside</div>
              </button>
              <button
                onClick={() => setShowPublishModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg py-2 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish All confirmation modal */}
      {showUnpublishAllModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-2">Unpublish {displayedStories.length} {displayedStories.length === 1 ? 'Story' : 'Stories'}?</h2>
            <p className="text-gray-500 text-sm mb-6">
              This moves every story matching the current filters from Published to Skipped. They can be rescued back to Approved later. Click Refresh Site afterward to update the public page.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={unpublishAll}
                disabled={unpublishingAll}
                className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {unpublishingAll ? 'Unpublishing…' : `Unpublish ${displayedStories.length} ${displayedStories.length === 1 ? 'Story' : 'Stories'}`}
              </button>
              <button
                onClick={() => setShowUnpublishAllModal(false)}
                disabled={unpublishingAll}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Chapter modal */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl flex flex-col gap-4">
            <h2 className="font-bold text-gray-900 text-lg">Add Chapter</h2>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Name</label>
              <input
                type="text"
                placeholder="e.g. Kindness"
                value={chapterForm.name}
                onChange={(e) => setChapterForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Slug (auto-generated)</label>
              <input
                type="text"
                value={chapterForm.slug}
                onChange={(e) => setChapterForm((f) => ({ ...f, slug: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono text-gray-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Description</label>
              <textarea
                rows={2}
                placeholder="What kinds of stories belong here…"
                value={chapterForm.description}
                onChange={(e) => setChapterForm((f) => ({ ...f, description: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Parent Chapter <span className="text-gray-400 font-normal">(leave blank for top-level)</span></label>
              <select
                value={chapterForm.parent_id}
                onChange={(e) => setChapterForm((f) => ({ ...f, parent_id: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">— Top-level chapter —</option>
                {chapters.filter((c) => !c.parent_id && c.status === 'active').map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveChapter}
                disabled={savingChapter || !chapterForm.name.trim()}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {savingChapter ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setShowChapterModal(false); setChapterForm({ name: '', slug: '', description: '', parent_id: '' }) }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add World Event modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl flex flex-col gap-4">
            <h2 className="font-bold text-gray-900 text-lg">Add World Event</h2>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Event Name</label>
              <input
                type="text"
                placeholder="e.g. FIFA World Cup 2026"
                value={eventForm.name}
                onChange={(e) => setEventForm((f) => ({ ...f, name: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Description</label>
              <textarea
                rows={2}
                placeholder="Brief description…"
                value={eventForm.description}
                onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-gray-500">Year</label>
                <input
                  type="number"
                  placeholder="2026"
                  value={eventForm.event_year}
                  onChange={(e) => setEventForm((f) => ({ ...f, event_year: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-gray-500">Status</label>
                <select
                  value={eventForm.status}
                  onChange={(e) => setEventForm((f) => ({ ...f, status: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="active">Active (available for new stories)</option>
                  <option value="retired">Retired (searchable, not selectable)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveEvent}
                disabled={savingEvent || !eventForm.name.trim()}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {savingEvent ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setShowEventModal(false); setEventForm({ name: '', slug: '', description: '', event_year: '', status: 'active' }) }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Featured conflict modal */}
      {featureConflict && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-3">Replace Featured Story?</h2>
            <p className="text-gray-500 text-sm mb-1">Currently featured:</p>
            <p className="text-gray-900 font-medium text-sm mb-4 italic">"{featureConflict.existingTitle}"</p>
            <p className="text-gray-500 text-sm mb-6">
              Replace it with <span className="text-gray-900 font-medium">"{featureConflict.newStory.title}"</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => confirmFeature(featureConflict.newStory)}
                className="flex-1 bg-emerald-500 text-white rounded-lg py-2 font-medium hover:bg-emerald-600 transition-colors"
              >
                Yes, replace it
              </button>
              <button
                onClick={() => setFeatureConflict(null)}
                className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-2 font-medium hover:bg-gray-200 transition-colors"
              >
                Keep current
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-lg font-bold text-gray-900">The Good I Found · Admin</h1>
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-gray-300 self-center px-1">Feed</span>
            {(['pending', 'approved', 'skipped', 'published', 'submissions'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  tab === t ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {TAB_LABELS[t]}
                {t === 'submissions' && !!submissionsCount && (
                  <span className="bg-rose-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 leading-none">
                    {submissionsCount}
                  </span>
                )}
              </button>
            ))}
            <span className="text-xs text-gray-300 self-center px-1 ml-1">Archive</span>
            {(['chapters', 'events', 'archive-queue', 'archive-live'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  tab === t ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {TAB_LABELS[t]}
                {t === 'archive-queue' && !!archiveQueueCount && (
                  <span className="bg-rose-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 leading-none">
                    {archiveQueueCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {msg && <span className="text-xs text-gray-500 max-w-sm">{msg}</span>}
          <button
            onClick={openContentModal}
            className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Edit Content
          </button>
          <button
            onClick={revalidateSite}
            disabled={revalidating}
            className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {revalidating ? 'Refreshing…' : 'Refresh Site'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Create Story
          </button>
          <button
            onClick={() => setShowPublishModal(true)}
            disabled={publishing}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {publishing ? 'Publishing…' : approvedCount !== null ? `Publish ${approvedCount} Stories` : 'Publish Stories'}
          </button>
          <button
            onClick={runIngest}
            disabled={ingesting}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {ingesting ? 'Fetching…' : 'Fetch New Stories'}
          </button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading…</div>
        ) : tab === 'chapters' ? (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-gray-800">Archive Chapters</h2>
              <button
                onClick={() => setShowChapterModal(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                + Add Chapter
              </button>
            </div>

            {/* Top-level chapters */}
            {chapters.filter((c) => !c.parent_id).map((chapter) => {
              const subs = chapters.filter((c) => c.parent_id === chapter.id)
              return (
                <div key={chapter.id} className="bg-white rounded-xl border border-gray-100 mb-3 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="font-medium text-gray-900">{chapter.name}</span>
                      <span className="ml-2 text-xs text-gray-400 font-mono">{chapter.slug}</span>
                      {chapter.status === 'retired' && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">retired</span>
                      )}
                      {chapter.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{chapter.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setChapterForm({ name: '', slug: '', description: '', parent_id: chapter.id }); setShowChapterModal(true) }}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                      >
                        + Sub-chapter
                      </button>
                      <button
                        onClick={() => toggleChapterStatus(chapter)}
                        className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                          chapter.status === 'active'
                            ? 'text-gray-400 hover:text-red-500'
                            : 'text-emerald-500 hover:text-emerald-700'
                        }`}
                      >
                        {chapter.status === 'active' ? 'Retire' : 'Restore'}
                      </button>
                    </div>
                  </div>

                  {subs.length > 0 && (
                    <div className="border-t border-gray-50">
                      {subs.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between px-4 py-2.5 pl-8 bg-gray-50/50 border-t border-gray-100/80">
                          <div>
                            <span className="text-sm text-gray-700">{sub.name}</span>
                            <span className="ml-2 text-xs text-gray-400 font-mono">{sub.slug}</span>
                            {sub.status === 'retired' && (
                              <span className="ml-2 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">retired</span>
                            )}
                          </div>
                          <button
                            onClick={() => toggleChapterStatus(sub)}
                            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                              sub.status === 'active'
                                ? 'text-gray-400 hover:text-red-500'
                                : 'text-emerald-500 hover:text-emerald-700'
                            }`}
                          >
                            {sub.status === 'active' ? 'Retire' : 'Restore'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {chapters.length === 0 && (
              <div className="text-center text-gray-400 py-16">No chapters yet.</div>
            )}
          </div>
        ) : tab === 'events' ? (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-gray-800">World Events</h2>
                <p className="text-xs text-gray-400 mt-0.5">Active events are selectable when submitting a story. Retired events are searchable but not available for new submissions.</p>
              </div>
              <button
                onClick={() => setShowEventModal(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0 ml-4"
              >
                + Add Event
              </button>
            </div>

            {worldEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-xl border border-gray-100 mb-2 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{event.name}</span>
                    {event.event_year && <span className="text-xs text-gray-400">{event.event_year}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  {event.description && <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>}
                </div>
                <button
                  onClick={() => toggleEventStatus(event)}
                  className={`text-xs font-medium px-2 py-1 rounded transition-colors ml-4 flex-shrink-0 ${
                    event.status === 'active'
                      ? 'text-gray-400 hover:text-red-500'
                      : 'text-emerald-500 hover:text-emerald-700'
                  }`}
                >
                  {event.status === 'active' ? 'Retire' : 'Restore'}
                </button>
              </div>
            ))}

            {worldEvents.length === 0 && (
              <div className="text-center text-gray-400 py-16">No world events yet.</div>
            )}
          </div>
        ) : tab === 'archive-queue' ? (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-gray-800">Archive Queue</h2>
              <span className="text-xs text-gray-400">{archiveQueue.length} {archiveQueue.length === 1 ? 'story' : 'stories'} awaiting review</span>
            </div>

            {archiveQueue.length === 0 ? (
              <div className="text-center text-gray-400 py-20">No stories in the queue.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {archiveQueue.map((story) => {
                  const chapterName = (story as ArchiveStory & { chapter?: { name: string } }).chapter?.name
                  const eventName = (story as ArchiveStory & { world_event?: { name: string } }).world_event?.name
                  const chars = (story as ArchiveStory & { characters?: { name: string; sort_order: number }[] }).characters ?? []

                  return (
                    <div key={story.id} className="bg-white rounded-xl border border-gray-100 p-5">
                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-3">
                        {chapterName && <span className="bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">{chapterName}</span>}
                        {eventName && <span className="bg-amber-50 text-amber-600 font-medium px-2 py-0.5 rounded-full">{eventName}</span>}
                        <span>{story.country}{story.city ? ` · ${story.city}` : ''}</span>
                        <span>{story.occurred_month ? `${story.occurred_month}/` : ''}{story.occurred_year}</span>
                        {story.tags.length > 0 && story.tags.map((tag) => (
                          <span key={tag} className="bg-gray-100 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>

                      {/* Story content */}
                      {story.opening && <p className="text-sm text-gray-800 font-medium mb-1">{story.opening}</p>}
                      {story.body && <p className="text-sm text-gray-600 line-clamp-4 mb-1">{story.body}</p>}
                      {story.impact && <p className="text-xs text-gray-400 italic line-clamp-2">{story.impact}</p>}

                      {/* Characters */}
                      {chars.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          People: {chars.sort((a, b) => a.sort_order - b.sort_order).map((c) => c.name).join(', ')}
                        </p>
                      )}

                      {/* Author & relationship */}
                      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between flex-wrap gap-2">
                        <div className="text-xs text-gray-400">
                          {story.is_anonymous ? 'Anonymous' : story.author_name} · {story.relationship} · {story.original_language.toUpperCase()}
                        </div>

                        {/* AI verdict */}
                        {story.ai_score != null && (
                          <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${story.ai_passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            AI score {story.ai_score}/10 · {story.ai_passed ? 'passed' : 'flagged'}
                          </div>
                        )}
                      </div>

                      {story.ai_reason && (
                        <p className="text-xs text-gray-400 mt-1 italic">"{story.ai_reason}"</p>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => reviewArchiveStory(story.id, 'approve')}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                        >
                          Approve — Make Live
                        </button>
                        <button
                          onClick={() => reviewArchiveStory(story.id, 'decline')}
                          className="flex-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 text-sm font-medium py-2 rounded-lg transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : tab === 'archive-live' ? (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-gray-800">Live Stories</h2>
              <span className="text-xs text-gray-400">{archiveLive.length} {archiveLive.length === 1 ? 'story' : 'stories'} live</span>
            </div>

            {archiveLive.length === 0 ? (
              <div className="text-center text-gray-400 py-20">No live stories yet.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {archiveLive.map((story) => {
                  const chapterName = (story as ArchiveStory & { chapter?: { name: string } }).chapter?.name
                  const isFeatured = story.is_home_featured
                  const isLoading = settingHomeFeatured === story.id

                  return (
                    <div
                      key={story.id}
                      className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${isFeatured ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-100'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-1">
                          {chapterName && (
                            <span className="bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">{chapterName}</span>
                          )}
                          {isFeatured && (
                            <span className="bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">⭐ Home Story</span>
                          )}
                          {story.occurred_year && <span>{story.occurred_year}</span>}
                          {story.country && <span>· {story.country}</span>}
                        </div>
                        <p className="text-sm text-gray-800 line-clamp-2">{story.opening}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {story.is_anonymous ? 'Anonymous' : story.author_name}
                        </p>
                      </div>
                      <button
                        onClick={() => setHomeFeatured(story.id, isFeatured ? 'unfeature' : 'feature')}
                        disabled={isLoading}
                        className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          isFeatured
                            ? 'bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        {isLoading ? '…' : isFeatured ? 'Remove from Home' : 'Set as Home Story'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : tab === 'submissions' ? (
          submissions.length === 0 ? (
            <div className="text-center text-gray-400 py-20">No new submissions.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {submissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={approveSubmission}
                  onDismiss={dismissSubmission}
                />
              ))}
            </div>
          )
        ) : stories.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            {tab === 'pending' && 'Queue is empty — fetch new stories to fill it up.'}
            {tab === 'approved' && 'No approved stories yet. Review the Pending queue.'}
            {tab === 'skipped' && 'Nothing skipped yet.'}
            {tab === 'published' && 'Nothing published yet.'}
          </div>
        ) : (
          <>
            {tab === 'published' && (
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Search */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm w-64 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text"
                    value={publishedSearch}
                    onChange={(e) => setPublishedSearch(e.target.value)}
                    placeholder="Search published stories…"
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
                  />
                  {publishedSearch && (
                    <button onClick={() => setPublishedSearch('')} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Section filter */}
                <div ref={sectionDropdownRef} className="relative">
                  <button
                    onClick={() => { setSectionDropdownOpen((v) => !v); setDateDropdownOpen(false) }}
                    className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
                      selectedSections.length > 0
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    Section{selectedSections.length > 0 ? ` (${selectedSections.length})` : ''}
                    <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {sectionDropdownOpen && availableSections.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[180px] py-1">
                      {availableSections.map((section) => (
                        <label key={section} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedSections.includes(section)}
                            onChange={() =>
                              setSelectedSections((prev) =>
                                prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
                              )
                            }
                            className="rounded text-emerald-500 focus:ring-emerald-400"
                          />
                          {section}
                        </label>
                      ))}
                      {selectedSections.length > 0 && (
                        <button
                          onClick={() => setSelectedSections([])}
                          className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-red-500 border-t border-gray-100 mt-1 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Date Published filter */}
                <div ref={dateDropdownRef} className="relative">
                  <button
                    onClick={() => { setDateDropdownOpen((v) => !v); setSectionDropdownOpen(false) }}
                    className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
                      selectedDates.length > 0
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    Date Published{selectedDates.length > 0 ? ` (${selectedDates.length})` : ''}
                    <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dateDropdownOpen && availableDates.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[180px] py-1">
                      {availableDates.map((dateKey) => (
                        <label key={dateKey} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedDates.includes(dateKey)}
                            onChange={() =>
                              setSelectedDates((prev) =>
                                prev.includes(dateKey) ? prev.filter((d) => d !== dateKey) : [...prev, dateKey]
                              )
                            }
                            className="rounded text-emerald-500 focus:ring-emerald-400"
                          />
                          {new Date(dateKey + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </label>
                      ))}
                      {selectedDates.length > 0 && (
                        <button
                          onClick={() => setSelectedDates([])}
                          className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-red-500 border-t border-gray-100 mt-1 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-400">{displayedStories.length} {displayedStories.length === 1 ? 'story' : 'stories'}</p>

                {(selectedSections.length > 0 || selectedDates.length > 0 || publishedSearch.trim() !== '') && displayedStories.length > 0 && (
                  <button
                    onClick={() => setShowUnpublishAllModal(true)}
                    className="ml-auto bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    Unpublish All ({displayedStories.length})
                  </button>
                )}
              </div>
            )}

            {tab !== 'published' && <p className="text-sm text-gray-400 mb-4">{stories.length} stories</p>}

            {displayedStories.length === 0 && tab === 'published' && (publishedSearch || selectedSections.length > 0 || selectedDates.length > 0) && (
              <div className="text-center text-gray-400 py-16">No stories match the current filters.</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  adminMode
                  tab={tab}
                  onApprove={(id) => updateStatus(id, 'approved')}
                  onSkip={(id) => updateStatus(id, 'skipped')}
                  onFeature={handleFeature}
                  onRescue={rescueStory}
                  onUploadImage={uploadFeaturedImage}
                  onCategoryChange={changeCategory}
                  onUnpublish={unpublishStory}
                  onRemoveImage={removeImage}
                  aiCategory={originalCategories[story.id]}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
