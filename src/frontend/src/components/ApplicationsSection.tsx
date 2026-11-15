import { useCallback, useState } from "react";
import { getMyApplications, withdrawApplication } from "../api/applications";
import { useAsyncResource } from "../hooks/useAsyncResource";
import ApplicationListItem from "./ApplicationListItem";
import type { ApplicationDetail, ApplicationStatus } from "../api/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { Skeleton } from "./ui/skeleton";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Applied",
  "Under Review",
  "Interview",
  "Offered",
  "Rejected",
];

function ApplicationsSection({ token }: { token: string }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadApplications = useCallback(
    (signal: AbortSignal) => getMyApplications(token, statusFilter || undefined, signal),
    [statusFilter, token],
  );
  const {
    data: loadedApplications,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncResource<ApplicationDetail[]>(loadApplications, [loadApplications], Boolean(token));
  const applications = loadedApplications ?? [];

  async function handleWithdraw(applicationId: number, jobTitle: string) {
    if (!window.confirm(`Withdraw your application for "${jobTitle}"?`)) return;
    setActionId(applicationId);
    setError("");
    setSuccess("");

    try {
      await withdrawApplication(token, applicationId);
      setSuccess(`Application for "${jobTitle}" withdrawn.`);
      reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b">
        <h2 className="font-heading text-base leading-snug font-medium">My Applications</h2>
        <select
          aria-label="Filter applications by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-8 w-44 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {(loadError || error) && (
          <Alert variant="destructive">
            <AlertDescription>{error || loadError?.message}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3 py-2" aria-label="Loading applications">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : applications.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>
                {statusFilter
                  ? `No applications with status "${statusFilter}".`
                  : "No applications submitted yet."}
              </EmptyTitle>
              <EmptyDescription>
                {statusFilter
                  ? "Try another status filter to see more applications."
                  : "Applications you submit will appear here."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y rounded-lg border">
            {applications.map((application) => (
              <ApplicationListItem
                key={application.id}
                application={application}
                isWorking={actionId === application.id}
                onWithdraw={(item) => void handleWithdraw(item.id, item.job_title)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default ApplicationsSection;
