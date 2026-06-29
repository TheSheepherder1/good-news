'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useArchivePageStrings } from '@/lib/useArchiveStrings'

export default function ArchiveStoryShareBtn() {
  const [lang, setLang] = useState('en')
  useEffect(() => {
    const stored = localStorage.getItem('tgif_lang')
    if (stored) setLang(stored)
  }, [])
  const s = useArchivePageStrings(lang)

  return (
    <Link
      href="/archive/submit"
      className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-1.5 rounded-full text-sm transition-colors"
    >
      {s.navShareStory}
    </Link>
  )
}
