'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { getAllCountriesSorted, LANG_TO_LOCALE } from '@/lib/countries'
import { useArchiveSubmitStrings } from '@/lib/useArchiveStrings'
import type { WorldEvent } from '@/lib/supabase'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MIN_OPENING = 200
const MIN_BODY = 500
const MIN_IMPACT = 200

// English values stored in DB — order must match ARCHIVE_SUBMIT_EN relationship keys
const RELATIONSHIP_VALUES = [
  'I witnessed this',
  'This happened to me',
  'This is a family story',
  'This is a community story',
  'I read about this',
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

  // Language (for translations + country/month names)
  const [lang, setLang] = useState('en')
  useEffect(() => {
    const stored = localStorage.getItem('tgif_lang')
    if (stored) setLang(stored)
  }, [])

  const s = useArchiveSubmitStrings(lang)
  const countryOptions = useMemo(() => getAllCountriesSorted(lang), [lang])
  const monthNames = useMemo(() => {
    const locale = LANG_TO_LOCALE[lang] || lang
    return Array.from({ length: 12 }, (_, i) =>
      new Date(2000, i).toLocaleString(locale, { month: 'long' })
    )
  }, [lang])
  const relationshipOptions = useMemo(() => [
    { value: RELATIONSHIP_VALUES[0], label: s.relationshipWitnessed },
    { value: RELATIONSHIP_VALUES[1], label: s.relationshipHappenedToMe },
    { value: RELATIONSHIP_VALUES[2], label: s.relationshipFamily },
    { value: RELATIONSHIP_VALUES[3], label: s.relationshipCommunity },
    { value: RELATIONSHIP_VALUES[4], label: s.relationshipRead },
  ], [s])

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
    if (!opening.trim() && !body.trim()) { setError(s.errorStoryRequired); return }
    if (opening.trim() && opening.trim().length < MIN_OPENING) { setError(s.errorOpeningTooShort.replace('{min}', String(MIN_OPENING))); return }
    if (body.trim() && body.trim().length < MIN_BODY) { setError(s.errorBodyTooShort.replace('{min}', String(MIN_BODY))); return }
    if (impact.trim() && impact.trim().length < MIN_IMPACT) { setError(s.errorImpactTooShort.replace('{min}', String(MIN_IMPACT))); return }
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
      setError(s.errorCheckFailed)
    } finally {
      setChecking(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!opening.trim() && !body.trim()) { setError(s.errorStoryRequired); return }
    if (opening.trim().length < MIN_OPENING) { setError(s.errorOpeningTooShort.replace('{min}', String(MIN_OPENING))); return }
    if (body.trim().length < MIN_BODY) { setError(s.errorBodyTooShort.replace('{min}', String(MIN_BODY))); return }
    if (impact.trim() && impact.trim().length < MIN_IMPACT) { setError(s.errorImpactTooShort.replace('{min}', String(MIN_IMPACT))); return }
    if (!occurredYear.trim()) { setError(s.errorYearRequired); return }
    if (!country.trim()) { setError(s.errorCountryRequired); return }
    if (!authorName.trim()) { setError(s.errorNameRequired); return }
    if (!relationship) { setError(s.errorRelationshipRequired); return }

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
      if (!data.ok) throw new Error(data.error || s.errorSubmitFailed)
      setSubmittedLive(data.live)
      setSubmittedChapter(data.chapter)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : s.errorSubmitFailed)
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
            {submittedLive ? s.successLiveTitle : s.successReviewTitle}
          </h1>
          {submittedLive ? (
            <p className="text-gray-500 mb-2">
              {s.successLiveBody}
              {submittedChapter
                ? ` ${s.successLiveChapter.replace('{chapter}', submittedChapter)}`
                : ''}.
              {' '}{s.successLiveEnd}
            </p>
          ) : (
            <p className="text-gray-500 mb-2">{s.successReviewBody}</p>
          )}
          <p className="text-sm text-gray-400 mb-6">{s.successPermanent}</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-colors"
            >
              {s.backToSite}
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
              {s.submitAnother}
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
        <span className="text-sm text-gray-500 hidden sm:block">{s.headerSubtitle}</span>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-10">

        {/* Title */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{s.pageTitle}</h1>
          <p className="text-gray-500 max-w-md mx-auto">{s.pageSubtitle}</p>
        </div>

        {/* ── SECTION 1: YOUR STORY ─────────────────────────── */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">{s.sectionYourStory}</h2>

          {/* Image 1 — hero */}
          <ImageUpload
            slot={0}
            image={images[0]}
            fileRef={fileRefs[0]}
            label={s.imageLabel1}
            uploadText={s.imageUpload}
            uploadingText={s.imageUploading}
            captionPlaceholder={s.imageCaption}
            onUpload={uploadImage}
            onRemove={removeImage}
            onCaption={(caption) => setImages((prev) => prev.map((img, i) => i === 0 ? { ...img, caption } : img))}
          />

          {/* Opening */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">{s.openingLabel}</label>
            <textarea
              rows={4}
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder={s.openingPlaceholder}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none bg-white"
            />
            <CharCounter count={opening.trim().length} min={MIN_OPENING} />
          </div>

          {/* Image 2 — mid-story */}
          <ImageUpload
            slot={1}
            image={images[1]}
            fileRef={fileRefs[1]}
            label={s.imageLabel2}
            uploadText={s.imageUpload}
            uploadingText={s.imageUploading}
            captionPlaceholder={s.imageCaption}
            onUpload={uploadImage}
            onRemove={removeImage}
            onCaption={(caption) => setImages((prev) => prev.map((img, i) => i === 1 ? { ...img, caption } : img))}
          />

          {/* Body */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">{s.bodyLabel}</label>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={s.bodyPlaceholder}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none bg-white"
            />
            <CharCounter count={body.trim().length} min={MIN_BODY} />
          </div>

          {/* Impact */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {s.impactLabel} <span className="text-gray-400 font-normal">{s.impactOptional}</span>
            </label>
            <textarea
              rows={3}
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder={s.impactPlaceholder}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none bg-white"
            />
            {impact.trim().length > 0 && <CharCounter count={impact.trim().length} min={MIN_IMPACT} />}
          </div>

          {/* Image 3 — closing */}
          <ImageUpload
            slot={2}
            image={images[2]}
            fileRef={fileRefs[2]}
            label={s.imageLabel3}
            uploadText={s.imageUpload}
            uploadingText={s.imageUploading}
            captionPlaceholder={s.imageCaption}
            onUpload={uploadImage}
            onRemove={removeImage}
            onCaption={(caption) => setImages((prev) => prev.map((img, i) => i === 2 ? { ...img, caption } : img))}
          />

        </div>

        {/* ── SECTION 2: ABOUT THE STORY ───────────────────── */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">{s.sectionAboutStory}</h2>
          <p className="text-sm text-gray-400 mb-6">{s.aboutStoryHint}</p>

          {/* When */}
          <div className="flex gap-3 mb-5">
            <div className="flex flex-col gap-1 w-28 flex-shrink-0">
              <label className="text-xs font-medium text-gray-500">{s.yearLabel} <span className="text-red-400">*</span></label>
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
              <label className="text-xs font-medium text-gray-500">
                {s.monthLabel} <span className="text-gray-400 font-normal">{s.monthOptional}</span>
              </label>
              <select
                value={occurredMonth}
                onChange={(e) => setOccurredMonth(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              >
                <option value="">{s.monthDefault}</option>
                {monthNames.map((name, i) => (
                  <option key={i} value={String(i + 1)}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Where */}
          <div className="flex flex-col gap-3 mb-5">
            <div>
              <label className="text-xs font-medium text-gray-500">{s.countryLabel} <span className="text-red-400">*</span></label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              >
                <option value="">{s.countryDefault}</option>
                {countryOptions.map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500">{s.stateLabel}</label>
                <input
                  type="text"
                  placeholder={s.optionalPlaceholder}
                  value={stateProvince}
                  onChange={(e) => setStateProvince(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500">{s.cityLabel}</label>
                <input
                  type="text"
                  placeholder={s.optionalPlaceholder}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Main characters */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 block mb-1">{s.charactersLabel}</label>
            <p className="text-xs text-gray-400 mb-2">{s.charactersHint}</p>
            <div className="flex flex-col gap-2">
              {characters.map((name, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={s.personLabel.replace('{n}', String(i + 1))}
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
                {s.addPerson}
              </button>
            </div>
          </div>

          {/* Organization */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 block mb-1">
              {s.organizationLabel} <span className="text-gray-400 font-normal">{s.organizationOptional}</span>
            </label>
            <input
              type="text"
              placeholder={s.organizationPlaceholder}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            />
          </div>

          {/* World event */}
          {worldEvents.length > 0 && (
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-500 block mb-1">
                {s.worldEventLabel} <span className="text-gray-400 font-normal">{s.worldEventOptional}</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">{s.worldEventHint}</p>
              <select
                value={worldEventId}
                onChange={(e) => setWorldEventId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              >
                <option value="">{s.worldEventDefault}</option>
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
            <label className="text-xs font-medium text-gray-500 block mb-1">
              {s.tagsLabel} <span className="text-gray-400 font-normal">{s.tagsCount}</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">{s.tagsHint}</p>
            <div className="flex gap-2">
              {tags.map((tag, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={s.tagLabel.replace('{n}', String(i + 1))}
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
          <h2 className="text-lg font-semibold text-gray-800 mb-6">{s.sectionAboutYou}</h2>

          {/* Author name + anonymous */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-500 block mb-1">
              {s.nameLabel} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder={s.namePlaceholder}
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
              <span className="text-sm text-gray-500">{s.anonymousLabel}</span>
            </label>
            {isAnonymous && (
              <p className="text-xs text-gray-400 mt-1 ml-6">{s.anonymousNote}</p>
            )}
          </div>

          {/* Relationship */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">
              {s.relationshipLabel} <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-col gap-2">
              {relationshipOptions.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="relationship"
                    value={value}
                    checked={relationship === value}
                    onChange={() => setRelationship(value)}
                    className="text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
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
            {checking ? s.checkingButton : s.checkButton}
          </button>
          <p className="text-xs text-gray-400 text-center mt-1">{s.checkOptionalNote}</p>
        </div>

        {/* Check result */}
        {checkResult && (
          <div className={`rounded-xl border px-5 py-4 mb-5 text-sm ${
            checkResult.passed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-center gap-2 font-semibold mb-1">
              {checkResult.passed ? s.checkPassed : s.checkSuggestions}
              <span className="text-xs font-normal opacity-70">
                {s.checkScore.replace('{n}', String(checkResult.score))}
              </span>
            </div>
            <p>{checkResult.reason}</p>
            {checkResult.chapter && checkResult.passed && (
              <p className="mt-1 text-xs opacity-70">
                {s.checkChapter.replace('{name}', checkResult.chapter)}
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || checking}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors text-base"
        >
          {submitting ? s.submittingButton : s.submitButton}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3 max-w-sm mx-auto">
          {s.submitDisclaimer}
        </p>

      </form>
    </main>
  )
}

// ── ImageUpload sub-component ─────────────────────────────────
function ImageUpload({
  slot, image, fileRef, label, uploadText, uploadingText, captionPlaceholder,
  onUpload, onRemove, onCaption,
}: {
  slot: number
  image: { url: string | null; caption: string; uploading: boolean }
  fileRef: React.RefObject<HTMLInputElement | null>
  label: string
  uploadText: string
  uploadingText: string
  captionPlaceholder: string
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
          placeholder={captionPlaceholder}
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
          <span className="text-sm text-gray-400">{uploadingText}</span>
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
                📷 {uploadText}
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

function CharCounter({ count, min }: { count: number; min: number }) {
  const met = count >= min
  return (
    <p className={`text-xs mt-1 text-right tabular-nums transition-colors ${met ? 'text-emerald-500' : 'text-gray-400'}`}>
      {met ? `✓ ${count}` : `${count} / ${min}`}
    </p>
  )
}
