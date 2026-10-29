// Maps each backend ApplicationStatus value (src/backend/models.py) to a
// color so a status is recognizable at a glance in the applications list.
const STATUS_STYLES = {
  Applied: 'bg-blue-100 text-blue-800',
  'Under Review': 'bg-yellow-100 text-yellow-800',
  Interview: 'bg-purple-100 text-purple-800',
  Offered: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
}

function ApplicationStatusBadge({ status }) {
  const styles = STATUS_STYLES[status] || 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {status}
    </span>
  )
}

export default ApplicationStatusBadge
