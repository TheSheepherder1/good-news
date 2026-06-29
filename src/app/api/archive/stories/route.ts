import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const chapterSlug = searchParams.get('chapter') || ''
  const country    = searchParams.get('country') || ''
  const year       = searchParams.get('year') || ''
  const eventId    = searchParams.get('event') || ''
  const language   = searchParams.get('language') || ''
  const tag        = searchParams.get('tag') || ''
  const author     = searchParams.get('author') || ''
  const limit      = Math.min(Number(searchParams.get('limit') || 24), 100)
  const offset     = Number(searchParams.get('offset') || 0)

  // Resolve chapter slug → id
  let chapterId = ''
  if (chapterSlug) {
    const { data: ch } = await supabaseAdmin
      .from('archive_chapters')
      .select('id')
      .eq('slug', chapterSlug)
      .single()
    if (ch) chapterId = ch.id
  }

  // Story query (paginated)
  let storyQ = supabaseAdmin
    .from('archive_stories')
    .select('id, opening, body, image_1_url, image_1_caption, occurred_year, occurred_month, country, city, state_province, original_language, tags, author_name, is_anonymous, is_seed, published_at, chapter_id, world_event_id, chapter:archive_chapters(id, name, slug), world_event:world_events(id, name)')
    .eq('status', 'live')
  if (chapterId)  storyQ = storyQ.eq('chapter_id', chapterId)
  if (country)    storyQ = storyQ.eq('country', country)
  if (year)       storyQ = storyQ.eq('occurred_year', Number(year))
  if (eventId)    storyQ = storyQ.eq('world_event_id', eventId)
  if (language)   storyQ = storyQ.eq('original_language', language)
  if (tag)        storyQ = storyQ.contains('tags', [tag])
  if (author)     storyQ = storyQ.ilike('author_name', `%${author}%`).eq('is_anonymous', false)

  // Filter options query (all matching rows, minimal fields)
  let filterQ = supabaseAdmin
    .from('archive_stories')
    .select('id, country, occurred_year, original_language, chapter_id, world_event_id, tags')
    .eq('status', 'live')
  if (chapterId)  filterQ = filterQ.eq('chapter_id', chapterId)
  if (country)    filterQ = filterQ.ilike('country', country)
  if (year)       filterQ = filterQ.eq('occurred_year', Number(year))
  if (eventId)    filterQ = filterQ.eq('world_event_id', eventId)
  if (language)   filterQ = filterQ.eq('original_language', language)
  if (tag)        filterQ = filterQ.contains('tags', [tag])
  if (author)     filterQ = filterQ.ilike('author_name', `%${author}%`).eq('is_anonymous', false)

  const [storiesRes, filterRes, chaptersRes, eventsRes] = await Promise.all([
    storyQ.order('published_at', { ascending: false }).range(offset, offset + limit - 1),
    filterQ,
    supabaseAdmin.from('archive_chapters').select('id, name, slug').eq('status', 'active').order('sort_order'),
    supabaseAdmin.from('world_events').select('id, name, event_year').order('sort_order'),
  ])

  if (storiesRes.error) return NextResponse.json({ error: storiesRes.error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRows: any[] = filterRes.data || []

  // Derive available filter values from the full (unfiltered on that dimension) result set
  const countryCounts = new Map<string, number>()
  const yearCounts    = new Map<number, number>()
  const langCounts    = new Map<string, number>()
  const eventCounts   = new Map<string, number>()
  const chapterCounts = new Map<string, number>()
  const tagCounts     = new Map<string, number>()

  for (const row of allRows) {
    if (row.country)          countryCounts.set(row.country, (countryCounts.get(row.country) || 0) + 1)
    if (row.occurred_year)    yearCounts.set(row.occurred_year, (yearCounts.get(row.occurred_year) || 0) + 1)
    if (row.original_language) langCounts.set(row.original_language, (langCounts.get(row.original_language) || 0) + 1)
    if (row.world_event_id)   eventCounts.set(row.world_event_id, (eventCounts.get(row.world_event_id) || 0) + 1)
    if (row.chapter_id)       chapterCounts.set(row.chapter_id, (chapterCounts.get(row.chapter_id) || 0) + 1)
    for (const t of (row.tags || [])) tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableChapters = (chaptersRes.data || []).filter((c: any) => chapterCounts.has(c.id)).map((c: any) => ({ ...c, count: chapterCounts.get(c.id) || 0 }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableEvents = (eventsRes.data || []).filter((e: any) => eventCounts.has(e.id)).map((e: any) => ({ ...e, count: eventCounts.get(e.id) || 0 }))

  const availableCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }))

  const availableYears = [...yearCounts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([value, count]) => ({ value, count }))

  const availableLanguages = [...langCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }))

  const availableTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([value, count]) => ({ value, count }))

  return NextResponse.json({
    stories: storiesRes.data || [],
    total: allRows.length,
    filters: {
      chapters: availableChapters,
      countries: availableCountries,
      years: availableYears,
      events: availableEvents,
      languages: availableLanguages,
      tags: availableTags,
    },
  })
}
