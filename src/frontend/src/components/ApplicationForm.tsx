import { getMyApplications } from "../api/applications";
import { getCurrentUser } from "../api/auth";
import { useEffect, useRef, useState } from "react";
import { getProfile, getResumes, updateProfile, uploadResume } from "../api/profiles";
import { applicationFormSchema } from "../api/schemas";
import type { Job, Profile, Resume, User } from "../api/types";
import type { ChangeEvent, FormEvent } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Skeleton } from "./ui/skeleton";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_RESUMES = 5;

type ApplicationFormProps = {
  token: string;
  job?: Job | null;
  onBack: () => void;
  onSubmitApplication?: (input: {
    job_id: number;
    resume_id: number;
  }) => Promise<unknown> | unknown;
};

function ApplicationForm({ token, job, onBack, onSubmitApplication }: ApplicationFormProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(() => Boolean(token));
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [nameEdit, setNameEdit] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resumeMode, setResumeMode] = useState<"existing" | "new">("existing");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [account, setAccount] = useState<User | null>(null);
  const [accountLoading, setAccountLoading] = useState(() => Boolean(token));
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(() => Boolean(token && job?.id));

  const profileName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  useEffect(() => {
    let active = true;

    async function loadResumes() {
      setIsLoading(true);

      try {
        const data = await getResumes(token);

        if (active) {
          setResumes(data);

          const defaultResume = data.find((resume) => resume.is_default);

          setSelectedResumeId(String(defaultResume?.id ?? data[0]?.id ?? ""));
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (token) loadResumes();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setProfileLoading(true);

      try {
        const data = await getProfile(token);

        if (active) {
          setProfile(data);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    if (token) {
      loadProfile();
    } else {
      queueMicrotask(() => {
        if (active) setProfileLoading(false);
      });
    }

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      setAccountLoading(true);

      try {
        const data = await getCurrentUser(token);

        if (active) {
          setAccount(data);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (active) {
          setAccountLoading(false);
        }
      }
    }

    if (token) {
      loadAccount();
    } else {
      queueMicrotask(() => {
        if (active) setAccountLoading(false);
      });
    }

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;

    async function checkExistingApplication() {
      setCheckingApplication(true);
      setAlreadyApplied(false);

      try {
        const applications = await getMyApplications(token);

        if (active) {
          const exists = applications.some((application) => application.job_id === job?.id);

          setAlreadyApplied(exists);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (active) {
          setCheckingApplication(false);
        }
      }
    }

    if (token && job?.id) {
      checkExistingApplication();
    } else {
      queueMicrotask(() => {
        if (active) setCheckingApplication(false);
      });
    }

    return () => {
      active = false;
    };
  }, [token, job?.id]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    setUploadNotice("");

    const input = event.target;
    const file = input.files?.[0];
    input.value = "";

    if (!file) return;

    if (
      !file.name.toLowerCase().endsWith(".pdf") ||
      (file.type && file.type !== "application/pdf")
    ) {
      setError("Only PDF files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Resume must be under 5 MB.");
      return;
    }

    setIsUploading(true);

    try {
      const uploaded = await uploadResume(token, file, false);
      setResumes(await getResumes(token));
      setSelectedResumeId(String(uploaded.id));
      setResumeMode("existing");
      setUploadNotice(`"${file.name}" was uploaded and selected for this application.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (alreadyApplied || checkingApplication) {
      return;
    }

    if (!job?.id) {
      setError("Please select a valid job posting.");
      return;
    }

    if (!selectedResumeId) {
      setError("Please select a resume before applying.");
      return;
    }

    if (typeof onSubmitApplication !== "function") {
      setError("Application submission is not connected yet.");
      return;
    }

    const parsedApplication = applicationFormSchema.safeParse({
      resumeId: Number(selectedResumeId),
      coverLetter: null,
    });
    if (!parsedApplication.success) {
      setError(parsedApplication.error.issues[0]?.message ?? "Please select a valid resume.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const fullName = (nameEdit ?? profileName).trim();
      if (fullName && fullName !== profileName) {
        const [firstName, ...rest] = fullName.split(/\s+/);
        await updateProfile(token, { firstName, lastName: rest.join(" ") });
      }

      await onSubmitApplication({
        job_id: job.id,
        resume_id: parsedApplication.data.resumeId,
      });

      setSuccess("Your application was submitted successfully!");
      setAlreadyApplied(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Application submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
      <Button type="button" variant="link" onClick={onBack}>
        ← Back to Posting
      </Button>

      <h1 className="text-2xl font-semibold text-gray-900">
        {checkingApplication
          ? "Application Details"
          : success
            ? "Application Submitted"
            : alreadyApplied
              ? "Already Applied"
              : "Submit Your Application"}
      </h1>

      <div className="mt-5 rounded-lg bg-gray-50 p-4">
        <h2 className="font-semibold">{job?.title}</h2>
        <p className="text-sm text-gray-600">{job?.company_name}</p>
        <p className="text-sm text-gray-500">{job?.location}</p>
      </div>

      {error && (
        <Alert className="mt-4" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-lg font-medium text-gray-900">Applicant Information</h2>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="applicant-name">Full Name</FieldLabel>
              <Input
                id="applicant-name"
                type="text"
                value={nameEdit ?? profileName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNameEdit(e.target.value)}
                placeholder={profileLoading ? "Loading..." : "Your full name"}
                disabled={profileLoading || alreadyApplied}
              />
              <FieldDescription>Changes are saved to your profile when you apply.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="applicant-email">Email Address</FieldLabel>
              <Input
                id="applicant-email"
                type="email"
                value={account?.email_address ?? ""}
                placeholder={accountLoading ? "Loading email..." : "Email unavailable"}
                readOnly
              />
              <FieldDescription>This is the email on your account.</FieldDescription>
            </Field>
          </FieldGroup>
        </div>
        {!alreadyApplied && !checkingApplication && (
          <div>
            <h2 className="mb-3 text-lg font-medium">Choose Your Resume</h2>

            <label className="mb-3 flex items-center gap-2">
              <input
                type="radio"
                checked={resumeMode === "existing"}
                onChange={() => setResumeMode("existing")}
              />
              Use an existing resume
            </label>

            <label className="mb-3 flex items-center gap-2">
              <input
                type="radio"
                checked={resumeMode === "new"}
                onChange={() => setResumeMode("new")}
              />
              Upload a new resume
            </label>

            {resumeMode === "existing" ? (
              <div>
                {isLoading ? (
                  <p>Loading resumes...</p>
                ) : resumes.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No resumes available. Upload one to continue.
                  </p>
                ) : (
                  <Select
                    value={selectedResumeId}
                    onValueChange={(value) => setSelectedResumeId(String(value ?? ""))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a resume" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((resume) => (
                        <SelectItem key={resume.id} value={String(resume.id)}>
                          {resume.file_name}
                          {resume.is_default ? " (Default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {uploadNotice && (
                  <p role="status" className="mt-2 text-sm text-green-700">
                    {uploadNotice}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  aria-label="Resume PDF file"
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || resumes.length >= MAX_RESUMES}
                >
                  {isUploading ? "Uploading..." : "Upload Resume"}
                </Button>

                <p className="text-sm text-gray-500">
                  PDF only, up to 5 MB. It is saved to your profile and selected for this
                  application.
                </p>

                {resumes.length >= MAX_RESUMES && (
                  <p className="text-sm text-red-600">Maximum of 5 resumes reached.</p>
                )}
              </div>
            )}
          </div>
        )}
        {checkingApplication ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Skeleton className="h-4 w-4 rounded-full" />
            Checking application status...
          </div>
        ) : success ? null : alreadyApplied ? (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 p-4 text-center"
          >
            <p className="font-semibold text-green-700">Already Applied</p>
            <p className="mt-2 text-sm text-green-600">
              You have already submitted an application for this job.
            </p>
          </div>
        ) : (
          <Button
            type="submit"
            disabled={
              isSubmitting || isUploading || isLoading || !selectedResumeId || resumeMode === "new"
            }
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        )}
      </form>
    </div>
  );
}

export default ApplicationForm;
