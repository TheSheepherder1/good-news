import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CHAPTERS = ['Kindness', 'Courage', 'Community', 'Sacrifice', 'Love', 'Resilience', 'Innovation', 'Environment', 'Joy']

export async function POST(req: NextRequest) {
  const { opening, body, impact } = await req.json()

  const storyText = [
    opening ? `Opening: ${opening}` : '',
    body ? `Body: ${body}` : '',
    impact ? `Impact: ${impact}` : '',
  ].filter(Boolean).join('\n\n')

  if (!storyText.trim()) {
    return NextResponse.json({ error: 'No story text provided' }, { status: 400 })
  }

  try {
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
  "reason": "2-3 friendly, specific sentences. If passed: affirm what makes it archive-worthy. If failed: tell the writer exactly what to improve — be encouraging, not harsh.",
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
    const result = JSON.parse(raw)

    return NextResponse.json({
      passed: Boolean(result.passed),
      score: Number(result.score),
      reason: String(result.reason),
      chapter: CHAPTERS.includes(result.chapter) ? result.chapter : null,
      language: String(result.language || 'en'),
    })
  } catch (err) {
    console.error('Archive AI check error:', err)
    return NextResponse.json({ error: 'AI check failed' }, { status: 500 })
  }
}
