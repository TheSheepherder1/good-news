'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/components/RichTextEditor'
import LanguagePicker from '@/components/LanguagePicker'
import { LANG_STORAGE_KEY } from '@/lib/translations'
import { useContributeStrings } from '@/lib/useContributeStrings'
import { translateServerMessage } from '@/lib/contributeStrings'

type Mode = 'article' | 'url'

function isEmptyRich(value: string): boolean {
  return value.replace(/<[^>]*>/g, '').trim() === ''
}

export default function ContributePage() {
  const router = useRouter()
  const [lang, setLang] = useState('en')
  const { s, translating } = useContributeStrings(lang)

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY)
    if (stored) setLang(stored)
  }, [])

  function handleLanguageChange(newLang: string) {
    setLang(newLang)
    localStorage.setItem(LANG_STORAGE_KEY, newLang)
  }

  const [mode, setMode] = useState<Mode>('article')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [attested, setAttested] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [reason, setReason] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showThankYou, setShowThankYou] = useState(false)

  function resetForm() {
    setName('')
    setEmail('')
    setTitle('')
    setSummary('')
    setContent('')
    setAttested(false)
    setImage(null)
    setUrl('')
    setReason('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'article' && (isEmptyRich(summary) || isEmptyRich(content))) {
      setError(s.fillRequired)
      return
    }

    setSubmitting(true)

    const formData = new FormData()
    formData.append('type', mode)
    formData.append('submitter_name', name)
    formData.append('submitter_email', email)
    formData.append('website', website)

    if (mode === 'article') {
      formData.append('title', title)
      formData.append('summary', summary)
      formData.append('content', content)
      formData.append('attested', attested ? 'true' : 'false')
      if (image) formData.append('image', image)
    } else {
      formData.append('url', url)
      formData.append('reason', reason)
    }

    try {
      const res = await fetch('/api/submit', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.ok) {
        resetForm()
        setShowThankYou(true)
      } else {
        setError(data.error ? translateServerMessage(data.error, s) : s.genericError)
      }
    } catch {
      setError(s.genericError)
    } finally {
      setSubmitting(false)
    }
  }

  const toolbarLabels = {
    bold: s.bold,
    italic: s.italic,
    underline: s.underline,
    bulletList: s.bulletList,
    fontSizeSmall: s.fontSizeSmall,
    fontSizeNormal: s.fontSizeNormal,
    fontSizeLarge: s.fontSizeLarge,
    fontSizeHeading: s.fontSizeHeading,
  }

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #c8dde6 0%, #f8fbfa 100%)' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-2 mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {s.back}
          </Link>
          <LanguagePicker current={lang} translating={translating} onChange={handleLanguageChange} translatingLabel={s.translating} />
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 md:p-10 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{s.pageTitle}</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              {s.pageDescription}
            </p>
          </div>

          <div className="flex gap-2 bg-white/70 rounded-xl p-1 w-fit">
            <button
              type="button"
              onClick={() => { setMode('article'); setError(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'article' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {s.writeArticle}
            </button>
            <button
              type="button"
              onClick={() => { setMode('url'); setError(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'url' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {s.recommendStory}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Honeypot — hidden from real users, off-screen so it stays in the DOM for bots */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label>
                Website
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{s.yourName}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{s.email} <span className="text-gray-400 font-normal">{s.optional}</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={200}
                  placeholder={s.emailPlaceholder}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            </div>

            {mode === 'article' ? (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{s.title}</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{s.shortSummary} <span className="text-gray-400 font-normal">{s.shortSummaryHint}</span></label>
                  <RichTextEditor
                    mode="markdown"
                    value={summary}
                    onChange={setSummary}
                    maxLength={500}
                    minHeightClass="min-h-[70px]"
                    labels={toolbarLabels}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{s.fullStory}</label>
                  <RichTextEditor
                    mode="html"
                    value={content}
                    onChange={setContent}
                    maxLength={20000}
                    minHeightClass="min-h-[260px]"
                    labels={toolbarLabels}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{s.photo} <span className="text-gray-400 font-normal">{s.photoHint}</span></label>
                  <label className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-dashed border-gray-300 text-gray-500 text-sm py-2 px-3 rounded-lg cursor-pointer transition-colors w-fit">
                    {image ? image.name : s.chooseImage}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div className="bg-white/70 border border-emerald-100 rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-sm text-gray-700">{s.attestationThanks}</p>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1.5">{s.attestationIntro}</p>
                    <ul className="text-sm text-gray-600 list-disc pl-5 flex flex-col gap-1">
                      <li>{s.attestationOriginal}</li>
                      <li>{s.attestationCopyright}</li>
                      <li>{s.attestationPrivacy}</li>
                      <li>{s.attestationHuman}</li>
                      <li>{s.attestationTrue}</li>
                      <li>{s.attestationNoCompensation}</li>
                      <li>{s.attestationNoEdits}</li>
                      <li>{s.attestationEditorial}</li>
                    </ul>
                  </div>
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      required
                      checked={attested}
                      onChange={(e) => setAttested(e.target.checked)}
                      className="mt-0.5"
                    />
                    {s.attestationCheckbox}
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{s.urlLabel}</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…"
                    maxLength={2000}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{s.whyBelong} <span className="text-gray-400 font-normal">{s.optional}</span></label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (mode === 'article' && !attested)}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors w-fit px-6"
            >
              {submitting ? s.submitting : s.submit}
            </button>
          </form>
        </div>
      </div>

      {showThankYou && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-5 text-center">
            <p className="text-sm text-gray-700 leading-relaxed">{s.thankYouMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg transition-colors px-8 mx-auto"
            >
              {s.thankYouOk}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
