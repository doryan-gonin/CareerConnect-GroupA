import ApplicationStatusBadge from "./ApplicationStatusBadge";
import SavedJobButton from "./SavedJobButton";
import type { ApplicationStatus, Job } from "../api/types";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "cn";

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
    <Card
      onClick={() => onSelect(job)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(job);
        }
      }}
      className={cn(
        "group block w-full cursor-pointer text-left transition hover:border-primary/50 hover:shadow-xs",
        isSelected && "border-primary bg-primary/5",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="group-hover:text-primary group-hover:underline">
          {job.title}
        </CardTitle>
        {!isRecruiter && (
          <SavedJobButton
            isSaved={isSaved}
            isPending={isPending}
            onToggle={() => onToggleSaved(job.id)}
          />
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{job.company_name}</p>
        <p className="text-sm text-muted-foreground">{job.job_schedule}</p>
        <p className="text-sm text-muted-foreground">{job.location}</p>
        {job.ai_suggested && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="secondary">✨ AI suggested</Badge>
            {job.suggestion_justification && <span>— {job.suggestion_justification}</span>}
          </div>
        )}
        {applicationStatus && (
          <div className="mt-2">
            <ApplicationStatusBadge status={applicationStatus} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
