import { useState, useEffect, useRef } from 'react'
import { searchJobs } from '../api/jobs'

const CATEGORIES = [
    'Software Engineering',
    'Design',
    'Data Science & AI',
    'DevOps & Infrastructure',
    'Quality Assurance',
    'Technical Support',
    'Information Technology',
    'Cybersecurity',
    'Marketing',
    'Content & Communications',
    'Finance',
    'Other',
]

function JobSearchPageNavbar({ onLogout, isLoggingOut = false, onJobsLoaded, onNavigateDashboard }) {
    const [keyword, setKeyWord] = useState('')
    const [error, setError] = useState('')
    const [isCategoryOpen, setIsCategoryOpen] = useState(false)
    const [isScheduleOpen, setIsScheduleOpen] = useState(false)
    const [isJobTypeOpen, setIsJobTypeOpen] = useState(false)
    const [isOrderOpen, setIsOrderOpen] = useState(false)
    const [category, setCategory] = useState('')
    const [jobSchedule, setJobSchedule] = useState('Schedule')
    const [jobType, setJobType] = useState('Job Type')
    const [orderDisplay, setOrderDisplay] = useState('Order')
    const [order, setOrder] = useState('')
    const [location, setLocation] = useState('')

    const categoryRef = useRef(null)
    const jobTypeRef = useRef(null)
    const scheduleRef = useRef(null)
    const orderRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            if (categoryRef.current && !categoryRef.current.contains(event.target)) {
                setIsCategoryOpen(false)
            }
            if (jobTypeRef.current && !jobTypeRef.current.contains(event.target)) {
                setIsJobTypeOpen(false)
            }
            if (scheduleRef.current && !scheduleRef.current.contains(event.target)) {
                setIsScheduleOpen(false)
            }
            if (orderRef.current && !orderRef.current.contains(event.target)) {
                setIsOrderOpen(false)
            }
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                setIsCategoryOpen(false)
                setIsJobTypeOpen(false)
                setIsScheduleOpen(false)
                setIsOrderOpen(false)
            }
        }

        document.addEventListener('pointerdown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('pointerdown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    function handleReset() {
        setIsCategoryOpen(false)
        setIsScheduleOpen(false)
        setIsJobTypeOpen(false)
        setIsOrderOpen(false)
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

                            <div ref={categoryRef} className="relative inline-block">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCategoryOpen(!isCategoryOpen)
                                        setIsJobTypeOpen(false)
                                        setIsScheduleOpen(false)
                                        setIsOrderOpen(false)
                                    }}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 max-w-48 truncate"
                                    title={category || 'Category'}
                                >
                                    {category || 'Category'} ▾
                                </button>

                                {isCategoryOpen && (
                                    <div className="absolute left-0 top-full mt-2 min-w-56 max-h-64 overflow-y-auto rounded-xl bg-white border border-gray-200 shadow-lg z-20 py-1">
                                        <button
                                            type="button"
                                            className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm text-gray-700 font-medium border-b border-gray-100"
                                            onClick={() => {
                                                setCategory('')
                                                setIsCategoryOpen(false)
                                            }}
                                        >
                                            All Categories
                                        </button>
                                        {CATEGORIES.map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm text-gray-700"
                                                onClick={() => {
                                                    setCategory(cat)
                                                    setIsCategoryOpen(false)
                                                }}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div ref={jobTypeRef} className="relative inline-block">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsJobTypeOpen(!isJobTypeOpen)
                                        setIsCategoryOpen(false)
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
                                            onClick={() => {
                                                setJobType("Permanent")
                                                setIsJobTypeOpen(false)
                                            }}
                                        >
                                            Permanent
                                        </button>
                                        <button
                                            type="button"
                                            className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                            onClick={() => {
                                                setJobType("Temporary")
                                                setIsJobTypeOpen(false)
                                            }}
                                        >
                                            Temporary
                                        </button>
                                        <button
                                            type="button"
                                            className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                            onClick={() => {
                                                setJobType("Contract")
                                                setIsJobTypeOpen(false)
                                            }}
                                        >
                                            Contract
                                        </button>
                                        <button
                                            type="button"
                                            className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                            onClick={() => {
                                                setJobType("Internship")
                                                setIsJobTypeOpen(false)
                                            }}
                                        >
                                            Internship
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div ref={scheduleRef} className="relative inline-block">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsScheduleOpen(!isScheduleOpen)
                                        setIsCategoryOpen(false)
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
                                            onClick={() => {
                                                setJobSchedule("Full-time")
                                                setIsScheduleOpen(false)
                                            }}
                                        >
                                            Full-time
                                        </button>
                                        <button
                                            type="button"
                                            className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                            onClick={() => {
                                                setJobSchedule("Part-time")
                                                setIsScheduleOpen(false)
                                            }}
                                        >
                                            Part-time
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div ref={orderRef} className="relative inline-block">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOrderOpen(!isOrderOpen)
                                        setIsCategoryOpen(false)
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
                                                setIsOrderOpen(false)
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
                                                setIsOrderOpen(false)
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
