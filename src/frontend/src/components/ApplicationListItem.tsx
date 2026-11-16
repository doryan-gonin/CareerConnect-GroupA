import ApplicationStatusBadge from "./ApplicationStatusBadge";
import type { ApplicationDetail } from "../api/types";
import { Button } from "./ui/button";

type Props = {
  application: ApplicationDetail;
  isWorking: boolean;
  onWithdraw: (application: ApplicationDetail) => void;
};

export default function ApplicationListItem({ application, isWorking, onWithdraw }: Props) {
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{application.job_title}</span>
          <ApplicationStatusBadge status={application.status} />
        </div>
        <span className="text-xs text-muted-foreground">
          {application.company_name} · {application.location}
        </span>
        <span className="text-xs text-muted-foreground">
          Applied on {new Date(application.applied_at).toLocaleDateString()}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onWithdraw(application)}
        disabled={isWorking}
        className="self-start text-xs text-destructive sm:self-center"
      >
        Withdraw
      </Button>
    </li>
  );
}
