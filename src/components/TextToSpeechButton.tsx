'use client'

import { useState, useEffect } from 'react'

const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  de: 'de-DE',
  nl: 'nl-NL',
  es: 'es-ES',
  fr: 'fr-FR',
  pl: 'pl-PL',
  pt: 'pt-PT',
  ja: 'ja-JP',
  sr: 'sr-RS',
}

type Props = {
  title: string
  summary: string
  lang: string
}

export default function TextToSpeechButton({ title, summary, lang }: Props) {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('speechSynthesis' in window)
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  // Cancel and reset if the story changes while speaking
  useEffect(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [title])

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const text = summary ? `${title}. ${summary}` : title
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = LANG_MAP[lang] ?? 'en-US'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  if (!supported) return null

  return (
    <button
      onClick={handleClick}
      aria-label={speaking ? 'Stop reading' : 'Read aloud'}
      className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors flex-shrink-0 ${
        speaking
          ? 'text-emerald-600 bg-emerald-50'
          : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
      }`}
    >
      {speaking ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      )}
    </button>
  )
}
