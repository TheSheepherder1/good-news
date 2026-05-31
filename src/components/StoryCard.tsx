'use client'

import { useState } from 'react'
import { type Story } from '@/lib/supabase'
import { SECTIONS } from '@/lib/sections'

type Props = {
  story: Story
  displayTitle?: string
  displaySummary?: string
  sourcePrefix?: string
  categoryLabel?: string
  onOpen?: (story: Story) => void
  onApprove?: (id: string) => void
  onSkip?: (id: string) => void
  onFeature?: (story: Story) => void
  onRescue?: (id: string) => void
  onUploadImage?: (id: string, file: File) => Promise<boolean>
  onCategoryChange?: (id: string, category: string) => void
  onUnpublish?: (id: string) => void
  onRemoveImage?: (id: string) => void
  aiCategory?: string
  adminMode?: boolean
  tab?: 'pending' | 'approved' | 'skipped' | 'published'
}

export default function StoryCard({ story, displayTitle, displaySummary, sourcePrefix = 'Source: ', categoryLabel, onOpen, onApprove, onSkip, onFeature, onRescue, onUploadImage, onCategoryChange, onUnpublish, onRemoveImage, aiCategory, adminMode, tab }: Props) {
  const title = displayTitle || story.title
  const summary = displaySummary || story.summary
  const catDisplay = categoryLabel || story.category || story.source
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)

  async function handleUpload(file: File) {
    if (!onUploadImage) return
    setUploading(true)
    const success = await onUploadImage(story.id, file)
    setUploading(false)
    if (success) {
      setUploadDone(true)
      setTimeout(() => setUploadDone(false), 2500)
    }
  }
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col ${story.is_featured ? 'border-yellow-300 ring-2 ring-yellow-200' : 'border-gray-100'} ${onOpen ? 'cursor-pointer' : ''}`}
      onClick={onOpen ? () => onOpen(story) : undefined}
    >
      {story.image_url && (
        <img
          src={story.image_url}
          alt=""
          className="w-full h-44 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
          {story.is_featured && (
            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
              Featured
            </span>
          )}
          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            {catDisplay}
          </span>
          <span>{sourcePrefix}{story.source}</span>
        </div>

        {onOpen ? (
          <p className="text-gray-900 font-semibold text-sm leading-snug line-clamp-2">{title}</p>
        ) : (
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 font-semibold text-sm leading-snug line-clamp-2 hover:text-emerald-700 transition-colors"
          >
            {title}
          </a>
        )}

        {summary && (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{summary}</p>
        )}

        {adminMode && story.ai_reason && (
          <p className="text-xs text-indigo-500 italic">AI: {story.ai_reason} (score: {story.ai_score}/10)</p>
        )}

        {adminMode && (tab === 'pending' || tab === 'published') && onCategoryChange && (
          <div className="pt-1">
            <label className="text-xs text-gray-400 mb-1 block">Section</label>
            <select
              value={story.category || ''}
              onChange={(e) => onCategoryChange(story.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {aiCategory && !SECTIONS.includes(aiCategory as typeof SECTIONS[number]) && (
                <option value={aiCategory}>{aiCategory} (AI suggested)</option>
              )}
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}{s === aiCategory ? ' (AI suggested)' : ''}</option>
              ))}
            </select>
          </div>
        )}

        {adminMode && tab === 'pending' && onApprove && onSkip && (
          <div className="flex gap-2 mt-auto pt-2">
            <button
              onClick={() => onApprove(story.id)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-1.5 rounded-lg transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => onSkip(story.id)}
              className="flex-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 text-sm font-medium py-1.5 rounded-lg transition-colors"
            >
              Skip
            </button>
          </div>
        )}

        {adminMode && (tab === 'approved' || tab === 'published') && onFeature && (
          <div className="flex gap-2 mt-auto pt-2">
            <button
              onClick={() => onFeature(story)}
              className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors ${
                story.is_featured
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-yellow-50 hover:text-yellow-700'
              }`}
            >
              {story.is_featured ? 'Featured' : 'Set as Featured'}
            </button>
          </div>
        )}

        {adminMode && onUploadImage && (
          <div className="border-t border-gray-100 pt-2 mt-1 flex flex-col gap-1">
            <label className={`flex items-center justify-center gap-2 w-full border text-xs font-medium py-1.5 rounded-lg transition-colors ${
              uploading ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-wait' :
              uploadDone ? 'bg-emerald-500 text-white border-emerald-500 cursor-default' :
              'bg-gray-50 hover:bg-gray-100 text-gray-500 border-dashed border-gray-300 cursor-pointer'
            }`}>
              {uploading ? 'Uploading…' : uploadDone ? '✓ Image added!' : story.image_url ? 'Replace Image' : 'Add Image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }}
              />
            </label>
            {story.image_url && onRemoveImage && !uploading && (
              <button
                onClick={() => onRemoveImage(story.id)}
                className="w-full bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-400 text-xs font-medium py-1.5 rounded-lg transition-colors"
              >
                Remove Image
              </button>
            )}
          </div>
        )}

        {adminMode && tab === 'published' && onUnpublish && (
          <div className="mt-auto pt-2">
            <button
              onClick={() => onUnpublish(story.id)}
              className="w-full bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 text-sm font-medium py-1.5 rounded-lg transition-colors"
            >
              Unpublish
            </button>
          </div>
        )}

        {adminMode && tab === 'skipped' && onRescue && (
          <div className="flex gap-2 mt-auto pt-2">
            <button
              onClick={() => onRescue(story.id)}
              className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium py-1.5 rounded-lg transition-colors"
            >
              Move to Approved
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
