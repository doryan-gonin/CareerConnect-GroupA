import ApplicationStatusBadge from "./ApplicationStatusBadge";
import SavedJobButton from "./SavedJobButton";
import type { ApplicationStatus, Job } from "../api/types";

type Props = {
  job: Job;
  isSelected: boolean;
  isRecruiter: boolean;
  isSaved: boolean;
  isPending: boolean;
  applicationStatus?: ApplicationStatus;
  onSelect: (job: Job) => void;
  onToggleSaved: (jobId: number) => void;
};

export default function JobListCard({
  job,
  isSelected,
  isRecruiter,
  isSaved,
  isPending,
  applicationStatus,
  onSelect,
  onToggleSaved,
}: Props) {
  return (
    <div
      onClick={() => onSelect(job)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(job);
      }}
      className={`group block w-100 rounded-xl border p-4 text-left transition hover:border-purple-300 hover:shadow-xs ${
        isSelected ? "border-purple-500 bg-purple-50/30" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="group-hover:text-purple-600 group-hover:underline font-semibold">
          {job.title}
        </h2>
        {!isRecruiter && (
          <SavedJobButton
            isSaved={isSaved}
            isPending={isPending}
            onToggle={() => onToggleSaved(job.id)}
          />
        )}
      </div>
      <p>{job.company_name}</p>
      <p>{job.job_schedule}</p>
      <p>{job.location}</p>
      {job.ai_suggested && (
        <div className="mt-2 rounded-md bg-purple-50 px-2.5 py-2 text-xs text-purple-800">
          <span className="font-semibold">✨ AI suggested</span>
          {job.suggestion_justification && (
            <span className="ml-1">— {job.suggestion_justification}</span>
          )}
        </div>
      )}
      {applicationStatus && (
        <div className="mt-2">
          <ApplicationStatusBadge status={applicationStatus} />
        </div>
      )}
    </div>
  );
}
