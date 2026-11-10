import { useRef, useState } from 'react'
import MarkdownView from './MarkdownView'

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Describe the role, responsibilities, and requirements...',
  rows = 7,
  required = false,
}) {
  const [activeTab, setActiveTab] = useState('write') // 'write' | 'preview'
  const textareaRef = useRef(null)

  function insertFormatting(prefix, suffix = '', defaultText = 'text') {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = value || ''
    const selected = text.substring(start, end)
    const insertion = selected ? `${prefix}${selected}${suffix}` : `${prefix}${defaultText}${suffix}`

    const updated = text.substring(0, start) + insertion + text.substring(end)
    onChange(updated)

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus()
      const cursorPos = start + prefix.length + (selected ? selected.length : defaultText.length)
      textarea.setSelectionRange(cursorPos, cursorPos)
    }, 0)
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
      {/* Tab bar & Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 gap-2">
        {/* Write vs Preview Tabs */}
        <div className="flex items-center gap-1 rounded-md bg-gray-200/70 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`rounded px-3 py-1 text-xs font-medium transition ${
              activeTab === 'write'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`rounded px-3 py-1 text-xs font-medium transition ${
              activeTab === 'preview'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Formatting Toolbar (shown on Write tab) */}
        {activeTab === 'write' && (
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**', 'bold')}
              title="Bold"
              className="rounded px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*', 'italic')}
              title="Italic"
              className="rounded px-2 py-1 text-xs italic font-serif text-gray-700 hover:bg-gray-200 transition"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('### ', '', 'Heading')}
              title="Heading"
              className="rounded px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition"
            >
              H3
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => insertFormatting('- ', '', 'List item')}
              title="Bullet List"
              className="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 transition"
            >
              • List
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('1. ', '', 'Numbered item')}
              title="Numbered List"
              className="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 transition"
            >
              1. List
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('> ', '', 'Quote')}
              title="Quote"
              className="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 transition"
            >
              &ldquo;&rdquo;
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('`', '`', 'code')}
              title="Inline Code"
              className="rounded px-2 py-1 font-mono text-xs text-gray-700 hover:bg-gray-200 transition"
            >
              &lt;/&gt;
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('[', '](https://example.com)', 'link text')}
              title="Insert Link"
              className="rounded px-2 py-1 text-xs text-purple-700 hover:bg-purple-50 transition"
            >
              Link
            </button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      {activeTab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          required={required}
          className="w-full border-0 p-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 font-sans leading-relaxed focus:ring-0"
        />
      ) : (
        <div className="min-h-[160px] p-4 bg-white overflow-y-auto">
          {value ? (
            <MarkdownView content={value} />
          ) : (
            <p className="text-xs italic text-gray-400">
              Nothing to preview yet. Switch back to Write to compose your description in Markdown.
            </p>
          )}
        </div>
      )}

      {/* Footer hint */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-3 py-1.5 text-[11px] text-gray-400 flex items-center justify-between">
        <span>Markdown supported: headers (#), bold (**text**), lists (- or 1.), and links</span>
        <span>{value?.length || 0} characters</span>
      </div>
    </div>
  )
}

