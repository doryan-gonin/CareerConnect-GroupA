import { useState } from 'react'
import ApplicationsSection from './ApplicationsSection'
import ProfileSection from './ProfileSection'
import ResumeSection from './ResumeSection'
import SavedJobsSection from './SavedJobsSection'

const TABS = [
  { id: 'applications', label: 'My Applications' },
  { id: 'saved', label: 'Saved Jobs' },
]

// Authenticated dashboard screen for managing profile, documents, applications, and saved jobs
function LoggedInScreen({ token, onViewAnalytics, onViewJob, onBrowseJobs }) {
  const [activeTab, setActiveTab] = useState('applications')

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Manage your personal profile, uploaded resumes, and job applications.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAnalytics}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
        >
          View analytics
        </button>
      </div>

      {/* Grid for Profile & Resumes */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <ProfileSection token={token} />
        <ResumeSection token={token} />
      </div>

      <div className="flex flex-col gap-3">
        <div role="tablist" aria-label="Dashboard sections" className="flex gap-1 border-b border-gray-200">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'applications' ? (
          <ApplicationsSection token={token} />
        ) : (
          <div role="tabpanel" className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="border-b border-gray-100 pb-3 text-lg font-medium text-gray-900">Saved Jobs</h2>
            <SavedJobsSection token={token} onViewJob={onViewJob} onBrowseJobs={onBrowseJobs} />
          </div>
        )}
      </div>
    </div>
  )
}

export default LoggedInScreen
