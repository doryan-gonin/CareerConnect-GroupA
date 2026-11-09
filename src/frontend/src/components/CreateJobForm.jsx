
import { useState } from 'react'
import { createJob } from '../api/jobs'

const initialForm = {
  title: '',
  company_name: '',
  description: '',
  location: '',
  category: '',
  job_type: 'Permanent',
  job_schedule: 'Full-time',
}

export default function CreateJobForm({ token, onCreated, onCancel }) {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previous => ({ ...previous, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const createdJob = await createJob(token, form)
      onCreated(createdJob)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { name: 'title', label: 'Job Title' },
    { name: 'company_name', label: 'Company Name' },
    { name: 'location', label: 'Location' },
    { name: 'category', label: 'Category' },
  ]

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold">Create Job Posting</h2>

      {fields.map(field => (
        <label key={field.name} className="mb-4 block">
          <span className="mb-1 block font-medium">{field.label}</span>
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
        <span className="mb-1 block font-medium">Description</span>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows={5}
          className="w-full rounded-lg border px-3 py-2"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block font-medium">Job Type</span>
        <select
          name="job_type"
          value={form.job_type}
          onChange={handleChange}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="Permanent">Permanent</option>
        </select>
      </label>

      <label className="mb-5 block">
        <span className="mb-1 block font-medium">Schedule</span>
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

      {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-violet-600 px-5 py-2 text-white disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Publish Job'}
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
