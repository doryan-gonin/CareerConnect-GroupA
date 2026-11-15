import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { useAsyncResource } from "./useAsyncResource";

describe("useAsyncResource", () => {
  it("keeps the latest request and exposes failures", async () => {
    let resolveRequest!: (value: string) => void;
    const load = () => new Promise<string>((resolve) => (resolveRequest = resolve));
    const { result } = renderHook(() => useAsyncResource(load, []));

    expect(result.current.isLoading).toBe(true);
    await act(async () => resolveRequest("ready"));
    await waitFor(() => expect(result.current.data).toBe("ready"));
    expect(result.current.error).toBeNull();
  });

  it("cancels a request when the resource unmounts", async () => {
    let observedSignal: AbortSignal | undefined;
    const load = (signal: AbortSignal) => {
      observedSignal = signal;
      return new Promise<string>(() => undefined);
    };
    const { unmount } = renderHook(() => useAsyncResource(load, []));
    unmount();
    expect(observedSignal?.aborted).toBe(true);
  });
});
