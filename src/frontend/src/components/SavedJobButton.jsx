function SavedJobButton({ isSaved, isPending = false, onToggle }) {
  return (
    <button
      type="button"
      aria-label={isSaved ? 'Remove saved job' : 'Save job'}
      aria-pressed={isSaved}
      disabled={isPending}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle()
      }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:cursor-wait disabled:opacity-60 ${
        isSaved
          ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
          : 'border-gray-200 bg-white text-gray-500 hover:border-purple-200 hover:text-purple-600'
      }`}
      title={isSaved ? 'Remove from saved jobs' : 'Save job'}
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill={isSaved ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
      </svg>
    </button>
  )
}

export default SavedJobButton
