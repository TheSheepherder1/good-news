'use client'

import { useEffect, useState, useCallback } from 'react'
import StoryCard from '@/components/StoryCard'
import { type Story } from '@/lib/supabase'

type Tab = 'pending' | 'approved' | 'skipped'

type FeatureConflict = {
  newStory: Story
  existingId: string
  existingTitle: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [tab, setTab] = useState<Tab>('pending')
  const [msg, setMsg] = useState('')
  const [featureConflict, setFeatureConflict] = useState<FeatureConflict | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)

  const fetchStories = useCallback(async (status: Tab) => {
    setLoading(true)
    const res = await fetch(`/api/stories?status=${status}&limit=100`)
    const data = await res.json()
    setStories(Array.isArray(data) ? data : [])
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
          <h1 className="text-lg font-bold text-gray-900">The Bright Spot · Admin</h1>
          <div className="flex gap-1">
            {(['pending', 'approved', 'skipped'] as Tab[]).map((t) => (
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

      <section className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading…</div>
        ) : stories.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            {tab === 'pending' && 'Queue is empty — fetch new stories to fill it up.'}
            {tab === 'approved' && 'No approved stories yet. Review the Pending queue.'}
            {tab === 'skipped' && 'Nothing skipped yet.'}
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
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
