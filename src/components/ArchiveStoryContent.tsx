'use client'

import { useEffect, useState } from 'react'

type Props = {
  opening: string | null
  body: string | null
  impact: string | null
}

async function translateTexts(texts: string[], lang: string): Promise<string[]> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, target: lang }),
  })
  const data: { translations?: string[] } = await res.json()
  return data.translations || texts
}

export default function ArchiveStoryContent({ opening, body, impact }: Props) {
  const [lang, setLang] = useState('en')
  const [translated, setTranslated] = useState({ opening, body, impact })
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('tgif_lang') || 'en'
    setLang(stored)
  }, [])

  useEffect(() => {
    if (lang === 'en') {
      setTranslated({ opening, body, impact })
      return
    }
    let cancelled = false
    const texts = [opening || '', body || '', impact || '']
    setTranslating(true)
    translateTexts(texts, lang)
      .then(([o, b, i]) => {
        if (cancelled) return
        setTranslated({ opening: o || opening, body: b || body, impact: i || impact })
      })
      .catch(() => { if (!cancelled) setTranslated({ opening, body, impact }) })
      .finally(() => { if (!cancelled) setTranslating(false) })
    return () => { cancelled = true }
  }, [lang, opening, body, impact])

  return (
    <div className={translating ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
      {translated.opening && (
        <p className="text-gray-800 text-lg leading-relaxed mb-6 font-medium">{translated.opening}</p>
      )}
      {translated.body && (
        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">{translated.body}</div>
      )}
      {translated.impact && (
        <div className="border-l-4 border-emerald-300 pl-5 py-1 mb-6">
          <p className="text-gray-600 italic leading-relaxed">{translated.impact}</p>
        </div>
      )}
    </div>
  )
}
