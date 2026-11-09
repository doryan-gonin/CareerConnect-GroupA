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
      className="mt-4 rounded-xl border bg-white p-6 shadow-sm"
    >
      <h2 className="mb-5 text-xl font-bold">
        Edit Job #{job.id}
      </h2>

      {textFields.map(field => (
        <label key={field.name} className="mb-4 block">
          <span className="mb-1 block font-medium">
            {field.label}
          </span>

          <input
            name={field.name}
            value={form[field.name]}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-3 py-2"
          />
        </label>
      ))}

      <label className="mb-4 block">
        <span className="mb-1 block font-medium">
          Job Description
        </span>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={7}
          required
          className="w-full rounded-lg border px-3 py-2"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block font-medium">
          Job Type
        </span>

        <select
          name="job_type"
          value={form.job_type}
          onChange={handleChange}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="Permanent">Permanent</option>
        </select>
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block font-medium">
          Schedule
        </span>

        <select
          name="job_schedule"
          value={form.job_schedule}
          onChange={handleChange}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        {numberFields.map(field => (
          <label key={field.name} className="block">
            <span className="mb-1 block font-medium">
              {field.label}
            </span>

            <input
              type="number"
              min="0"
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-violet-600 px-5 py-2 text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-5 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}