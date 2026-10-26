import { useState } from 'react'
import JobSearchPageNavbar from './JobSearchPageNavbar'

function JobSearchPage() {
    const [jobs, setJobs] = useState([])
    const [selectedJob, setSelectedJob] = useState(null)

    return (
        <div>
            <JobSearchPageNavbar onJobsLoaded={setJobs}/>
            <div className='ml-115'>
                {jobs.map((job) => (
                    <button
                        key={job.id}
                        type="button"
                        onClick={() => setSelectedJob(job)}
                        className="group block w-100 rounded-xl border border-gray-200 bg-white p-4 text-left"
                    >
                        <h2 className='group-hover:text-purple-600 group-hover:underline font-semibold'>{job.title}</h2>
                        <p>{job.company_name}</p>
                        <p>{job.job_schedule}</p>
                        <p>{job.location}</p>


                    </button>
                ))}
            </div>
            <div>
                {selectedJob && (
                    <div className="group block w-100 rounded-xl border border-gray-200 bg-white p-4 text-left">
                        <h2>{selectedJob.title}</h2>
                        <p>{selectedJob.company_name}</p>
                        <p>{selectedJob.description}</p>
                    </div>
                )}
            </div>
        </div>
    )
}


export default JobSearchPage

