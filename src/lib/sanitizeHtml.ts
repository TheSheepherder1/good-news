import sanitizeHtml from 'sanitize-html'

const ALLOWED_FONT_SIZE = /^(?:14|16|20|28)px$/

// Allows the limited set of formatting produced by RichTextEditor in 'html'
// mode: bold/italic/underline, paragraphs, bullet lists, and font-size spans.
export function sanitizeStoryHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'li', 'span'],
    allowedAttributes: {
      span: ['style'],
    },
    allowedStyles: {
      span: {
        'font-size': [ALLOWED_FONT_SIZE],
      },
    },
  })
}
