import { useState, useRef, useEffect } from 'react'
import { CANONICAL_LOCATIONS } from '../constants/jobs'

// Normalize strings by removing diacritics/accents and converting to lowercase
function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// Highlights matching substring within text
function renderHighlighted(text, query) {
  if (!query || !query.trim()) return text

  const normText = normalize(text)
  const normQuery = normalize(query)
  const index = normText.indexOf(normQuery)

  if (index === -1) return text

  const before = text.substring(0, index)
  const match = text.substring(index, index + normQuery.length)
  const after = text.substring(index + normQuery.length)

  return (
    <>
      {before}
      <strong className="font-semibold text-purple-700 underline decoration-purple-300 decoration-2">
        {match}
      </strong>
      {after}
    </>
  )
}

export default function LocationAutocomplete({
  id = 'location-autocomplete',
  name = 'location',
  value = '',
  onChange,
  onSelect,
  placeholder = 'e.g. Montreal, QC or Remote',
  required = false,
  compact = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const normalizedQuery = normalize(value || '')

  // Filter and sort suggestions
  let matches = []
  const isQueryEmpty = !normalizedQuery

  if (isQueryEmpty) {
    // Show top quick picks when empty
    matches = CANONICAL_LOCATIONS.slice(0, 5)
  } else {
    // Find matching locations (by name or alias)
    matches = CANONICAL_LOCATIONS.filter((loc) => {
      const normName = normalize(loc.name)
      if (normName.includes(normalizedQuery)) return true
      return loc.aliases.some((alias) => normalize(alias).includes(normalizedQuery))
    }).sort((a, b) => {
      // Prioritize startsWith over contains
      const aStarts = normalize(a.name).startsWith(normalizedQuery)
      const bStarts = normalize(b.name).startsWith(normalizedQuery)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.name.localeCompare(b.name)
    })
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  function handleSelect(locationName) {
    onChange(locationName)
    if (onSelect) {
      onSelect(locationName)
    }
    setIsOpen(false)
    setHighlightedIndex(-1)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  function handleKeyDown(event) {
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        setIsOpen(true)
        event.preventDefault()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % matches.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 + matches.length) % matches.length)
    } else if (event.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < matches.length) {
        event.preventDefault()
        handleSelect(matches[highlightedIndex].name)
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-suggestions`}
          className={`w-full rounded-md border border-gray-300 bg-white pr-8 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 ${
            compact ? 'px-3 py-1.5' : 'px-3 py-2'
          }`}
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            title="Clear location"
            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div
          id={`${id}-suggestions`}
          role="listbox"
          className="absolute left-0 top-full mt-1.5 w-full min-w-[260px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg z-30 animate-fade-in"
        >
          {isQueryEmpty && (
            <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
              Popular Locations
            </div>
          )}

          {matches.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-gray-500 text-center">
              No matching locations found. You can keep typing custom text.
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50">
              {matches.map((loc, idx) => {
                const isHighlighted = idx === highlightedIndex
                const matchedAlias = !normalize(loc.name).includes(normalizedQuery) && normalizedQuery
                  ? loc.aliases.find((a) => normalize(a).includes(normalizedQuery))
                  : null

                return (
                  <li
                    key={loc.name}
                    role="option"
                    aria-selected={isHighlighted}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(loc.name)}
                    className={`flex items-center justify-between cursor-pointer rounded-md px-3 py-2 text-xs transition ${
                      isHighlighted
                        ? 'bg-purple-50 text-purple-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-400">📍</span>
                      <span>{renderHighlighted(loc.name, value)}</span>
                    </span>

                    {matchedAlias && (
                      <span className="text-[10px] text-gray-400 italic">
                        matched &ldquo;{matchedAlias}&rdquo;
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {/* Quick Tip Footer */}
          <div className="border-t border-gray-100 mt-1 px-2.5 py-1 text-[10px] text-gray-400 flex items-center justify-between">
            <span>↑↓ to navigate · Enter to select</span>
            <span>Accents & aliases supported</span>
          </div>
        </div>
      )}
    </div>
  )
}
