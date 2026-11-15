import ApplicationStatusBadge from "./ApplicationStatusBadge";
import type { ApplicationDetail } from "../api/types";

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
          <span className="font-medium text-gray-900 text-sm">{application.job_title}</span>
          <ApplicationStatusBadge status={application.status} />
        </div>
        <span className="text-xs text-gray-500">
          {application.company_name} · {application.location}
        </span>
        <span className="text-xs text-gray-400">
          Applied on {new Date(application.applied_at).toLocaleDateString()}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onWithdraw(application)}
        disabled={isWorking}
        className="self-start text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 sm:self-center"
      >
        Withdraw
      </button>
    </li>
  );
}
