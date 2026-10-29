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

const SORT_OPTIONS = [
    { label: 'Newest First', sortBy: 'posted_at', sortOrder: 'desc' },
    { label: 'Oldest First', sortBy: 'posted_at', sortOrder: 'asc' },
    { label: 'Highest Salary', sortBy: 'salary_max', sortOrder: 'desc' },
    { label: 'Lowest Salary', sortBy: 'salary_min', sortOrder: 'asc' },
    { label: 'Most Hours', sortBy: 'max_hours_per_week', sortOrder: 'desc' },
    { label: 'Fewest Hours', sortBy: 'max_hours_per_week', sortOrder: 'asc' },
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
    const [sortBy, setSortBy] = useState('')
    const [sortOrder, setSortOrder] = useState('')
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
        setSortBy('')
        setSortOrder('')
        setLocation('')
        setKeyWord('')
        setCategory('')
        setOrderDisplay('Order')
        setError('')
        onJobsLoaded([])
    }

    async function triggerSearch(overrides = {}) {
        setError('')
        const effectiveKeyword = overrides.keyword !== undefined ? overrides.keyword : keyword
        const effectiveLocation = overrides.location !== undefined ? overrides.location : location
        const effectiveCategory = overrides.category !== undefined ? overrides.category : category
        const effectiveJobType = overrides.jobType !== undefined ? overrides.jobType : jobType
        const effectiveJobSchedule = overrides.jobSchedule !== undefined ? overrides.jobSchedule : jobSchedule
        const effectiveSortBy = overrides.sortBy !== undefined ? overrides.sortBy : sortBy
        const effectiveSortOrder = overrides.sortOrder !== undefined ? overrides.sortOrder : sortOrder

        try {
            const data = await searchJobs({
                keyword: effectiveKeyword,
                location: effectiveLocation,
                category: effectiveCategory,
                jobType: effectiveJobType !== 'Job Type' ? effectiveJobType : undefined,
                jobSchedule: effectiveJobSchedule !== 'Schedule' ? effectiveJobSchedule : undefined,
                sortBy: effectiveSortBy || undefined,
                sortOrder: effectiveSortOrder || undefined,
            })
            onJobsLoaded(data.jobs)
        } catch (err) {
            onJobsLoaded([])
            setError(err.message)
        }
    }

    function handleSearch(event) {
        if (event) event.preventDefault()
        triggerSearch()
    }

    return (
        <header className="border-b border-gray-200 bg-white">
            {/* Top Navigation Bar (Consistent with main Navbar) */}
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                {/* Brand */}
                <div className="flex items-center gap-2">
                    <a
                        href="/dashboard"
                        onClick={(e) => {
                            if (onNavigateDashboard) {
                                e.preventDefault()
                                onNavigateDashboard()
                            }
                        }}
                        className="text-xl font-bold text-gray-900"
                    >
                        Career<span className="text-purple-600">Connect</span>
                    </a>
                </div>

                {/* User & Navigation */}
                <div className="flex items-center gap-4">
                    {onNavigateDashboard && (
                        <a
                            href="/dashboard"
                            onClick={(e) => {
                                e.preventDefault()
                                onNavigateDashboard()
                            }}
                            className="text-sm font-medium text-purple-600 hover:underline cursor-pointer"
                        >
                            Dashboard
                        </a>
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
                                                triggerSearch({ category: '' })
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
                                                    triggerSearch({ category: cat })
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
                                            className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm text-gray-700 font-medium border-b border-gray-100"
                                            onClick={() => {
                                                setJobType("Job Type")
                                                setIsJobTypeOpen(false)
                                                triggerSearch({ jobType: 'Job Type' })
                                            }}
                                        >
                                            All Types
                                        </button>
                                        <button
                                            type="button"
                                            className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                            onClick={() => {
                                                setJobType("Permanent")
                                                setIsJobTypeOpen(false)
                                                triggerSearch({ jobType: 'Permanent' })
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
                                                triggerSearch({ jobType: 'Temporary' })
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
                                                triggerSearch({ jobType: 'Contract' })
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
                                                triggerSearch({ jobType: 'Internship' })
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
                                            className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm text-gray-700 font-medium border-b border-gray-100"
                                            onClick={() => {
                                                setJobSchedule("Schedule")
                                                setIsScheduleOpen(false)
                                                triggerSearch({ jobSchedule: 'Schedule' })
                                            }}
                                        >
                                            All Schedules
                                        </button>
                                        <button
                                            type="button"
                                            className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm"
                                            onClick={() => {
                                                setJobSchedule("Full-time")
                                                setIsScheduleOpen(false)
                                                triggerSearch({ jobSchedule: 'Full-time' })
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
                                                triggerSearch({ jobSchedule: 'Part-time' })
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
                                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 max-w-44 truncate"
                                    title={orderDisplay}
                                >
                                    {orderDisplay} ▾
                                </button>

                                {isOrderOpen && (
                                    <div className="absolute left-0 top-full mt-2 min-w-48 rounded-xl bg-white border border-gray-200 shadow-lg z-20 py-1">
                                        <button
                                            type="button"
                                            className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm text-gray-700 font-medium border-b border-gray-100"
                                            onClick={() => {
                                                setOrderDisplay('Order')
                                                setSortBy('')
                                                setSortOrder('')
                                                setIsOrderOpen(false)
                                                triggerSearch({ sortBy: '', sortOrder: '' })
                                            }}
                                        >
                                            Default Order
                                        </button>
                                        {SORT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.label}
                                                type="button"
                                                className="block w-full hover:bg-purple-50 text-left px-4 py-2 text-sm text-gray-700"
                                                onClick={() => {
                                                    setOrderDisplay(opt.label)
                                                    setSortBy(opt.sortBy)
                                                    setSortOrder(opt.sortOrder)
                                                    setIsOrderOpen(false)
                                                    triggerSearch({ sortBy: opt.sortBy, sortOrder: opt.sortOrder })
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="rounded-md bg-purple-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-purple-700"
                            >
                                Search
                            </button>
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
