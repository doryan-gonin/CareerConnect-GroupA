import { useCallback, useEffect, useState, type DependencyList } from "react";

export type AsyncResourceState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  reload: () => void;
};

/**
 * Runs an abortable request when its dependencies change and ignores stale
 * responses. Callers keep request construction in a memoized loader so this
 * hook stays independent from any API module or page.
 */
export function useAsyncResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  dependencies: DependencyList,
  enabled = true,
): AsyncResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    load(controller.signal)
      .then((nextData) => {
        if (!controller.signal.aborted) setData(nextData);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause : new Error(String(cause)));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
    // The dependency list is intentionally supplied by the caller so a page
    // can express the resource identity without recreating request helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, load, revision, ...dependencies]);

  return { data, error, isLoading, reload };
}
