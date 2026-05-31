import { NextRequest, NextResponse } from 'next/server'

async function translateOne(text: string, target: string): Promise<string> {
  if (!text.trim()) return text
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    })
    if (!res.ok) return text
    const data = await res.json()
    const translated = (data[0] as [string][]).map((s) => s[0]).join('')
    return translated || text
  } catch {
    return text
  }
}

export async function POST(req: NextRequest) {
  const { texts, target } = await req.json() as { texts: string[]; target: string }
  if (!texts?.length || !target || target === 'en') {
    return NextResponse.json({ translations: texts ?? [] })
  }
  const translations = await Promise.all(texts.map((t) => translateOne(t, target)))
  return NextResponse.json({ translations })
}
