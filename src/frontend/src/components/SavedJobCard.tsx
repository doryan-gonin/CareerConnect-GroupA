import SavedJobButton from "./SavedJobButton";
import type { SavedJob } from "../api/types";

type Props = {
  savedJob: SavedJob;
  isPending: boolean;
  onRemove: (jobId: number) => void;
  onView: (jobId: number) => void;
};

export default function SavedJobCard({ savedJob, isPending, onRemove, onView }: Props) {
  const { job_id: jobId, job } = savedJob;
  const inactive = !job.is_active;
  return (
    <article
      className={`rounded-xl border bg-white p-5 shadow-xs ${inactive ? "border-amber-200" : "border-gray-200"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">{job.title}</h2>
          <p className="text-sm text-gray-700">{job.company_name}</p>
        </div>
        <SavedJobButton isSaved isPending={isPending} onToggle={() => onRemove(jobId)} />
      </div>
      <p className="mt-2 text-sm text-gray-600">{job.location}</p>
      {inactive ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          This posting is no longer available.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => onView(jobId)}
          className="mt-4 text-sm font-medium text-purple-600 hover:underline"
        >
          View posting
        </button>
      )}
    </article>
  );
}
