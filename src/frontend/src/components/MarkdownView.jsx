// Safe, zero-dependency Markdown renderer for job descriptions and applicant text.
// Parses headers, lists, bold, italics, inline code, and safe links without dangerouslySetInnerHTML.

function parseInline(text) {
  if (!text) return null

  // Matches: `code`, **bold**, *italic*, [label](url)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (!part) return null

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-purple-700"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-gray-900">
          {parseInline(part.slice(2, -2))}
        </strong>
      )
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-gray-800">
          {parseInline(part.slice(1, -1))}
        </em>
      )
    }

    // Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const [, label, url] = linkMatch
      // Prevent javascript: and other dangerous protocols
      const isSafe = /^(https?:\/\/|mailto:|\/)/i.test(url)
      if (isSafe) {
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-purple-600 underline hover:text-purple-800"
          >
            {label}
          </a>
        )
      }
      return label
    }

    return part
  })
}

export default function MarkdownView({ content, className = '' }) {
  if (!content) return null

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')

  const elements = []
  let currentList = null // { type: 'ul' | 'ol', items: [] }

  function flushList() {
    if (!currentList) return
    const ListTag = currentList.type
    elements.push(
      <ListTag
        key={`list-${elements.length}`}
        className={
          currentList.type === 'ul'
            ? 'list-disc pl-5 my-2 space-y-1'
            : 'list-decimal pl-5 my-2 space-y-1'
        }
      >
        {currentList.items.map((item, idx) => (
          <li key={idx} className="text-gray-700">
            {parseInline(item)}
          </li>
        ))}
      </ListTag>
    )
    currentList = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Blank line indicates paragraph separation
    if (!trimmed) {
      flushList()
      continue
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h4
          key={`h4-${elements.length}`}
          className="mt-3 mb-1 text-sm font-semibold text-gray-900"
        >
          {parseInline(trimmed.slice(4))}
        </h4>
      )
      continue
    }
    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className="mt-4 mb-1.5 text-base font-semibold text-gray-900"
        >
          {parseInline(trimmed.slice(3))}
        </h3>
      )
      continue
    }
    if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h2
          key={`h2-${elements.length}`}
          className="mt-5 mb-2 text-lg font-bold text-gray-900"
        >
          {parseInline(trimmed.slice(2))}
        </h2>
      )
      continue
    }

    // Bullet list item: - or *
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/)
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList()
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(ulMatch[1])
      continue
    }

    // Numbered list item: 1. or 2.
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList()
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(olMatch[1])
      continue
    }

    // Blockquote: > text
    if (trimmed.startsWith('> ')) {
      flushList()
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className="border-l-3 border-purple-300 pl-3 italic text-gray-600 my-2"
        >
          {parseInline(trimmed.slice(2))}
        </blockquote>
      )
      continue
    }

    // Regular paragraph line
    flushList()
    elements.push(
      <p key={`p-${elements.length}`} className="my-1.5 text-gray-700 leading-relaxed">
        {parseInline(line)}
      </p>
    )
  }

  flushList()

  return <div className={`text-sm leading-relaxed ${className}`}>{elements}</div>
}

