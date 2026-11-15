import { useCallback, useState, type ChangeEvent } from "react";
import { getMyApplications, withdrawApplication } from "../api/applications";
import { useAsyncResource } from "../hooks/useAsyncResource";
import ApplicationListItem from "./ApplicationListItem";
import type { ApplicationDetail, ApplicationStatus } from "../api/types";

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
    if (!window.confirm(`Withdraw your application for "${jobTitle}"?`)) {
      return;
    }

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
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <h2 className="text-lg font-medium text-gray-900">My Applications</h2>
        <select
          value={statusFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
      )}

      {(loadError || error) && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || loadError?.message}
        </p>
      )}

      {isLoading ? (
        <div className="py-6 text-center text-sm text-gray-500">Loading applications…</div>
      ) : applications.length === 0 ? (
        <div className="rounded-md bg-gray-50 py-6 text-center text-sm text-gray-500">
          {statusFilter
            ? `No applications with status "${statusFilter}".`
            : "No applications submitted yet."}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
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
    </div>
  );
}

export default ApplicationsSection;
