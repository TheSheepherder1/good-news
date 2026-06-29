'use client'

import { useEffect, useState } from 'react'
import { ARCHIVE_PAGE_EN, ARCHIVE_SUBMIT_EN, type ArchivePageStrings, type ArchiveSubmitStrings } from '@/lib/archiveStrings'

const pageCache: Record<string, ArchivePageStrings> = { en: ARCHIVE_PAGE_EN }
const submitCache: Record<string, ArchiveSubmitStrings> = { en: ARCHIVE_SUBMIT_EN }

async function batchTranslate<T extends Record<string, string>>(source: T, lang: string): Promise<T> {
  const keys = Object.keys(source) as (keyof T)[]
  const values = keys.map((k) => source[k] as string)
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts: values, target: lang }),
  })
  const data: { translations?: string[] } = await res.json()
  const translated = data.translations || values
  const result = {} as T
  keys.forEach((key, i) => { result[key] = (translated[i] || source[key]) as T[typeof key] })
  return result
}

export function useArchivePageStrings(lang: string) {
  const [strings, setStrings] = useState<ArchivePageStrings>(pageCache[lang] || ARCHIVE_PAGE_EN)

  useEffect(() => {
    if (pageCache[lang]) { setStrings(pageCache[lang]); return }
    let cancelled = false
    batchTranslate(ARCHIVE_PAGE_EN, lang)
      .then((result) => {
        if (cancelled) return
        pageCache[lang] = result
        setStrings(result)
      })
      .catch(() => { if (!cancelled) setStrings(ARCHIVE_PAGE_EN) })
    return () => { cancelled = true }
  }, [lang])

  return strings
}

export function useArchiveSubmitStrings(lang: string) {
  const [strings, setStrings] = useState<ArchiveSubmitStrings>(submitCache[lang] || ARCHIVE_SUBMIT_EN)

  useEffect(() => {
    if (submitCache[lang]) { setStrings(submitCache[lang]); return }
    let cancelled = false
    batchTranslate(ARCHIVE_SUBMIT_EN, lang)
      .then((result) => {
        if (cancelled) return
        submitCache[lang] = result
        setStrings(result)
      })
      .catch(() => { if (!cancelled) setStrings(ARCHIVE_SUBMIT_EN) })
    return () => { cancelled = true }
  }, [lang])

  return strings
}
