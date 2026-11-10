import { useEffect, useMemo } from 'react'

export default function ResumeViewerModal({
  isOpen,
  onClose,
  pdfBlob,
  applicantName,
  resumeName,
  isLoading,
  error,
}) {
  const pdfUrl = useMemo(() => {
    if (!pdfBlob) return null
    return URL.createObjectURL(pdfBlob)
  }, [pdfBlob])

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleDownload() {
    if (!pdfUrl) return
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = resumeName ? (resumeName.endsWith('.pdf') ? resumeName : `${resumeName}.pdf`) : 'resume.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  function handleOpenInNewTab() {
    if (!pdfUrl) return
    window.open(pdfUrl, '_blank')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex h-[88vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg" aria-hidden="true">📄</span>
            <div className="min-w-0">
              <h3 id="resume-viewer-title" className="truncate text-sm font-semibold text-gray-900">
                {applicantName ? `Resume — ${applicantName}` : 'Resume Viewer'}
              </h3>
              {resumeName && (
                <p className="truncate text-xs text-gray-500">{resumeName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pdfUrl && (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  title="Download PDF"
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  title="Open in new tab"
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  New tab ↗
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="relative flex flex-1 items-center justify-center bg-gray-100 overflow-hidden">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-sm text-gray-600">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-600 border-t-transparent" />
              <span>Loading resume…</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="m-4 max-w-md rounded-lg border border-red-200 bg-red-50 p-5 text-center">
              <p className="text-sm font-semibold text-red-800">Could not load resume</p>
              <p className="mt-1 text-xs text-red-600">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 rounded-md bg-white border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          )}

          {!isLoading && !error && pdfUrl && (
            <iframe
              src={pdfUrl}
              title={`Resume of ${applicantName}`}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  )
}
