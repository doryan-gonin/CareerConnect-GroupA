import { useEffect, useMemo } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Spinner } from "./ui/spinner";

type ResumeViewerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob?: Blob | null;
  applicantName?: string;
  resumeName?: string;
  isLoading?: boolean;
  error?: string;
};

export default function ResumeViewerModal({
  isOpen,
  onClose,
  pdfBlob,
  applicantName,
  resumeName,
  isLoading,
  error,
}: ResumeViewerModalProps) {
  const pdfUrl = useMemo(() => {
    if (!pdfBlob) return null;
    return URL.createObjectURL(pdfBlob);
  }, [pdfBlob]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleDownload() {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = resumeName
      ? resumeName.endsWith(".pdf")
        ? resumeName
        : `${resumeName}.pdf`
      : "resume.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleOpenInNewTab() {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank");
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="h-[88vh] w-full max-w-4xl overflow-hidden p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg" aria-hidden="true">
              📄
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold text-gray-900">
                {applicantName ? `Resume — ${applicantName}` : "Resume Viewer"}
              </DialogTitle>
              {resumeName && <p className="truncate text-xs text-gray-500">{resumeName}</p>}
              <DialogDescription className="sr-only">
                Preview and download the selected resume.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pdfUrl && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  title="Download PDF"
                >
                  Download
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  title="Open in new tab"
                >
                  New tab ↗
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="relative flex flex-1 items-center justify-center bg-gray-100 overflow-hidden">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-sm text-gray-600">
              <Spinner />
              <span>Loading resume…</span>
            </div>
          )}

          {error && !isLoading && (
            <Alert className="m-4 max-w-md" variant="destructive">
              <AlertDescription>
                <span className="font-semibold">Could not load resume</span>
                <br />
                {error}
              </AlertDescription>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </Alert>
          )}

          {!isLoading && !error && pdfUrl && (
            <iframe
              src={pdfUrl}
              title={`Resume of ${applicantName}`}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
