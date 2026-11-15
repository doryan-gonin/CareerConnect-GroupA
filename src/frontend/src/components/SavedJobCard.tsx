import SavedJobButton from "./SavedJobButton";
import type { SavedJob } from "../api/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { cn } from "cn";

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
    <Card className={cn(inactive && "border-destructive/40")}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base leading-snug font-medium">{job.title}</h2>
          <p className="text-sm text-muted-foreground">{job.company_name}</p>
        </div>
        <SavedJobButton isSaved isPending={isPending} onToggle={() => onRemove(jobId)} />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{job.location}</p>
        {inactive ? (
          <Alert className="mt-3">
            <AlertDescription className="text-xs font-medium">
              This posting is no longer available.
            </AlertDescription>
          </Alert>
        ) : (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => onView(jobId)}
            className="mt-3 h-auto p-0"
          >
            View posting
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
