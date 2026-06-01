'use client'

import { useEffect, useState, useCallback } from 'react'
import StoryCard from '@/components/StoryCard'
import { type Story } from '@/lib/supabase'
import { SECTIONS } from '@/lib/sections'

type Tab = 'pending' | 'approved' | 'skipped' | 'published'

const CATEGORY_ORDER = ['Good News', 'Science', 'Animals', 'Health', 'Environment', 'Technology', 'Culture', 'Sports']

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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<{ title: string; summary: string; content: string; source: string; category: string; externalUrl: string }>({ title: '', summary: '', content: '', source: '', category: SECTIONS[0], externalUrl: '' })
  const [createImageFile, setCreateImageFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchStories = useCallback(async (status: Tab) => {
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

  useEffect(() => {
    if (authed) fetchStories(tab)
  }, [authed, tab, fetchStories])

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

  async function removeImage(id: string) {
    await patchStory(id, { image_url: null })
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, image_url: null } : s))
    setMsg('Image removed.')
  }

  async function changeCategory(id: string, category: string) {
    await patchStory(id, { category })
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, category } : s))
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
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">The Good I Found · Admin</h1>
          <div className="flex gap-1">
            {(['pending', 'approved', 'skipped', 'published'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  tab === t ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {msg && <span className="text-xs text-gray-500 max-w-sm">{msg}</span>}
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
        ) : stories.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            {tab === 'pending' && 'Queue is empty — fetch new stories to fill it up.'}
            {tab === 'approved' && 'No approved stories yet. Review the Pending queue.'}
            {tab === 'skipped' && 'Nothing skipped yet.'}
            {tab === 'published' && 'Nothing published yet.'}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">{stories.length} stories</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {stories.map((story) => (
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
