import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CHAPTERS = ['Kindness', 'Courage', 'Community', 'Sacrifice', 'Love', 'Resilience', 'Innovation', 'Environment', 'Joy']

async function runAICheck(opening: string, body: string, impact: string) {
  const storyText = [
    opening ? `Opening: ${opening}` : '',
    body ? `Body: ${body}` : '',
    impact ? `Impact: ${impact}` : '',
  ].filter(Boolean).join('\n\n')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You are reviewing a submission to The Archive of Human Goodness — a permanent record of genuine human goodness from around the world.

STORY:
${storyText}

Evaluate this story and respond with ONLY valid JSON (no markdown, no explanation outside the JSON):
{
  "passed": boolean,
  "score": number (1-10),
  "reason": "2-3 friendly, specific sentences explaining the verdict",
  "chapter": "the single best-fit chapter from: ${CHAPTERS.join(', ')}",
  "language": "BCP 47 code, e.g. en, es, fr, de, zh, pt, ar, ja"
}

Passing criteria (ALL must be met):
- A genuine act of human goodness at the center — something a real person did
- Specific enough to be credible — real people, real situation, not vague inspiration
- An original personal account, witnessed event, or documented historical story — not a copy/paste of a news article
- No hate speech, political agenda, or negativity as the primary focus
- Something worth preserving permanently — would still matter to read in 50 years
- Not purely promotional for a person, brand, or organization`,
    }],
  })

  const raw = (response.content[0] as { text: string }).text.trim()
  return JSON.parse(raw)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      opening, body: storyBody, impact,
      image_1_url, image_1_caption, image_2_url, image_2_caption, image_3_url, image_3_caption,
      occurred_year, occurred_month,
      country, state_province, city,
      world_event_id,
      characters, // string[]
      organization,
      tags, // string[] max 3
      author_name, is_anonymous, relationship,
    } = body

    // Basic validation
    if (!opening?.trim() && !storyBody?.trim()) {
      return NextResponse.json({ error: 'Story opening or body is required' }, { status: 400 })
    }
    if (opening?.trim() && opening.trim().length < 200) {
      return NextResponse.json({ error: 'Opening must be at least 200 characters.' }, { status: 400 })
    }
    if (storyBody?.trim() && storyBody.trim().length < 500) {
      return NextResponse.json({ error: 'Story must be at least 500 characters.' }, { status: 400 })
    }
    if (impact?.trim() && impact.trim().length < 200) {
      return NextResponse.json({ error: 'Impact must be at least 200 characters if provided.' }, { status: 400 })
    }
    if (!occurred_year || !country?.trim()) {
      return NextResponse.json({ error: 'Year and country are required' }, { status: 400 })
    }
    if (!author_name?.trim()) {
      return NextResponse.json({ error: 'Author name is required' }, { status: 400 })
    }
    if (!relationship) {
      return NextResponse.json({ error: 'Relationship to story is required' }, { status: 400 })
    }

    // Normalize tags — max 3, strip empties
    const cleanTags = (tags || []).map((t: string) => t.trim()).filter(Boolean).slice(0, 3)

    // AI review
    let aiPassed = false
    let aiScore: number | null = null
    let aiReason: string | null = null
    let chapterId: string | null = null
    let detectedLanguage = 'en'
    let aiChapterName: string | null = null

    try {
      const aiResult = await runAICheck(opening || '', storyBody || '', impact || '')
      aiPassed = Boolean(aiResult.passed)
      aiScore = Number(aiResult.score)
      aiReason = String(aiResult.reason)
      detectedLanguage = String(aiResult.language || 'en')
      aiChapterName = CHAPTERS.includes(aiResult.chapter) ? aiResult.chapter : null

      // Look up chapter by name
      if (aiChapterName) {
        const { data: chapter } = await supabaseAdmin
          .from('archive_chapters')
          .select('id')
          .eq('name', aiChapterName)
          .eq('status', 'active')
          .single()
        if (chapter) chapterId = chapter.id
      }
    } catch (aiErr) {
      console.error('AI check failed on submit, routing to human review:', aiErr)
      aiPassed = false
    }

    const storyStatus = aiPassed ? 'live' : 'review'

    // Insert story
    const { data: story, error: storyError } = await supabaseAdmin
      .from('archive_stories')
      .insert({
        status: storyStatus,
        opening: opening?.trim() || null,
        body: storyBody?.trim() || null,
        impact: impact?.trim() || null,
        image_1_url: image_1_url || null,
        image_1_caption: image_1_caption?.trim() || null,
        image_2_url: image_2_url || null,
        image_2_caption: image_2_caption?.trim() || null,
        image_3_url: image_3_url || null,
        image_3_caption: image_3_caption?.trim() || null,
        occurred_year: Number(occurred_year),
        occurred_month: occurred_month ? Number(occurred_month) : null,
        country: country.trim(),
        state_province: state_province?.trim() || null,
        city: city?.trim() || null,
        chapter_id: chapterId,
        world_event_id: world_event_id || null,
        tags: cleanTags,
        organization: organization?.trim() || null,
        author_name: author_name.trim(),
        is_anonymous: Boolean(is_anonymous),
        relationship,
        original_language: detectedLanguage,
        ai_passed: aiPassed,
        ai_score: aiScore,
        ai_reason: aiReason,
        published_at: aiPassed ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (storyError) {
      console.error('Archive story insert error:', storyError)
      return NextResponse.json({ error: 'Failed to save story' }, { status: 500 })
    }

    // Insert characters
    const cleanChars = (characters || []).map((n: string) => n.trim()).filter(Boolean)
    if (cleanChars.length > 0) {
      await supabaseAdmin.from('archive_story_characters').insert(
        cleanChars.map((name: string, i: number) => ({ story_id: story.id, name, sort_order: i }))
      )
    }

    return NextResponse.json({
      ok: true,
      id: story.id,
      status: storyStatus,
      live: aiPassed,
      chapter: aiChapterName,
    })
  } catch (err) {
    console.error('Archive submit error:', err)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
