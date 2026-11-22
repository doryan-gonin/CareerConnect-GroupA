// Bookmark icon toggle used to save / unsave a job posting
function BookmarkButton({ isSaved, onToggle, disabled = false, className = '' }) {
  const label = isSaved ? 'Remove from saved jobs' : 'Save job'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      disabled={disabled}
      aria-label={label}
      aria-pressed={isSaved}
      title={label}
      data-testid="bookmark-button"
      className={`rounded-md p-1.5 transition hover:bg-purple-50 disabled:cursor-wait disabled:opacity-50 ${
        isSaved ? 'text-purple-600' : 'text-gray-400 hover:text-purple-600'
      } ${className}`}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill={isSaved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  )
}

export default BookmarkButton
