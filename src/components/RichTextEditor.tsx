'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'

type Mode = 'html' | 'markdown'

type Props = {
  value: string
  onChange: (value: string) => void
  mode: Mode
  maxLength: number
  minHeightClass?: string
}

const FONT_SIZES = [
  { label: 'Small', value: '14px' },
  { label: 'Normal', value: '16px' },
  { label: 'Large', value: '20px' },
  { label: 'Heading', value: '28px' },
]

function serializeInline(nodes: JSONContent[]): string {
  return nodes.map((n) => {
    let text = n.text || ''
    const marks = (n.marks || []).map((m) => m.type)
    if (marks.includes('bold')) text = `**${text}**`
    if (marks.includes('italic')) text = `*${text}*`
    if (marks.includes('underline')) text = `__${text}__`
    return text
  }).join('')
}

function serializeMarkdown(json: JSONContent): string {
  const lines: string[] = []
  for (const node of json.content || []) {
    if (node.type === 'paragraph') {
      lines.push(serializeInline(node.content || []))
    } else if (node.type === 'bulletList') {
      for (const item of node.content || []) {
        for (const para of item.content || []) {
          lines.push(`- ${serializeInline(para.content || [])}`)
        }
      }
    }
  }
  return lines.join('\n')
}

function ToolbarButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ value, onChange, mode, maxLength, minHeightClass = 'min-h-[100px]' }: Props) {
  const [charCount, setCharCount] = useState(0)
  const [, setTick] = useState(0)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        orderedList: false,
        underline: false,
        link: false,
      }),
      Underline,
      TextStyle,
      FontSize,
    ],
    editorProps: {
      attributes: {
        class: `border border-gray-200 border-t-0 rounded-b-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_p]:my-1 ${minHeightClass}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(mode === 'html' ? editor.getHTML() : serializeMarkdown(editor.getJSON()))
      setCharCount(editor.getText().length)
    },
    onTransaction: () => setTick((n) => n + 1),
    content: '',
  })

  useEffect(() => {
    if (!editor) return
    if (value === '' && !editor.isEmpty) {
      editor.commands.clearContent()
      setCharCount(0)
    }
  }, [value, editor])

  const currentFontSize = editor?.getAttributes('textStyle').fontSize || '16px'

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 border border-gray-200 rounded-t-lg bg-gray-50 px-2 py-1 flex-wrap">
        <ToolbarButton active={!!editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} label="Bold">
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton active={!!editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} label="Italic">
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton active={!!editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()} label="Underline">
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton active={!!editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} label="Bullet list">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008zM6 6.75h12M6 12h12m-12 5.25h12" />
          </svg>
        </ToolbarButton>
        {mode === 'html' && (
          <select
            value={currentFontSize}
            onChange={(e) => {
              const size = e.target.value
              if (size === '16px') editor?.chain().focus().unsetFontSize().run()
              else editor?.chain().focus().setFontSize(size).run()
            }}
            className="ml-1 text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            {FONT_SIZES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        )}
      </div>
      <EditorContent editor={editor} />
      <div className={`text-xs text-right mt-1 ${charCount > maxLength ? 'text-red-500' : 'text-gray-400'}`}>
        {charCount}/{maxLength}
      </div>
    </div>
  )
}
