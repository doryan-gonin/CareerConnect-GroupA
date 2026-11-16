import { useState, type ChangeEvent, type FormEvent } from "react";
import { createJob } from "../api/jobs";
import { jobFormSchema } from "../api/schemas";
import SliderNumberInput from "./SliderNumberInput";
import MarkdownEditor from "./MarkdownEditor";
import LocationAutocomplete from "./LocationAutocomplete";
import {
  JOB_TYPES,
  JOB_SCHEDULES,
  PRESET_CATEGORIES,
  SCHEDULE_HOURS_MAP,
  HOURS_EXTREMUMS,
  SALARY_EXTREMUMS,
} from "../constants/jobs";
import { isJobSchedule, isJobType, type Job, type JobCreate } from "../api/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type Props = {
  token: string;
  onCreated: (job: Job) => void;
  onCancel: () => void;
};
type FormState = {
  title: string;
  company_name: string;
  description: string;
  location: string;
  job_type: string;
  job_schedule: string;
  min_hours_per_week: number | string;
  max_hours_per_week: number | string;
  salary_min: number | string;
  salary_max: number | string;
};

const initialForm = {
  title: "",
  company_name: "",
  description: "",
  location: "",
  job_type: "Permanent",
  job_schedule: "Full-time",
  min_hours_per_week: 35,
  max_hours_per_week: 40,
  salary_min: "",
  salary_max: "",
};

export default function CreateJobForm({ token, onCreated, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [categorySelect, setCategorySelect] = useState(PRESET_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleValueChange(name: keyof FormState, value: string) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const finalCategory = categorySelect === "Other" ? customCategory.trim() : categorySelect;
    if (!finalCategory) {
      setError("Please provide a category for this job posting.");
      return;
    }

    const payload: JobCreate = {
      ...form,
      category: finalCategory,
      job_type: isJobType(form.job_type) ? form.job_type : undefined,
      job_schedule: isJobSchedule(form.job_schedule) ? form.job_schedule : undefined,
      min_hours_per_week:
        form.min_hours_per_week === "" || form.min_hours_per_week == null
          ? null
          : Number(form.min_hours_per_week),
      max_hours_per_week:
        form.max_hours_per_week === "" || form.max_hours_per_week == null
          ? null
          : Number(form.max_hours_per_week),
      salary_min:
        form.salary_min === "" || form.salary_min == null ? null : Number(form.salary_min),
      salary_max:
        form.salary_max === "" || form.salary_max == null ? null : Number(form.salary_max),
    };

    const minHours = payload.min_hours_per_week;
    const maxHours = payload.max_hours_per_week;
    const minSalary = payload.salary_min;
    const maxSalary = payload.salary_max;
    if (typeof minHours === "number" && typeof maxHours === "number" && minHours > maxHours) {
      setError("Minimum working hours cannot exceed maximum hours.");
      return;
    }

    if (typeof minSalary === "number" && typeof maxSalary === "number" && minSalary > maxSalary) {
      setError("Minimum salary cannot exceed maximum salary.");
      return;
    }

    const parsed = jobFormSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the job details.");
      return;
    }

    setSaving(true);

    try {
      const createdJob = await createJob(token, { ...payload, ...parsed.data });
      onCreated(createdJob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job posting.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 border-b border-gray-100 pb-3 text-lg font-medium text-gray-900">
        Create Job Posting
      </h2>

      {/* Row 1: Title & Company */}
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="create-job-title">Job Title</FieldLabel>
            <Input
              id="create-job-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Senior Frontend Developer"
              required
              className="w-full"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="create-job-company">Company Name</FieldLabel>
            <Input
              id="create-job-company"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
              required
              className="w-full"
            />
          </Field>
        </div>

        {/* Row 2: Location & Category */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="create-job-location">Location</FieldLabel>
            <LocationAutocomplete
              id="create-job-location"
              name="location"
              value={form.location}
              onChange={(val) => setForm((prev) => ({ ...prev, location: val }))}
              placeholder="e.g. Montreal, QC or Remote"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="create-job-category">Category</FieldLabel>
            <Select
              value={categorySelect}
              onValueChange={(value) => setCategorySelect(String(value ?? ""))}
            >
              <SelectTrigger id="create-job-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem value="Other">Other (specify below)</SelectItem>
              </SelectContent>
            </Select>

            {categorySelect === "Other" && (
              <Input
                type="text"
                placeholder="Enter category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                className="mt-2"
              />
            )}
          </Field>
        </div>
      </FieldGroup>

      {/* Row 3: Description */}
      <div className="mt-4">
        <p className="mb-1 text-xs font-medium text-foreground">
          Job Description{" "}
          <span className="text-[11px] font-normal text-muted-foreground">
            (Markdown supported)
          </span>
        </p>
        <MarkdownEditor
          value={form.description}
          onChange={(val) => setForm((prev) => ({ ...prev, description: val }))}
          required
          rows={6}
          placeholder="Describe the responsibilities, requirements, qualifications..."
        />
      </div>

      {/* Row 4: Job Type & Schedule */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="create-job-type">Job Type</FieldLabel>
          <Select
            value={form.job_type}
            onValueChange={(value) => handleValueChange("job_type", String(value ?? ""))}
          >
            <SelectTrigger id="create-job-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="create-job-schedule">
            Schedule{" "}
            <span className="text-[11px] text-gray-400 font-normal">
              (autofills standard hours)
            </span>
          </FieldLabel>
          <Select
            value={form.job_schedule}
            onValueChange={(value) => {
              const raw = String(value ?? "");
              const next = isJobSchedule(raw) ? raw : "Full-time";
              const defaults = SCHEDULE_HOURS_MAP[next];
              setForm((previous) => ({
                ...previous,
                job_schedule: next,
                min_hours_per_week: defaults?.min ?? previous.min_hours_per_week,
                max_hours_per_week: defaults?.max ?? previous.max_hours_per_week,
              }));
            }}
          >
            <SelectTrigger id="create-job-schedule" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_SCHEDULES.map((sched) => (
                <SelectItem key={sched} value={sched}>
                  {sched}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Row 5: Working Hours Sliders */}
      <div className="mt-5 border-t border-gray-100 pt-4">
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
            onChange={(val: number | string) =>
              setForm((prev) => ({ ...prev, min_hours_per_week: val }))
            }
            min={HOURS_EXTREMUMS.min}
            max={HOURS_EXTREMUMS.max}
            step={HOURS_EXTREMUMS.step}
            unit="hrs/wk"
            placeholder="e.g. 35"
          />
          <SliderNumberInput
            label="Maximum Hours per Week"
            value={form.max_hours_per_week}
            onChange={(val: number | string) =>
              setForm((prev) => ({ ...prev, max_hours_per_week: val }))
            }
            min={HOURS_EXTREMUMS.min}
            max={HOURS_EXTREMUMS.max}
            step={HOURS_EXTREMUMS.step}
            unit="hrs/wk"
            placeholder="e.g. 40"
          />
        </div>
      </div>

      {/* Row 6: Compensation Sliders */}
      <div className="mt-5 border-t border-gray-100 pt-4">
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
            onChange={(val: number | string) => setForm((prev) => ({ ...prev, salary_min: val }))}
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
            onChange={(val: number | string) => setForm((prev) => ({ ...prev, salary_max: val }))}
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
        <Alert className="mt-4" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Creating…" : "Publish Job"}
        </Button>

        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
