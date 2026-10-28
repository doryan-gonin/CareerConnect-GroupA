import { useState } from 'react'
import { searchJobs } from '../api/jobs'

function JobSearchPageNavbar({ onLogout, isLoggingOut = false, onJobsLoaded, onNavigateDashboard }) {
    const [keyword, setKeyWord] = useState('')
    const [error, setError] = useState('')
    const [isScheduleOpen, setIsScheduleOpen] = useState(false)
    const [isJobTypeOpen, setIsJobTypeOpen] = useState(false)
    const [isOrderOpen, setIsOrderOpen] = useState(false)
    const [category, setCategory] = useState('')
    const [jobSchedule, setJobSchedule] = useState('Schedule')
    const [jobType, setJobType] = useState('Job Type')
    const [orderDisplay, setOrderDisplay] = useState('Order')
    const [order, setOrder] = useState('')
    const [location, setLocation] = useState('')

    function handleReset() {
        setJobSchedule('Schedule')
        setJobType('Job Type')
        setOrder('')
        setLocation('')
        setKeyWord('')
        setCategory('')
        setOrderDisplay('Order')
        setError('')
        onJobsLoaded([])
    }

    async function handleSearch(event){
        event.preventDefault()
        setError('')
        try{
            const data = await searchJobs({
                keyword,
                location,
                category,
                jobType: jobType !== 'Job Type' ? jobType : undefined,
                jobSchedule: jobSchedule !== 'Schedule' ? jobSchedule : undefined,
                sortOrder: order || undefined,
            })
            onJobsLoaded(data.jobs)
        } catch (err){
            onJobsLoaded([])
            setError(err.message)
        }
    }

    return (
        <header className="border-b border-gray-200 bg-white">
            {/* Top Navigation Bar (Consistent with main Navbar) */}
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                {/* Brand */}
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                        Career<span className="text-purple-600">Connect</span>
                    </span>
                </div>

                {/* User & Navigation */}
                <div className="flex items-center gap-4">
                    {onNavigateDashboard && (
                        <button
                            type="button"
                            onClick={onNavigateDashboard}
                            className="text-sm font-medium text-purple-600 hover:underline"
                        >
                            Dashboard
                        </button>
                    )}

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

            {/* Filter & Search Bar */}
            <div className="border-t border-gray-100 bg-gray-50/50">
                <div className="mx-auto max-w-5xl px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                            <button type="submit" hidden>Search</button>
                            <input
                                type="text"
                                placeholder="Describe the job you want"
                                value={keyword}
                                onChange={(event) => setKeyWord(event.target.value)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 w-52"
                            />

                            <input
                                type="text"
                                placeholder="City, province, or remote"
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 w-48"
                            />

                            <input
                                type="text"
                                placeholder="Category (e.g. Software, Design)"
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 w-48"
                            />

                            <div className="relative inline-block">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsJobTypeOpen(!isJobTypeOpen)
                                        setIsScheduleOpen(false)
                                        setIsOrderOpen(false)
                                    }}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {jobType} ▾
                                </button>

                                {isJobTypeOpen && (
                                    <div className="absolute left-0 top-full mt-2 min-w-40 rounded-xl bg-white border border-gray-200 shadow-lg z-20">
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

                            <div className="relative inline-block">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsScheduleOpen(!isScheduleOpen)
                                        setIsJobTypeOpen(false)
                                        setIsOrderOpen(false)
                                    }}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {jobSchedule} ▾
                                </button>

                                {isScheduleOpen && (
                                    <div className="absolute left-0 top-full mt-2 min-w-40 rounded-xl bg-white border border-gray-200 shadow-lg z-20">
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

                            <div className="relative inline-block">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOrderOpen(!isOrderOpen)
                                        setIsScheduleOpen(false)
                                        setIsJobTypeOpen(false)
                                    }}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {orderDisplay} ▾
                                </button>

                                {isOrderOpen && (
                                    <div className="absolute left-0 top-full mt-2 min-w-40 rounded-xl bg-white border border-gray-200 shadow-lg z-20">
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
                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            type="button"
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                    </div>

                    {error && (
                        <p className="mt-2 w-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </header>
    )
}


export default JobSearchPageNavbar
