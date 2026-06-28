'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LanguagePicker from '@/components/LanguagePicker'
import { LANGUAGES, LANG_STORAGE_KEY, type Language } from '@/lib/translations'
import { useContributeStrings } from '@/lib/useContributeStrings'
import { translateServerMessage } from '@/lib/contributeStrings'

export default function ContributePage() {
  const router = useRouter()
  const [lang, setLang] = useState<Language>('en')
  const { s, translating } = useContributeStrings(lang)

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as Language | null
    if (stored && LANGUAGES.some((l) => l.code === stored)) setLang(stored)
  }, [])

  function handleLanguageChange(newLang: Language) {
    setLang(newLang)
    localStorage.setItem(LANG_STORAGE_KEY, newLang)
  }

  const [choice, setChoice] = useState<null | 'url'>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [url, setUrl] = useState('')
  const [reason, setReason] = useState('')
  const [website, setWebsite] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showThankYou, setShowThankYou] = useState(false)

  function resetForm() {
    setName('')
    setEmail('')
    setUrl('')
    setReason('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const formData = new FormData()
    formData.append('type', 'url')
    formData.append('submitter_name', name)
    formData.append('submitter_email', email)
    formData.append('website', website)
    formData.append('url', url)
    formData.append('reason', reason)

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

        {choice === null ? (
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 md:p-10 flex flex-col gap-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">How would you like to contribute?</h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every act of goodness deserves to be remembered. Choose what you&apos;d like to share.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                href="/archive/submit"
                className="group flex flex-col gap-4 bg-white rounded-2xl border border-emerald-100 p-6 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl">
                  ✨
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-emerald-700 transition-colors">
                    Share a story of goodness
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    A moment of kindness, courage, or hope — something you witnessed, lived, or heard about firsthand.
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:gap-2 transition-all">
                  Tell your story
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>

              <button
                onClick={() => setChoice('url')}
                className="group flex flex-col gap-4 bg-white rounded-2xl border border-gray-100 p-6 hover:border-emerald-300 hover:shadow-md transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-2xl">
                  🔗
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-emerald-700 transition-colors">
                    Recommend a news article
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Found a great story online? Share the link and we&apos;ll review it for the site.
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-sky-600 group-hover:gap-2 transition-all">
                  Share a link
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 md:p-10 flex flex-col gap-6">
            <div>
              <button
                type="button"
                onClick={() => { setChoice(null); setError(null) }}
                className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800 font-medium mb-4 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Choose differently
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Recommend a news article</h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                Share a link to a story of goodness you found online.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  <label className="text-sm font-medium text-gray-700">
                    {s.email} <span className="text-gray-400 font-normal">{s.optional}</span>
                  </label>
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
                <label className="text-sm font-medium text-gray-700">
                  {s.whyBelong} <span className="text-gray-400 font-normal">{s.optional}</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>

              {error && (
                <div className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors w-fit px-6"
              >
                {submitting ? s.submitting : s.submit}
              </button>
            </form>
          </div>
        )}
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
