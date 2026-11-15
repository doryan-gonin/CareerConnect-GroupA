import type { ApplicationStatus } from "../api/types";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Applied: "bg-blue-100 text-blue-800",
  "Under Review": "bg-yellow-100 text-yellow-800",
  Interview: "bg-purple-100 text-purple-800",
  Offered: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus | string;
}

function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const styles = STATUS_STYLES[status as ApplicationStatus] || "bg-gray-100 text-gray-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}

export default ApplicationStatusBadge;
