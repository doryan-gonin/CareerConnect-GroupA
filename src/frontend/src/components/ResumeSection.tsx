import { useState, useEffect, useRef, useCallback } from "react";
import {
  getResumes,
  uploadResume,
  setDefaultResume,
  downloadResume,
  deleteResume,
} from "../api/profiles";
import type { Resume } from "../api/types";
import type { ChangeEvent, FormEvent } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_RESUMES = 5;

function ResumeSection({ token }: { token: string }) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [makeDefault, setMakeDefault] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resumeToDelete, setResumeToDelete] = useState<{ id: number; fileName: string } | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshResumes = useCallback(async () => {
    try {
      const data = await getResumes(token);
      setResumes(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const data = await getResumes(token);
        if (isMounted) {
          setResumes(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (token) {
      initialLoad();
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      !file.name.toLowerCase().endsWith(".pdf") ||
      (file.type && file.type !== "application/pdf")
    ) {
      setError("Only PDF files are allowed.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Resume must be under 5 megabytes.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile) return;

    if (resumes.length >= MAX_RESUMES) {
      setError("User already has 5 (or more) resumes.");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess("");

    try {
      await uploadResume(token, selectedFile, makeDefault);
      setSuccess(`"${selectedFile.name}" uploaded successfully.`);
      setSelectedFile(null);
      setMakeDefault(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refreshResumes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSetDefault(resumeId: number) {
    setActionId(resumeId);
    setError("");
    setSuccess("");

    try {
      await setDefaultResume(token, resumeId);
      setSuccess("Default resume updated.");
      await refreshResumes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionId(null);
    }
  }

  async function handleDownload(resumeId: number, fileName: string) {
    setActionId(resumeId);
    setError("");

    try {
      await downloadResume(token, resumeId, fileName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionId(null);
    }
  }

  async function confirmDelete() {
    if (!resumeToDelete) return;
    const { id: resumeId, fileName } = resumeToDelete;
    setResumeToDelete(null);
    setActionId(resumeId);
    setError("");
    setSuccess("");

    try {
      await deleteResume(token, resumeId);
      setSuccess(`"${fileName}" deleted.`);
      await refreshResumes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>Resumes</CardTitle>
        <span className="text-xs font-medium text-muted-foreground">
          {resumes.length} / {MAX_RESUMES} uploaded
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Form */}
        {resumes.length < MAX_RESUMES ? (
          <form onSubmit={handleUpload} className="rounded-lg border border-dashed bg-muted/40 p-4">
            <label className="block text-sm font-medium">
              Upload a resume (PDF, up to 5MB)
              <Input
                type="file"
                ref={fileInputRef}
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                className="mt-2"
              />
            </label>

            {selectedFile && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={makeDefault}
                    onCheckedChange={(checked) => setMakeDefault(checked === true)}
                    disabled={isUploading}
                  />
                  Set as default resume
                </label>

                <Button type="submit" disabled={isUploading}>
                  {isUploading ? "Uploading…" : "Upload resume"}
                </Button>
              </div>
            )}
          </form>
        ) : (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            You have reached the maximum limit of 5 resumes. Delete an existing resume to upload a
            new one.
          </p>
        )}

        {/* Resume List */}
        <div>
          <h3 className="mb-2 text-sm font-medium">Your Uploaded Resumes</h3>
          {isLoading ? (
            <div className="flex flex-col gap-3 py-6">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : resumes.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>No resumes uploaded yet.</EmptyTitle>
                <EmptyDescription>Upload a PDF resume to use it when applying.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col divide-y">
              {resumes.map((resume) => {
                const isWorking = actionId === resume.id;
                return (
                  <li
                    key={resume.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{resume.file_name}</span>
                        {resume.is_default && <Badge variant="secondary">Default</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Uploaded on {new Date(resume.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {!resume.is_default && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => handleSetDefault(resume.id)}
                          disabled={isWorking}
                        >
                          Set default
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => handleDownload(resume.id, resume.file_name)}
                        disabled={isWorking}
                      >
                        Download
                      </Button>

                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-destructive"
                        onClick={() =>
                          setResumeToDelete({ id: resume.id, fileName: resume.file_name })
                        }
                        disabled={isWorking}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
      <AlertDialog
        open={Boolean(resumeToDelete)}
        onOpenChange={(open) => !open && setResumeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{resumeToDelete?.fileName}”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default ResumeSection;
