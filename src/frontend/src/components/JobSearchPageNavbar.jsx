import  {useState} from 'react'

function JobSearchPageNavbar({ onLogout, isLoggingOut = false, userEmail = '', onJobsLoaded}) {
    const [keyword, setKeyWord] = useState('')
    const [jobs, setJobs] = useState('')
    const [error, setError] = useState('')
    const [isScheduleOpen, setIsScheduleOpen] = useState(false)
    const [isJobTypeOpen, setIsJobTypeOpen] = useState(false)
    const [isOrderOpen, setIsOrderOpen] = useState(false)
    const [category, setCategory] = useState('Category')
    const [jobSchedule, setJobSchedule] = useState('Schedule')
    const [jobType, setJobType] = useState('Job Type')
    const [orderDisplay, setOrderDisplay] = useState('Order')
    const [order, setOrder] = useState('')
    const [location, setLocation] = useState('')

    function handleReset() {
        setJobSchedule('Schedule')
        setJobType('Job Type')
        setOrder('')
        setOrderDisplay('Order')
        setJobs([])
    }

    async function handleSearch(event){
        event.preventDefault()
        try{
            let url = `/api/jobs?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`

            if (jobSchedule !== 'Schedule') {
                url += `&job_schedule=${encodeURIComponent(jobSchedule)}`
            }

            if (jobType !== 'Job Type') {
                url += `&job_type=${encodeURIComponent(jobType)}`
            }

            if (order !== '') {
                url += `&sort_order=${encodeURIComponent(order)}`
            }

            const response = await fetch(url)

            if(!response.ok){
                throw new Error('Jobs not loaded')
            }

            const data = await response.json()
            console.log(data)
            onJobsLoaded(data.jobs)
        } catch (error){
            console.error('Search failed:', error)
            setError(error.message)
        }
    }

    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
                {/* Brand */}
                <div className="flex items-center gap-2">
         <span className="text-xl font-bold text-gray-900">
           Career<span className="text-purple-600">Connect</span>
         </span>
                </div>
                {/* User & Logout */}
                <div className="flex items-center gap-4">
                    {userEmail && (
                        <span className="text-sm text-gray-600">{userEmail}</span>
                    )}
                    <form onSubmit={handleSearch}>
                        <button type="submit" hidden>Search</button>
                        <input
                            type="text"
                            placeholder="Describe the job you want"
                            value={keyword}
                            onChange={(event) => setKeyWord(event.target.value)}
                            className="rounded-full border border-gray-300 px-4 py-2 w-60 text-sm"
                        />

                        <input
                            type="text"
                            placeholder="City, province, or remote"
                            value={location}
                            onChange={(event) => setLocation(event.target.value)}
                            className="rounded-full border border-gray-300 px-4 py-2 w-60 text-sm"
                        />

                        <div className="relative inline block ml-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsJobTypeOpen(!isJobTypeOpen)
                                    setIsScheduleOpen(false)
                                    setIsOrderOpen(false)
                                }}
                                className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-purple-50"
                            >
                                {jobType} ▾
                            </button>

                            {isJobTypeOpen && (
                                <div className="absolute left-0 top-full mt-2 min-w-40 rounded-xl bg-white border border-gray-200">
                                    <button
                                        type="button"
                                        className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                        onClick={() => setJobType("Permanent")}
                                    >
                                        Permanent
                                    </button>
                                    <button
                                        type="button"
                                        className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                        onClick={() => setJobType("Temporary")}
                                    >
                                        Temporary
                                    </button>
                                    <button
                                        type="button"
                                        className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                        onClick={() => setJobType("Contract")}
                                    >
                                        Contract
                                    </button>
                                    <button
                                        type="button"
                                        className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                        onClick={() => setJobType("Internship")}
                                    >
                                        Internship
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="relative inline block ml-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsScheduleOpen(!isScheduleOpen)
                                    setIsJobTypeOpen(false)
                                    setIsOrderOpen(false)
                                }}
                                className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-purple-50"
                            >
                                {jobSchedule} ▾
                            </button>


                            {isScheduleOpen && (
                                <div className="absolute left-0 top-full mt-2 min-w-40 rounded-xl bg-white border border-gray-200">
                                    <button
                                        type="button"
                                        className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                        onClick={() => setJobSchedule("Full-time")}
                                    >
                                        Full-time
                                    </button>
                                    <button
                                        type="button"
                                        className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                        onClick={() => setJobSchedule("Part-time")}
                                    >
                                        Part-time
                                    </button>
                                </div>
                            )}
                        </div>


                        <div className="relative inline block ml-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOrderOpen(!isOrderOpen)
                                    setIsScheduleOpen(false)
                                    setIsJobTypeOpen(false)
                                }}
                                className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-purple-50"
                            >
                                {orderDisplay} ▾
                            </button>


                            {isOrderOpen && (
                                <div className="absolute left-0 top-full mt-2 min-w-40 rounded-xl bg-white border border-gray-200">
                                    <button
                                        type="button"
                                        className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                        onClick={() => {
                                            setOrderDisplay('By Newest')
                                            setOrder('desc')
                                        }}
                                    >
                                        By Newest
                                    </button>
                                    <button
                                        type="button"
                                        className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                        onClick={() => {
                                            setOrderDisplay('By Oldest')
                                            setOrder('asc')
                                        }}
                                    >
                                        By Oldest
                                    </button>
                                </div>
                            )}
                        </div>




                    </form>
                    <button
                        className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-purple-50"
                        type="button"
                        onClick={handleReset}
                        className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-purple-50"
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={onLogout}
                        disabled={isLoggingOut}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoggingOut ? 'Logging out…' : 'Log out'}
                    </button>
                </div>
            </div>
        </header>
    )
}


export default JobSearchPageNavbar

