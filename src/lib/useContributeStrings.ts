'use client'

import { useEffect, useState } from 'react'
import { type Language } from '@/lib/translations'
import { CONTRIBUTE_EN, CONTRIBUTE_OVERRIDES, type ContributeStrings } from '@/lib/contributeStrings'

const cache: Partial<Record<Language, ContributeStrings>> = { en: CONTRIBUTE_EN }

// Translates the static /contribute UI strings into the reader's chosen
// language via /api/translate (same free Google Translate endpoint used
// for story summaries), caching the result per language for the session.
export function useContributeStrings(lang: Language) {
  const [strings, setStrings] = useState<ContributeStrings>(cache[lang] || CONTRIBUTE_EN)
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    if (cache[lang]) {
      setStrings(cache[lang]!)
      return
    }

    let cancelled = false
    setTranslating(true)

    const keys = Object.keys(CONTRIBUTE_EN) as (keyof ContributeStrings)[]
    const values = keys.map((k) => CONTRIBUTE_EN[k])

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: values, target: lang }),
    })
      .then((res) => res.json())
      .then((data: { translations?: string[] }) => {
        if (cancelled) return
        const translated = data.translations || values
        const result = {} as ContributeStrings
        keys.forEach((key, i) => {
          result[key] = translated[i] || CONTRIBUTE_EN[key]
        })
        Object.assign(result, CONTRIBUTE_OVERRIDES[lang as Exclude<Language, 'en'>])
        cache[lang] = result
        setStrings(result)
      })
      .catch(() => {
        if (!cancelled) setStrings(CONTRIBUTE_EN)
      })
      .finally(() => {
        if (!cancelled) setTranslating(false)
      })

    return () => { cancelled = true }
  }, [lang])

  return { s: strings, translating }
}
