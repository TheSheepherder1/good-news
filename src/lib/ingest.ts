import Parser from 'rss-parser'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from './supabase'
import { RSS_FEEDS, type Feed } from './feeds'

// ── Tuning knobs ──────────────────────────────────────────────
const ITEMS_PER_CURATED_FEED = 15   // curated good-news outlets
const ITEMS_PER_GENERAL_FEED = 8    // general / international feeds
const MIN_AI_SCORE = 6              // stories below this score are rejected
// ─────────────────────────────────────────────────────────────

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
})

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const STOP_WORDS = new Set([
  'a','an','the','in','on','at','to','for','of','and','or','but','is','are',
  'was','were','has','have','had','be','been','being','with','from','by',
  'about','as','into','through','after','before','that','this','it','its',
  'new','says','say','after','over','more','how','why','what','when','who',
])

function titleWords(title: string): Set<string> {
  return new Set(
    title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  )
}

function titleSimilarity(a: string, b: string): number {
  const setA = titleWords(a)
  const setB = titleWords(b)
  if (setA.size === 0 || setB.size === 0) return 0
  const overlap = [...setA].filter((w) => setB.has(w)).length
  return overlap / Math.min(setA.size, setB.size)
}

type RawStory = {
  title: string
  url: string
  summary: string
  source: string
  published_at: string | null
  image_url: string | null
  category: string
  curated: boolean
}

async function fetchFeed(feed: Feed): Promise<RawStory[]> {
  const limit = feed.curated ? ITEMS_PER_CURATED_FEED : ITEMS_PER_GENERAL_FEED
  try {
    const parsed = await parser.parseURL(feed.url)
    return (parsed.items || []).slice(0, limit).map((item) => ({
      title: item.title?.trim() || '',
      url: item.link || item.guid || '',
      summary: item.contentSnippet?.slice(0, 500) || item.summary?.slice(0, 500) || '',
      source: feed.name,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      image_url: item.enclosure?.url || null,
      category: feed.category,
      curated: feed.curated,
    })).filter((s) => s.title && s.url)
  } catch (err) {
    console.error(`Feed error [${feed.name}]:`, err)
    return []
  }
}

async function deduplicateStories(stories: RawStory[]): Promise<RawStory[]> {
  const SIMILARITY_THRESHOLD = 0.6

  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentRows } = await supabaseAdmin
    .from('stories')
    .select('title')
    .gte('fetched_at', cutoff)
  const recentTitles: string[] = (recentRows || []).map((r: { title: string }) => r.title)

  const notInDb = stories.filter(
    (s) => !recentTitles.some((t) => titleSimilarity(s.title, t) >= SIMILARITY_THRESHOLD)
  )

  const dedupedBatch: RawStory[] = []
  for (const story of notInDb) {
    const duplicate = dedupedBatch.find(
      (s) => titleSimilarity(s.title, story.title) >= SIMILARITY_THRESHOLD
    )
    if (!duplicate) {
      dedupedBatch.push(story)
    } else if (story.curated && !duplicate.curated) {
      dedupedBatch.splice(dedupedBatch.indexOf(duplicate), 1, story)
    }
  }

  return dedupedBatch
}

type AIResult = {
  approved: boolean
  score: number
  reason: string
}

async function classifyStories(stories: RawStory[]): Promise<(RawStory & AIResult)[]> {
  if (stories.length === 0) return []

  const prompt = stories
    .map(
      (s, i) =>
        `[${i}] SOURCE: ${s.source} (curated=${s.curated})\nTITLE: ${s.title}\nSUMMARY: ${s.summary}`
    )
    .join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: `You are a content filter for a positive-news website. For each story, decide:
- Is it genuinely uplifting, heartwarming, inspiring, or fascinating?
- Does it mention politicians, political parties, elections, legislation, or partisan issues? (instant reject)
- Is it clickbait, fear-based, or about tragedy, crime, or conflict? (reject)

Respond ONLY with a JSON array with one object per story (same index order):
[{"approved": true/false, "score": 1-10, "reason": "one line"}]

Score 8-10 = clearly positive and shareable. Score 1-4 = borderline or rejected.
Be strict about politics — even indirect political stories should be rejected.`,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return stories.map((s) => ({ ...s, approved: false, score: 0, reason: 'parse error' }))

  const results: AIResult[] = JSON.parse(jsonMatch[0])
  return stories.map((s, i) => ({ ...s, ...(results[i] || { approved: false, score: 0, reason: 'no result' }) }))
}

export async function runIngestion(): Promise<{ fetched: number; inserted: number; skipped: number }> {
  await supabaseAdmin.from('stories').delete().in('status', ['pending', 'approved', 'skipped'])

  const feedResults = await Promise.allSettled(RSS_FEEDS.map(fetchFeed))
  const allStories: RawStory[] = feedResults
    .filter((r): r is PromiseFulfilledResult<RawStory[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)

  if (allStories.length === 0) return { fetched: 0, inserted: 0, skipped: 0 }

  const urls = allStories.map((s) => s.url)
  const { data: existing } = await supabaseAdmin
    .from('stories')
    .select('url')
    .in('url', urls)
  const existingUrls = new Set((existing || []).map((r: { url: string }) => r.url))
  const urlDeduped = allStories.filter((s) => !existingUrls.has(s.url))

  if (urlDeduped.length === 0) return { fetched: allStories.length, inserted: 0, skipped: allStories.length }

  const newStories = await deduplicateStories(urlDeduped)

  if (newStories.length === 0) return { fetched: allStories.length, inserted: 0, skipped: allStories.length }

  const batchSize = 20
  const classified: (RawStory & AIResult)[] = []
  for (let i = 0; i < newStories.length; i += batchSize) {
    const batch = newStories.slice(i, i + batchSize)
    const results = await classifyStories(batch)
    classified.push(...results)
  }

  // Apply minimum score threshold — stories below MIN_AI_SCORE are rejected
  const rows = classified.map((s) => ({
    title: s.title,
    summary: s.summary || null,
    url: s.url,
    source: s.source,
    published_at: s.published_at,
    status: s.approved && s.score >= MIN_AI_SCORE ? 'pending' : 'rejected',
    ai_score: s.score,
    ai_reason: s.reason,
    image_url: s.image_url,
    category: s.category,
  }))

  const { error } = await supabaseAdmin.from('stories').insert(rows)
  if (error) throw error

  const inserted = rows.filter((r) => r.status === 'pending').length
  return { fetched: allStories.length, inserted, skipped: allStories.length - newStories.length }
}
