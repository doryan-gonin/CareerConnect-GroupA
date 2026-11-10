import { useState } from 'react'
import { updateJob } from '../api/jobs'

export default function EditJobForm({
  token,
  job,
  onUpdated,
  onCancel,
}) {
  const [form, setForm] = useState({
    title: job.title || '',
    company_name: job.company_name || '',
    description: job.description || '',
    location: job.location || '',
    category: job.category || '',
    job_type: job.job_type || 'Permanent',
    job_schedule: job.job_schedule || 'Full-time',
    min_hours_per_week: job.min_hours_per_week ?? '',
    max_hours_per_week: job.max_hours_per_week ?? '',
    salary_min: job.salary_min ?? '',
    salary_max: job.salary_max ?? '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const numericFields = [
      'min_hours_per_week',
      'max_hours_per_week',
      'salary_min',
      'salary_max',
    ]

    const payload = { ...form }

    for (const field of numericFields) {
      payload[field] =
        form[field] === '' ? null : Number(form[field])
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

  const textFields = [
    { name: 'title', label: 'Job Title' },
    { name: 'company_name', label: 'Company Name' },
    { name: 'location', label: 'Location' },
    { name: 'category', label: 'Category' },
  ]

  const numberFields = [
    { name: 'min_hours_per_week', label: 'Minimum Hours per Week' },
    { name: 'max_hours_per_week', label: 'Maximum Hours per Week' },
    { name: 'salary_min', label: 'Minimum Annual Salary (CAD)' },
    { name: 'salary_max', label: 'Maximum Annual Salary (CAD)' },
  ]

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg border border-gray-200 bg-gray-50/50 p-5 sm:p-6 shadow-2xs"
    >
      <h3 className="mb-4 border-b border-gray-200 pb-2 text-base font-medium text-gray-900">
        Edit Job #{job.id}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {textFields.map(field => (
          <label key={field.name} className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">
              {field.label}
            </span>

            <input
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </label>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-medium text-gray-700">
          Job Description
        </span>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={6}
          required
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </label>

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
            <option value="Permanent">Permanent</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">
            Schedule
          </span>

          <select
            name="job_schedule"
            value={form.job_schedule}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {numberFields.map(field => (
          <label key={field.name} className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">
              {field.label}
            </span>

            <input
              type="number"
              min="0"
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </label>
        ))}
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