import { useEffect, useState } from "react";
import { getInterviewSessions } from "../api/interview";
import type { InterviewSessionSummary } from "../api/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { Skeleton } from "./ui/skeleton";

type InterviewPrepPageProps = {
  token: string;
  onNewSession: () => void;
  onOpenSession: (id: number) => void;
};

function InterviewPrepPage({ token, onNewSession, onOpenSession }: InterviewPrepPageProps) {
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    getInterviewSessions(token)
      .then((data) => {
        if (isMounted) setSessions(data);
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Interview Prep</h1>
          <p className="text-sm text-muted-foreground">
            Practice with AI for the jobs you applied to.
          </p>
        </div>
        <Button type="button" onClick={onNewSession}>
          New session
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Past sessions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="flex flex-col gap-3 py-6" aria-label="Loading sessions">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !error && sessions.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>No interview sessions yet.</EmptyTitle>
                <EmptyDescription>Start a session to begin practicing.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col divide-y">
              {sessions.map((session) => (
                <li key={session.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenSession(session.id)}
                    className="h-auto w-full justify-start rounded-none py-3 text-left"
                  >
                    <span className="flex flex-col items-start gap-1">
                      <span className="text-sm font-medium">{session.job_title}</span>
                      <span className="text-xs text-muted-foreground">
                        {session.company_name} · Last active{" "}
                        {new Date(session.updated_at).toLocaleDateString()}
                      </span>
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InterviewPrepPage;
