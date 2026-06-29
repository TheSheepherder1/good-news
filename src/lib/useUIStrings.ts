'use client'

import { useEffect, useState } from 'react'
import { UI_EN, type UIStrings } from '@/lib/uiStrings'

const cache: Record<string, UIStrings> = { en: UI_EN }

export function useUIStrings(lang: string): UIStrings {
  const [strings, setStrings] = useState<UIStrings>(cache[lang] || UI_EN)

  useEffect(() => {
    if (cache[lang]) { setStrings(cache[lang]); return }
    let cancelled = false
    const keys = Object.keys(UI_EN) as (keyof UIStrings)[]
    const values = keys.map((k) => UI_EN[k] as string)
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: values, target: lang }),
    })
      .then((res) => res.json())
      .then((data: { translations?: string[] }) => {
        if (cancelled) return
        const translated = data.translations || values
        const result = {} as UIStrings
        keys.forEach((key, i) => { result[key] = (translated[i] || UI_EN[key]) as string })
        cache[lang] = result
        setStrings(result)
      })
      .catch(() => { if (!cancelled) setStrings(UI_EN) })
    return () => { cancelled = true }
  }, [lang])

  return strings
}
