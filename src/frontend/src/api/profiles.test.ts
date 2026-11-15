import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { MockInstance } from "vite-plus/test";
import { API_BASE_URL } from "./client";
import { downloadResume, getProfile, setDefaultResume } from "./profiles";

describe("profile and resume API", () => {
  let fetchMock: MockInstance<typeof fetch>;

  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the authenticated profile", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 3,
          user_id: 7,
          first_name: "Ada",
          last_name: "Lovelace",
          last_updated: "2026-11-01",
        }),
        { status: 200 },
      ),
    );

    await expect(getProfile("token")).resolves.toMatchObject({
      first_name: "Ada",
      last_name: "Lovelace",
    });
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/profiles/me`, {
      method: "GET",
      headers: { Authorization: "Bearer token" },
    });
  });

  it("sets a default resume", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 4,
          user_id: 7,
          file_name: "resume.pdf",
          uploaded_at: "2026-11-01",
          is_default: true,
        }),
        { status: 200 },
      ),
    );

    await expect(setDefaultResume("token", 4)).resolves.toMatchObject({ id: 4, is_default: true });
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/profiles/me/resumes/4/default`, {
      method: "PATCH",
      headers: { Authorization: "Bearer token" },
    });
  });

  it("downloads a resume with a safe filename and revokes the object URL", async () => {
    const blob = new Blob(["resume"], { type: "application/pdf" });
    fetchMock.mockResolvedValue(new Response(blob, { status: 200 }));
    const createObjectURL = vi.fn(() => "blob:resume");
    const revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(window.URL, "createObjectURL").mockImplementation(createObjectURL);
    vi.spyOn(window.URL, "revokeObjectURL").mockImplementation(revokeObjectURL);

    await downloadResume("token", 9, "ada-resume.pdf");

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/profiles/me/resumes/9`, {
      method: "GET",
      headers: { Authorization: "Bearer token" },
    });
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:resume");
  });
});
