'use client'

import { useState } from 'react'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'

type Mode = 'article' | 'url'

function isEmptyRich(value: string): boolean {
  return value.replace(/<[^>]*>/g, '').trim() === ''
}

export default function ContributePage() {
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
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

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
    setResult(null)

    if (mode === 'article' && (isEmptyRich(summary) || isEmptyRich(content))) {
      setResult({ ok: false, message: 'Please fill in the summary and full story.' })
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
        setResult({ ok: true, message: "Thanks! We'll take a look and may reach out if you left an email." })
        resetForm()
      } else {
        setResult({ ok: false, message: data.error || 'Something went wrong. Please try again.' })
      }
    } catch {
      setResult({ ok: false, message: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #c8dde6 0%, #f8fbfa 100%)' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to The Good I Found
        </Link>

        <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 md:p-10 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Share a Story</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Got some good news to share? Write up your own story, or point us to one you found
              elsewhere. Every submission is reviewed by a real person before it goes live.
            </p>
          </div>

          <div className="flex gap-2 bg-white/70 rounded-xl p-1 w-fit">
            <button
              type="button"
              onClick={() => { setMode('article'); setResult(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'article' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Write an Article
            </button>
            <button
              type="button"
              onClick={() => { setMode('url'); setResult(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'url' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Recommend a Story
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
                <label className="text-sm font-medium text-gray-700">Your Name</label>
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
                <label className="text-sm font-medium text-gray-700">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={200}
                  placeholder="In case we'd like to follow up"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            </div>

            {mode === 'article' ? (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Title</label>
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
                  <label className="text-sm font-medium text-gray-700">Short Summary <span className="text-gray-400 font-normal">(shows on the story card, 500 chars max)</span></label>
                  <RichTextEditor
                    mode="markdown"
                    value={summary}
                    onChange={setSummary}
                    maxLength={500}
                    minHeightClass="min-h-[70px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Full Story</label>
                  <RichTextEditor
                    mode="html"
                    value={content}
                    onChange={setContent}
                    maxLength={20000}
                    minHeightClass="min-h-[260px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Photo <span className="text-gray-400 font-normal">(optional, 1 image)</span></label>
                  <label className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-dashed border-gray-300 text-gray-500 text-sm py-2 px-3 rounded-lg cursor-pointer transition-colors w-fit">
                    {image ? image.name : 'Choose image…'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    required
                    checked={attested}
                    onChange={(e) => setAttested(e.target.checked)}
                    className="mt-0.5"
                  />
                  I confirm this story is accurate to the best of my knowledge.
                </label>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">URL of the Story</label>
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
                  <label className="text-sm font-medium text-gray-700">Why does this belong here? <span className="text-gray-400 font-normal">(optional)</span></label>
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

            {result && (
              <div className={`text-sm rounded-lg px-3 py-2 ${result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {result.message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors w-fit px-6"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
