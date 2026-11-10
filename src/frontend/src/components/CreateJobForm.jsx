
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
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 border-b border-gray-100 pb-3 text-lg font-medium text-gray-900">
        Create Job Posting
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(field => (
          <label key={field.name} className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">{field.label}</span>
            <input
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </label>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-medium text-gray-700">Description</span>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows={5}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Job Type</span>
          <select
            name="job_type"
            value={form.job_type}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="Permanent">Permanent</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Schedule</span>
          <select
            name="job_schedule"
            value={form.job_schedule}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
          </select>
        </label>
      </div>

      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Publish Job'}
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
