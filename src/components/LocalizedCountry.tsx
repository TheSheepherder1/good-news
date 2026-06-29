'use client'

import { useEffect, useState } from 'react'
import { getCountryName } from '@/lib/countries'

export default function LocalizedCountry({ code }: { code: string }) {
  const [name, setName] = useState(() => getCountryName(code, 'en'))
  useEffect(() => {
    const lang = localStorage.getItem('tgif_lang') || 'en'
    setName(getCountryName(code, lang))
  }, [code])
  return <>{name}</>
}
