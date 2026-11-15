import { useCallback } from "react";
import { getMyApplications } from "../api/applications";
import { getSavedJobs } from "../api/jobs";
import { useAsyncResource } from "./useAsyncResource";
import type { ApplicationStatus } from "../api/types";

export type CandidateJobMetadata = {
  statusByJobId: Record<number, ApplicationStatus>;
  savedByJobId: Record<number, boolean>;
};

/** Loads the two candidate-only datasets needed to decorate job cards. */
export function useCandidateJobMetadata(token: string, enabled: boolean) {
  const load = useCallback(
    async (signal: AbortSignal): Promise<CandidateJobMetadata> => {
      const [applications, savedJobs] = await Promise.all([
        getMyApplications(token, undefined, signal),
        getSavedJobs(token, signal),
      ]);
      return {
        statusByJobId: Object.fromEntries(
          applications.map((application) => [application.job_id, application.status]),
        ),
        savedByJobId: Object.fromEntries(savedJobs.map((saved) => [saved.job_id, true])),
      };
    },
    [token],
  );

  return useAsyncResource(load, [load], enabled);
}
