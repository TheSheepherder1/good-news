import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const SITE_URL = 'https://www.thegoodifound.com'
const SITE_NAME = 'The Good I Found'
const KOFI_URL = 'https://ko-fi.com/thegoodifound'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const { data: stories } = await supabaseAdmin
    .from('stories')
    .select('title, summary, url, source, category, site_published_at, approved_at')
    .eq('status', 'published')
    .order('site_published_at', { ascending: false })
    .limit(50)

  const items = (stories || []).map((story) => {
    const pubDate = new Date(story.site_published_at ?? story.approved_at ?? Date.now()).toUTCString()
    const summary = story.summary ? escapeXml(story.summary) + '\n\n' : ''
    const description = `${summary}Enjoying ${SITE_NAME}? Support us at ${KOFI_URL}`

    return `
    <item>
      <title>${escapeXml(story.title)}</title>
      <link>${escapeXml(story.url)}</link>
      <guid isPermaLink="true">${escapeXml(story.url)}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      ${story.category ? `<category>${escapeXml(story.category)}</category>` : ''}
    </item>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>Your daily dose of good news — uplifting, heartwarming, and inspiring stories from around the world. No politics, no negativity, just the good stuff. Enjoying ${SITE_NAME}? Support us at ${KOFI_URL}</description>
    <language>en-us</language>
    <copyright>All stories © their respective publishers. Curated by ${SITE_NAME}.</copyright>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
