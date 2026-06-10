import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_FONT_SIZES = ['14px', '16px', '20px', '28px']

let hookAdded = false
if (!hookAdded) {
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName !== 'style') return
    const match = /^font-size:\s*(\d+px)$/.exec(data.attrValue.trim())
    if (node.nodeName === 'SPAN' && match && ALLOWED_FONT_SIZES.includes(match[1])) {
      data.attrValue = `font-size: ${match[1]}`
    } else {
      data.keepAttr = false
    }
  })
  hookAdded = true
}

// Allows the limited set of formatting produced by RichTextEditor in 'html'
// mode: bold/italic/underline, paragraphs, bullet lists, and font-size spans.
export function sanitizeStoryHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'li', 'span'],
    ALLOWED_ATTR: ['style'],
  })
}
