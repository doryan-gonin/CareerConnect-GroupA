import { useCallback, useState } from "react";
import { getSavedJobs, unsaveJob } from "../api/jobs";
import { useAsyncResource } from "../hooks/useAsyncResource";
import Navbar from "./Navbar";
import SavedJobCard from "./SavedJobCard";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { Skeleton } from "./ui/skeleton";

type SavedJobsPageProps = {
  token: string;
  onLogout: () => void;
  isLoggingOut: boolean;
  onNavigateDashboard: () => void;
  onNavigateJobs: () => void;
  onViewJob: (id: number) => void;
};
function SavedJobsPage({
  token,
  onLogout,
  isLoggingOut,
  onNavigateDashboard,
  onNavigateJobs,
  onViewJob,
}: SavedJobsPageProps) {
  const [error, setError] = useState("");
  const [removingJobId, setRemovingJobId] = useState<number | null>(null);

  const loadSavedJobs = useCallback((signal: AbortSignal) => getSavedJobs(token, signal), [token]);
  const {
    data: loadedJobs,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncResource(loadSavedJobs, [loadSavedJobs], Boolean(token));
  const state = isLoading ? "loading" : loadError ? "error" : "ready";

  const savedJobs = loadedJobs ?? [];

  async function removeSavedJob(jobId: number) {
    setError("");
    setRemovingJobId(jobId);
    try {
      await unsaveJob(token, jobId);
      reload();
    } catch (removeError: unknown) {
      setError(removeError instanceof Error ? removeError.message : String(removeError));
    } finally {
      setRemovingJobId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        token={token}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
        onBrowseJobs={onNavigateJobs}
        onDashboard={onNavigateDashboard}
        isRecruiter={false}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Saved jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep track of roles you may want to apply to.
          </p>
        </div>

        {(error || loadError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error || loadError?.message}</AlertDescription>
          </Alert>
        )}
        {state === "loading" && (
          <div className="grid gap-4 sm:grid-cols-2" aria-label="Loading saved jobs">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}
        {state === "error" && !error && (
          <Alert variant="destructive">
            <AlertDescription>Saved jobs could not be loaded.</AlertDescription>
          </Alert>
        )}
        {state === "ready" && savedJobs.length === 0 && (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>You have no saved jobs yet.</EmptyTitle>
              <EmptyDescription>
                Use the bookmark on a job listing to save it here.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={onNavigateJobs}>
                Browse jobs
              </Button>
            </EmptyContent>
          </Empty>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {savedJobs.map((savedJob) => (
            <SavedJobCard
              key={savedJob.job_id}
              savedJob={savedJob}
              isPending={removingJobId === savedJob.job_id}
              onRemove={(jobId) => void removeSavedJob(jobId)}
              onView={onViewJob}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default SavedJobsPage;
