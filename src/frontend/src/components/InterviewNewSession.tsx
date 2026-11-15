import { useEffect, useState } from "react";
import { getMyApplications } from "../api/applications";
import { createInterviewSession } from "../api/interview";
import { interviewSessionFormSchema } from "../api/schemas";
import type { ApplicationDetail } from "../api/types";
import type { ChangeEvent, FormEvent } from "react";

type InterviewNewSessionProps = {
  token: string;
  onBack: () => void;
  onBrowseJobs: () => void;
  onCreated: (id: number) => void;
};
function InterviewNewSession({ token, onBack, onBrowseJobs, onCreated }: InterviewNewSessionProps) {
  const [applications, setApplications] = useState<ApplicationDetail[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getMyApplications(token)
      .then((data) => {
        if (isMounted) setApplications(data);
      })
      .catch((err: unknown) => {
        if (isMounted) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = interviewSessionFormSchema.safeParse({ applicationId: Number(applicationId) });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Select an application.");
      return;
    }
    setIsStarting(true);
    setError("");
    try {
      const session = await createInterviewSession(token, parsed.data.applicationId);
      onCreated(session.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setIsStarting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm font-medium text-purple-600 hover:underline"
      >
        ← Back to sessions
      </button>

      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-medium text-gray-900">New interview session</h1>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {isLoading ? (
          <div className="py-6 text-center text-sm text-gray-500">Loading applications…</div>
        ) : applications.length === 0 && !error ? (
          <div className="rounded-md bg-gray-50 py-6 text-center text-sm text-gray-500">
            You need an application to practice for.{" "}
            <button
              type="button"
              onClick={onBrowseJobs}
              className="font-medium text-purple-600 hover:underline"
            >
              Browse jobs
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Which application do you want to practice for?
              <select
                required
                value={applicationId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setApplicationId(e.target.value)}
                disabled={isStarting}
                className="rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select an application</option>
                {applications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.job_title} at {application.company_name} ({application.status})
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={isStarting || !applicationId}
              className="rounded-md bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStarting ? "Starting session…" : "Start session"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default InterviewNewSession;
