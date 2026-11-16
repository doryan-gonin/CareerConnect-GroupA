import { useEffect, useState } from "react";
import { getMyApplications } from "../api/applications";
import { createInterviewSession } from "../api/interview";
import { interviewSessionFormSchema } from "../api/schemas";
import type { ApplicationDetail } from "../api/types";
import type { FormEvent } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Skeleton } from "./ui/skeleton";

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
      <Button type="button" variant="link" onClick={onBack} className="self-start px-0">
        ← Back to sessions
      </Button>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>New interview session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="flex flex-col gap-3 py-6" aria-label="Loading applications">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : applications.length === 0 && !error ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>You need an application to practice for.</EmptyTitle>
                <EmptyDescription>
                  Apply to a job before starting an interview session.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" onClick={onBrowseJobs}>
                  Browse jobs
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor="interview-application">
                    Which application do you want to practice for?
                  </FieldLabel>
                  <select
                    id="interview-application"
                    required
                    value={applicationId}
                    onChange={(event) => setApplicationId(event.target.value)}
                    disabled={isStarting}
                    aria-invalid={Boolean(error)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Select an application</option>
                    {applications.map((application) => (
                      <option key={application.id} value={application.id}>
                        {application.job_title} at {application.company_name} ({application.status})
                      </option>
                    ))}
                  </select>
                  {error && applications.length > 0 && <FieldError>{error}</FieldError>}
                </Field>
                <Button type="submit" disabled={isStarting || !applicationId}>
                  {isStarting ? "Starting session…" : "Start session"}
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InterviewNewSession;
