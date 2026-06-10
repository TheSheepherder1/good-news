import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { sanitizeStoryHtml } from '@/lib/sanitizeHtml'

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: story } = await supabaseAdmin
    .from('stories')
    .select('*')
    .eq('id', id)
    .eq('is_custom', true)
    .single()

  if (!story) notFound()

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
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

        <article className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
          {story.image_url && (
            <img
              src={story.image_url}
              alt=""
              className="w-full h-72 object-cover"
            />
          )}

          <div className="p-8 flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              {story.category && (
                <span className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full font-medium">
                  {story.category}
                </span>
              )}
              <span className="text-xs text-gray-400">Source: {story.source}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
              {story.title}
            </h1>

            {(story.content || story.summary) && (
              story.content_format === 'rich' ? (
                <div
                  className="text-gray-600 text-base leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_p]:my-2"
                  dangerouslySetInnerHTML={{ __html: sanitizeStoryHtml(story.content || '') }}
                />
              ) : (
                <div className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap">
                  {story.content || story.summary}
                </div>
              )
            )}
          </div>
        </article>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-3 rounded-full transition-colors"
          >
            More Good News
          </Link>
        </div>

      </div>
    </main>
  )
}
