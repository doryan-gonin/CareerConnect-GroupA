import { useState } from 'react'
import { updateJob } from '../api/jobs'
import SliderNumberInput from './SliderNumberInput'
import MarkdownEditor from './MarkdownEditor'
import LocationAutocomplete from './LocationAutocomplete'
import {
  JOB_TYPES,
  JOB_SCHEDULES,
  PRESET_CATEGORIES,
  SCHEDULE_HOURS_MAP,
  HOURS_EXTREMUMS,
  SALARY_EXTREMUMS,
} from '../constants/jobs'

export default function EditJobForm({
  token,
  job,
  onUpdated,
  onCancel,
}) {
  const isPresetCategory = PRESET_CATEGORIES.includes(job.category)

  const [form, setForm] = useState({
    title: job.title || '',
    company_name: job.company_name || '',
    description: job.description || '',
    location: job.location || '',
    job_type: job.job_type || 'Permanent',
    job_schedule: job.job_schedule || 'Full-time',
    min_hours_per_week: job.min_hours_per_week ?? '',
    max_hours_per_week: job.max_hours_per_week ?? '',
    salary_min: job.salary_min ?? '',
    salary_max: job.salary_max ?? '',
  })

  const [categorySelect, setCategorySelect] = useState(
    isPresetCategory ? job.category : (job.category ? 'Other' : PRESET_CATEGORIES[0])
  )
  const [customCategory, setCustomCategory] = useState(
    isPresetCategory ? '' : (job.category || '')
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previous => ({
      ...previous,
      [name]: value,
    }))
  }

  function handleScheduleChange(event) {
    const newSchedule = event.target.value
    const defaults = SCHEDULE_HOURS_MAP[newSchedule]
    setForm(previous => ({
      ...previous,
      job_schedule: newSchedule,
      min_hours_per_week: defaults ? defaults.min : previous.min_hours_per_week,
      max_hours_per_week: defaults ? defaults.max : previous.max_hours_per_week,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const finalCategory =
      categorySelect === 'Other' ? customCategory.trim() : categorySelect
    if (!finalCategory) {
      setError('Please provide a category for this job posting.')
      return
    }

    const payload = {
      ...form,
      category: finalCategory,
      min_hours_per_week:
        form.min_hours_per_week === '' || form.min_hours_per_week == null
          ? null
          : Number(form.min_hours_per_week),
      max_hours_per_week:
        form.max_hours_per_week === '' || form.max_hours_per_week == null
          ? null
          : Number(form.max_hours_per_week),
      salary_min:
        form.salary_min === '' || form.salary_min == null
          ? null
          : Number(form.salary_min),
      salary_max:
        form.salary_max === '' || form.salary_max == null
          ? null
          : Number(form.salary_max),
    }

    if (
      payload.min_hours_per_week !== null &&
      payload.max_hours_per_week !== null &&
      payload.min_hours_per_week > payload.max_hours_per_week
    ) {
      setError('Minimum working hours cannot exceed maximum hours.')
      return
    }

    if (
      payload.salary_min !== null &&
      payload.salary_max !== null &&
      payload.salary_min > payload.salary_max
    ) {
      setError('Minimum salary cannot exceed maximum salary.')
      return
    }

    setSaving(true)

    try {
      const updatedJob = await updateJob(token, job.id, payload)
      onUpdated(updatedJob)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg border border-gray-200 bg-gray-50/50 p-5 sm:p-6 shadow-2xs"
    >
      <h3 className="mb-4 border-b border-gray-200 pb-2 text-base font-medium text-gray-900">
        Edit Job #{job.id}
      </h3>

      {/* Row 1: Title & Company */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">
            Job Title
          </span>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">
            Company Name
          </span>
          <input
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </label>
      </div>

      {/* Row 2: Location & Category */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`edit-job-location-${job.id}`} className="mb-1 block text-xs font-medium text-gray-700">
            Location
          </label>
          <LocationAutocomplete
            id={`edit-job-location-${job.id}`}
            name="location"
            value={form.location}
            onChange={(val) => setForm(prev => ({ ...prev, location: val }))}
            placeholder="e.g. Montreal, QC or Remote"
            required
          />
        </div>

        <div>
          <label htmlFor={`edit-job-category-${job.id}`} className="mb-1 block text-xs font-medium text-gray-700">
            Category
          </label>
          <select
            id={`edit-job-category-${job.id}`}
            value={categorySelect}
            onChange={(e) => setCategorySelect(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            {PRESET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="Other">Other (specify below)</option>
          </select>

          {categorySelect === 'Other' && (
            <input
              type="text"
              placeholder="Enter category name"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              required
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          )}
        </div>
      </div>

      {/* Row 3: Description */}
      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Job Description <span className="text-[11px] text-gray-400 font-normal">(Markdown supported)</span>
        </label>
        <MarkdownEditor
          value={form.description}
          onChange={(val) => setForm(prev => ({ ...prev, description: val }))}
          rows={7}
          required
          placeholder="Describe the responsibilities, requirements, qualifications..."
        />
      </div>

      {/* Row 4: Job Type & Schedule */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">
            Job Type
          </span>
          <select
            name="job_type"
            value={form.job_type}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            {JOB_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">
            Schedule <span className="text-[11px] text-gray-400 font-normal">(autofills standard hours)</span>
          </span>
          <select
            name="job_schedule"
            value={form.job_schedule}
            onChange={handleScheduleChange}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            {JOB_SCHEDULES.map((sched) => (
              <option key={sched} value={sched}>
                {sched}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Row 5: Working Hours Sliders */}
      <div className="mt-5 border-t border-gray-200/80 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Working Hours
          </span>
          <span className="text-[11px] text-gray-400">
            Slider 0–60 hrs, or type numeric override
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SliderNumberInput
            label="Minimum Hours per Week"
            value={form.min_hours_per_week}
            onChange={(val) => setForm(prev => ({ ...prev, min_hours_per_week: val }))}
            min={HOURS_EXTREMUMS.min}
            max={HOURS_EXTREMUMS.max}
            step={HOURS_EXTREMUMS.step}
            unit="hrs/wk"
            placeholder="e.g. 35"
          />
          <SliderNumberInput
            label="Maximum Hours per Week"
            value={form.max_hours_per_week}
            onChange={(val) => setForm(prev => ({ ...prev, max_hours_per_week: val }))}
            min={HOURS_EXTREMUMS.min}
            max={HOURS_EXTREMUMS.max}
            step={HOURS_EXTREMUMS.step}
            unit="hrs/wk"
            placeholder="e.g. 40"
          />
        </div>
      </div>

      {/* Row 6: Compensation Sliders */}
      <div className="mt-5 border-t border-gray-200/80 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Annual Compensation (CAD)
          </span>
          <span className="text-[11px] text-gray-400">
            Slider $20k–$250k, or type numeric override
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SliderNumberInput
            label="Minimum Annual Salary"
            value={form.salary_min}
            onChange={(val) => setForm(prev => ({ ...prev, salary_min: val }))}
            min={SALARY_EXTREMUMS.min}
            max={SALARY_EXTREMUMS.max}
            step={SALARY_EXTREMUMS.step}
            prefix="$"
            unit="CAD"
            placeholder="Optional"
          />
          <SliderNumberInput
            label="Maximum Annual Salary"
            value={form.salary_max}
            onChange={(val) => setForm(prev => ({ ...prev, salary_max: val }))}
            min={SALARY_EXTREMUMS.min}
            max={SALARY_EXTREMUMS.max}
            step={SALARY_EXTREMUMS.step}
            prefix="$"
            unit="CAD"
            placeholder="Optional"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 p-2.5 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}