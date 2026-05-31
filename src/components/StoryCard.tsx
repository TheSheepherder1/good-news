'use client'

import { type Story } from '@/lib/supabase'

type Props = {
  story: Story
  onOpen?: (story: Story) => void
  onApprove?: (id: string) => void
  onSkip?: (id: string) => void
  onFeature?: (story: Story) => void
  onRescue?: (id: string) => void
  onUploadImage?: (id: string, file: File) => void
  adminMode?: boolean
  tab?: 'pending' | 'approved' | 'skipped'
}

export default function StoryCard({ story, onOpen, onApprove, onSkip, onFeature, onRescue, onUploadImage, adminMode, tab }: Props) {
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
            {story.category || story.source}
          </span>
          <span>{story.source}</span>
        </div>

        {onOpen ? (
          <p className="text-gray-900 font-semibold text-sm leading-snug">
            {story.title}
          </p>
        ) : (
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 font-semibold text-sm leading-snug hover:text-emerald-700 transition-colors"
          >
            {story.title}
          </a>
        )}

        {story.summary && (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{story.summary}</p>
        )}

        {adminMode && story.ai_reason && (
          <p className="text-xs text-indigo-500 italic">AI: {story.ai_reason} (score: {story.ai_score}/10)</p>
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

        {adminMode && tab === 'approved' && onFeature && (
          <div className="flex flex-col gap-2 mt-auto pt-2">
            <button
              onClick={() => onFeature(story)}
              className={`w-full text-sm font-medium py-1.5 rounded-lg transition-colors ${
                story.is_featured
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-yellow-50 hover:text-yellow-700'
              }`}
            >
              {story.is_featured ? 'Featured' : 'Set as Featured'}
            </button>
            {story.is_featured && onUploadImage && (
              <div className="border-t border-gray-100 pt-2">
                <p className="text-xs text-gray-400 mb-1">
                  {story.image_url ? 'Replace featured image' : 'Add featured image'}
                </p>
                {story.image_url && (
                  <img src={story.image_url} alt="" className="w-full h-24 object-cover rounded-lg mb-2"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
                <label className="flex items-center justify-center gap-2 w-full bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 text-gray-500 text-xs font-medium py-2 rounded-lg cursor-pointer transition-colors">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onUploadImage(story.id, file)
                    }}
                  />
                </label>
              </div>
            )}
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
