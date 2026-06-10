'use client'

import { useState } from 'react'
import { type ReaderSubmission } from '@/lib/supabase'
import { SECTIONS } from '@/lib/sections'
import { renderSummaryMarkdown } from '@/lib/summaryMarkdown'
import { sanitizeStoryHtml } from '@/lib/sanitizeHtml'

type Props = {
  submission: ReaderSubmission
  onApprove: (id: string, category: string) => Promise<void>
  onDismiss: (id: string) => Promise<void>
}

export default function SubmissionCard({ submission, onApprove, onDismiss }: Props) {
  const [category, setCategory] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [approving, setApproving] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  async function handleApprove() {
    if (!category) return
    setApproving(true)
    await onApprove(submission.id, category)
    setApproving(false)
  }

  async function handleDismiss() {
    setDismissing(true)
    await onDismiss(submission.id)
    setDismissing(false)
  }

  const busy = approving || dismissing

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col p-4 gap-2">
      <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
        <span className={`px-2 py-0.5 rounded-full font-semibold ${
          submission.type === 'article' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {submission.type === 'article' ? 'Article' : 'URL Recommendation'}
        </span>
        <span>{new Date(submission.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>

      <div className="text-sm text-gray-700">
        <span className="font-medium">{submission.submitter_name}</span>
        {submission.submitter_email && (
          <span className="text-gray-400"> · {submission.submitter_email}</span>
        )}
      </div>

      {submission.type === 'article' ? (
        <>
          {submission.image_url && (
            <img
              src={submission.image_url}
              alt=""
              className="w-full h-40 object-cover rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <p className="text-gray-900 font-semibold text-sm leading-snug">{submission.title}</p>
          {submission.summary && (
            <div className="text-gray-500 text-xs leading-relaxed">{renderSummaryMarkdown(submission.summary)}</div>
          )}
          {submission.content && (
            <div>
              <div
                className={`text-gray-600 text-xs leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_p]:my-1 ${expanded ? '' : 'line-clamp-4'}`}
                dangerouslySetInnerHTML={{ __html: sanitizeStoryHtml(submission.content) }}
              />
              <button
                onClick={() => setExpanded((e) => !e)}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium mt-1"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            </div>
          )}
          {submission.attested && (
            <p className="text-xs text-emerald-600">✓ Author attests this is accurate</p>
          )}
        </>
      ) : (
        <>
          <a
            href={submission.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-800 font-medium text-sm break-all"
          >
            {submission.url}
          </a>
          {submission.reason && (
            <p className="text-gray-500 text-xs leading-relaxed">{submission.reason}</p>
          )}
        </>
      )}

      <div className="pt-1">
        <label className="text-xs text-gray-400 mb-1 block">Section</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="">Choose a section…</option>
          {SECTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mt-auto pt-2">
        <button
          onClick={handleApprove}
          disabled={!category || busy}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium py-1.5 rounded-lg transition-colors"
        >
          {approving ? 'Approving…' : 'Approve'}
        </button>
        <button
          onClick={handleDismiss}
          disabled={busy}
          className="flex-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 text-gray-500 text-sm font-medium py-1.5 rounded-lg transition-colors"
        >
          {dismissing ? 'Dismissing…' : 'Dismiss'}
        </button>
      </div>
    </div>
  )
}
