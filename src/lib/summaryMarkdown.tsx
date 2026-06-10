import React from 'react'

// Renders the extended markdown subset used for reader-submitted "Short
// Summary" text: **bold**, *italic*, __underline__, and `- ` bullet lines.
// Plain text with none of these markers renders as a single <p>, identical
// to the previous plain-text display.
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('__') && part.endsWith('__')) return <u key={i}>{part.slice(2, -2)}</u>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

export function renderSummaryMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 flex flex-col gap-1">
          {items.map((item, j) => <li key={j}>{parseInline(item)}</li>)}
        </ul>
      )
    } else if (line.trim() === '') {
      i++
    } else {
      blocks.push(<p key={key++}>{parseInline(line)}</p>)
      i++
    }
  }

  return blocks
}
