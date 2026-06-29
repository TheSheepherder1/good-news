'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { getAllCountriesSorted } from '@/lib/countries'
import type { WorldEvent } from '@/lib/supabase'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const RELATIONSHIPS = [
  'I witnessed this',
  'This happened to me',
  'This is a family story',
  'This is a community story',
  'I read about this',
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type CheckResult = {
  passed: boolean
  score: number
  reason: string
  chapter: string | null
}

type ImageSlot = 1 | 2 | 3

export default function ArchiveSubmitPage() {
  // Story content
  const [opening, setOpening] = useState('')
  const [body, setBody] = useState('')
  const [impact, setImpact] = useState('')

  // Images
  const [images, setImages] = useState<{ url: string | null; caption: string; uploading: boolean }[]>([
    { url: null, caption: '', uploading: false },
    { url: null, caption: '', uploading: false },
    { url: null, caption: '', uploading: false },
  ])
  const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  // Story metadata
  const [occurredYear, setOccurredYear] = useState('')
  const [occurredMonth, setOccurredMonth] = useState('')
  const [country, setCountry] = useState('')
  const [stateProvince, setStateProvince] = useState('')
  const [city, setCity] = useState('')
  const [characters, setCharacters] = useState(['', ''])
  const [organization, setOrganization] = useState('')
  const [worldEventId, setWorldEventId] = useState('')
  const [tags, setTags] = useState(['', '', ''])

  // About you
  const [authorName, setAuthorName] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [relationship, setRelationship] = useState('')

  // Reader language (for country names)
  const [lang, setLang] = useState('en')
  useEffect(() => {
    const stored = localStorage.getItem('tgif_lang')
    if (stored) setLang(stored)
  }, [])
  const countryOptions = useMemo(() => getAllCountriesSorted(lang), [lang])

  // World events (fetched)
  const [worldEvents, setWorldEvents] = useState<WorldEvent[]>([])

  // UI state
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedLive, setSubmittedLive] = useState(false)
  const [submittedChapter, setSubmittedChapter] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/archive/events')
      .then((r) => r.json())
      .then((data) => setWorldEvents(Array.isArray(data) ? data.filter((e: WorldEvent) => e.status === 'active') : []))
      .catch(() => {})
  }, [])

  async function uploadImage(slot: number, file: File) {
    setImages((prev) => prev.map((img, i) => i === slot ? { ...img, uploading: true } : img))
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('archive-images')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('archive-images').getPublicUrl(path)
      setImages((prev) => prev.map((img, i) => i === slot ? { ...img, url: urlData.publicUrl, uploading: false } : img))
    } catch (err) {
      console.error('Image upload failed:', err)
      setImages((prev) => prev.map((img, i) => i === slot ? { ...img, uploading: false } : img))
      setError('Image upload failed. Please try again or use a smaller file (under 5MB).')
    }
  }

  function removeImage(slot: number) {
    setImages((prev) => prev.map((img, i) => i === slot ? { url: null, caption: '', uploading: false } : img))
    if (fileRefs[slot]?.current) fileRefs[slot].current!.value = ''
  }

  async function checkMyStory() {
    if (!opening.trim() && !body.trim()) {
      setError('Please write at least the opening or body of your story first.')
      return
    }
    setError('')
    setChecking(true)
    setCheckResult(null)
    try {
      const res = await fetch('/api/archive/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening, body, impact }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCheckResult(data)
    } catch (err) {
      console.error(err)
      setError('Check failed. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!opening.trim() && !body.trim()) {
      setError('Please write at least the opening or body of your story.')
      return
    }
    if (!occurredYear.trim()) { setError('Year the story occurred is required.'); return }
    if (!country.trim()) { setError('Country is required.'); return }
    if (!authorName.trim()) { setError('Your name is required.'); return }
    if (!relationship) { setError('Please select your relationship to this story.'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/archive/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opening: opening.trim(),
          body: body.trim(),
          impact: impact.trim(),
          image_1_url: images[0].url,
          image_1_caption: images[0].caption,
          image_2_url: images[1].url,
          image_2_caption: images[1].caption,
          image_3_url: images[2].url,
          image_3_caption: images[2].caption,
          occurred_year: Number(occurredYear),
          occurred_month: occurredMonth ? Number(occurredMonth) : null,
          country: country.trim(),
          state_province: stateProvince.trim(),
          city: city.trim(),
          world_event_id: worldEventId || null,
          characters: characters.map((c) => c.trim()).filter(Boolean),
          organization: organization.trim(),
          tags: tags.map((t) => t.trim()).filter(Boolean),
          author_name: authorName.trim(),
          is_anonymous: isAnonymous,
          relationship,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Submission failed')
      setSubmittedLive(data.live)
      setSubmittedChapter(data.chapter)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#c8dde6] to-[#f8fbfa] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl shadow-lg max-w-lg w-full p-8 text-center">
          <div className="text-5xl mb-4">{submittedLive ? '✨' : '📬'}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {submittedLive ? 'Your story is live!' : 'Story received — thank you!'}
          </h1>
          {submittedLive ? (
            <p className="text-gray-500 mb-2">
              Your story passed our quality review and has been added to The Archive of Human Goodness
              {submittedChapter ? ` under the ${submittedChapter} chapter` : ''}.
              It will be here forever.
            </p>
          ) : (
            <p className="text-gray-500 mb-2">
              Your story is in our review queue. We'll read it carefully before it goes live. Thank you
              for adding to The Archive of Human Goodness.
            </p>
          )}
          <p className="text-sm text-gray-400 mb-6">
            Once submitted, stories are permanent. Your words will be preserved exactly as you wrote them.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Back to The Good I Found
            </Link>
            <button
              onClick={() => {
                setSubmitted(false); setOpening(''); setBody(''); setImpact('')
                setImages([{ url: null, caption: '', uploading: false }, { url: null, caption: '', uploading: false }, { url: null, caption: '', uploading: false }])
                setOccurredYear(''); setOccurredMonth(''); setCountry(''); setStateProvince(''); setCity('')
                setCharacters(['', '']); setOrganization(''); setWorldEventId(''); setTags(['', '', ''])
                setAuthorName(''); setIsAnonymous(false); setRelationship('')
                setCheckResult(null); setError('')
              }}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Submit another story
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#c8dde6] to-[#f8fbfa]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/60 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="The Good I Found" className="h-10 w-auto" />
        </Link>
        <span className="text-sm text-gray-500 hidden sm:block">The Archive of Human Goodness</span>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-10">

        {/* Title */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Story</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Every act of goodness deserves to be remembered. Write yours the way you'd tell it to a friend.
          </p>
        </div>

        {/* ── SECTION 1: YOUR STORY ─────────────────────────── */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Your Story</h2>

          {/* Image 1 — hero */}
          <ImageUpload
            slot={0}
            image={images[0]}
            fileRef={fileRefs[0]}
            label="Opening image (optional)"
            onUpload={uploadImage}
            onRemove={removeImage}
            onCaption={(caption) => setImages((prev) => prev.map((img, i) => i === 0 ? { ...img, caption } : img))}
          />

          {/* Opening */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening</label>
            <textarea
              rows={4}
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="Set the scene. Who is this story about, where were they, and when did this happen?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none bg-white"
            />
          </div>

          {/* Image 2 — mid-story */}
          <ImageUpload
            slot={1}
            image={images[1]}
            fileRef={fileRefs[1]}
            label="Mid-story image (optional)"
            onUpload={uploadImage}
            onRemove={removeImage}
            onCaption={(caption) => setImages((prev) => prev.map((img, i) => i === 1 ? { ...img, caption } : img))}
          />

          {/* Body */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">The Story</label>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell us what happened. What did they do, and why does it matter?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none bg-white"
            />
          </div>

          {/* Impact */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Impact <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              rows={3}
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="What changed because of this? How did it affect the people involved, or the world around them?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none bg-white"
            />
          </div>

          {/* Image 3 — closing */}
          <ImageUpload
            slot={2}
            image={images[2]}
            fileRef={fileRefs[2]}
            label="Closing image (optional)"
            onUpload={uploadImage}
            onRemove={removeImage}
            onCaption={(caption) => setImages((prev) => prev.map((img, i) => i === 2 ? { ...img, caption } : img))}
          />

        </div>

        {/* ── SECTION 2: ABOUT THE STORY ───────────────────── */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">About the Story</h2>
          <p className="text-sm text-gray-400 mb-6">This helps readers find your story. Only Country and Year are required.</p>

          {/* When */}
          <div className="flex gap-3 mb-5">
            <div className="flex flex-col gap-1 w-28 flex-shrink-0">
              <label className="text-xs font-medium text-gray-500">Year <span className="text-red-400">*</span></label>
              <input
                type="number"
                placeholder="e.g. 2019"
                min="1900"
                max={new Date().getFullYear()}
                value={occurredYear}
                onChange={(e) => setOccurredYear(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium text-gray-500">Month <span className="text-gray-400 font-normal">(if you remember)</span></label>
              <select
                value={occurredMonth}
                onChange={(e) => setOccurredMonth(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              >
                <option value="">— Month —</option>
                {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Where */}
          <div className="flex flex-col gap-3 mb-5">
            <div>
              <label className="text-xs font-medium text-gray-500">Country <span className="text-red-400">*</span></label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              >
                <option value="">Select a country…</option>
                {countryOptions.map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500">State / Province</label>
                <input
                  type="text"
                  placeholder="optional"
                  value={stateProvince}
                  onChange={(e) => setStateProvince(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500">City</label>
                <input
                  type="text"
                  placeholder="optional"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Main characters */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 block mb-1">Main Characters</label>
            <p className="text-xs text-gray-400 mb-2">Names of the people this story is about — helps readers search by name.</p>
            <div className="flex flex-col gap-2">
              {characters.map((name, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Person ${i + 1}`}
                    value={name}
                    onChange={(e) => setCharacters((prev) => prev.map((c, j) => j === i ? e.target.value : c))}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                  />
                  {characters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCharacters((prev) => prev.filter((_, j) => j !== i))}
                      className="text-gray-300 hover:text-red-400 text-lg leading-none px-2 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCharacters((prev) => [...prev, ''])}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium text-left transition-colors"
              >
                + Add another person
              </button>
            </div>
          </div>

          {/* Organization */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 block mb-1">Organization <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Red Cross, local fire station, a school…"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            />
          </div>

          {/* World event */}
          {worldEvents.length > 0 && (
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-500 block mb-1">World Event Connection <span className="text-gray-400 font-normal">(optional)</span></label>
              <p className="text-xs text-gray-400 mb-2">Was this story connected to a larger world moment?</p>
              <select
                value={worldEventId}
                onChange={(e) => setWorldEventId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              >
                <option value="">— Not connected to a specific event —</option>
                {worldEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}{ev.event_year ? ` (${ev.event_year})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Tags <span className="text-gray-400 font-normal">(up to 3)</span></label>
            <p className="text-xs text-gray-400 mb-2">One word or short phrase that captures something unique about this story.</p>
            <div className="flex gap-2">
              {tags.map((tag, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Tag ${i + 1}`}
                  value={tag}
                  maxLength={30}
                  onChange={(e) => setTags((prev) => prev.map((t, j) => j === i ? e.target.value : t))}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION 3: ABOUT YOU ─────────────────────────── */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">About You</h2>

          {/* Author name + anonymous */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 block mb-1">Your Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="How you'd like to be credited"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-emerald-400"
              />
              <span className="text-sm text-gray-500">Display my name as Anonymous</span>
            </label>
            {isAnonymous && (
              <p className="text-xs text-gray-400 mt-1 ml-6">Your name is collected for moderation only and will not be shown publicly.</p>
            )}
          </div>

          {/* Relationship */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">Your relationship to this story <span className="text-red-400">*</span></label>
            <div className="flex flex-col gap-2">
              {RELATIONSHIPS.map((r) => (
                <label key={r} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="relationship"
                    value={r}
                    checked={relationship === r}
                    onChange={() => setRelationship(r)}
                    className="text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{r}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── CHECK + SUBMIT ────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Check My Story */}
        <div className="mb-4">
          <button
            type="button"
            onClick={checkMyStory}
            disabled={checking || submitting}
            className="w-full bg-white border-2 border-emerald-300 text-emerald-700 font-medium py-3 rounded-xl hover:bg-emerald-50 disabled:opacity-50 transition-colors text-sm"
          >
            {checking ? 'Checking your story…' : '✦ Check My Story Before Submitting'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-1">
            Optional — run the same AI quality check our archive uses, before you submit.
          </p>
        </div>

        {/* Check result */}
        {checkResult && (
          <div className={`rounded-xl border px-5 py-4 mb-5 text-sm ${
            checkResult.passed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-center gap-2 font-semibold mb-1">
              {checkResult.passed ? '✓ Looks great!' : '✎ A few suggestions'}
              <span className="text-xs font-normal opacity-70">Score: {checkResult.score}/10</span>
            </div>
            <p>{checkResult.reason}</p>
            {checkResult.chapter && checkResult.passed && (
              <p className="mt-1 text-xs opacity-70">Suggested chapter: {checkResult.chapter}</p>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || checking}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors text-base"
        >
          {submitting ? 'Submitting your story…' : 'Submit to the Archive'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3 max-w-sm mx-auto">
          By submitting, you confirm this is your own original account and that you have the right to share it.
          Stories are permanent once submitted.
        </p>

      </form>
    </main>
  )
}

// ── ImageUpload sub-component ─────────────────────────────────
function ImageUpload({
  slot, image, fileRef, label, onUpload, onRemove, onCaption,
}: {
  slot: number
  image: { url: string | null; caption: string; uploading: boolean }
  fileRef: React.RefObject<HTMLInputElement | null>
  label: string
  onUpload: (slot: number, file: File) => void
  onRemove: (slot: number) => void
  onCaption: (caption: string) => void
}) {
  if (image.url) {
    return (
      <div className="mb-6">
        <div className="relative rounded-xl overflow-hidden mb-2">
          <img src={image.url} alt="" className="w-full max-h-60 object-cover" />
          <button
            type="button"
            onClick={() => onRemove(slot)}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm transition-colors"
          >
            ×
          </button>
        </div>
        <input
          type="text"
          placeholder="Caption (optional)"
          value={image.caption}
          onChange={(e) => onCaption(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
        />
      </div>
    )
  }

  return (
    <div className="mb-6">
      <label className="flex flex-col sm:flex-row items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-5 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 active:bg-emerald-50/50 transition-colors group select-none">
        {image.uploading ? (
          <span className="text-sm text-gray-400">Uploading…</span>
        ) : (
          <>
            {/* Camera icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors flex-shrink-0">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-gray-600 group-hover:text-emerald-700 transition-colors">
                📷 Take a photo or choose from your library
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={image.uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(slot, file)
          }}
        />
      </label>
    </div>
  )
}
