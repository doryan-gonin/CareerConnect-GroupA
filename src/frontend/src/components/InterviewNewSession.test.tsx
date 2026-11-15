import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import InterviewNewSession from "./InterviewNewSession";
import { getMyApplications } from "../api/applications";
import { createInterviewSession } from "../api/interview";

vi.mock("../api/applications", () => ({ getMyApplications: vi.fn() }));
vi.mock("../api/interview", () => ({ createInterviewSession: vi.fn() }));

describe("InterviewNewSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads applications and starts a session for the selected application", async () => {
    (getMyApplications as any).mockResolvedValue([
      { id: 7, job_title: "Frontend Engineer", company_name: "Acme", status: "Applied" },
    ]);
    (createInterviewSession as any).mockResolvedValue({ id: 18 });
    const user = userEvent.setup();
    const onCreated = vi.fn();

    render(
      <InterviewNewSession
        token="token"
        onBack={vi.fn()}
        onBrowseJobs={vi.fn()}
        onCreated={onCreated}
      />,
    );

    const select = await screen.findByRole("combobox");
    await user.selectOptions(select, "7");
    await user.click(screen.getByRole("button", { name: "Start session" }));

    await waitFor(() => expect(createInterviewSession).toHaveBeenCalledWith("token", 7));
    expect(onCreated).toHaveBeenCalledWith(18);
  });

  it("offers to browse jobs when there are no applications", async () => {
    (getMyApplications as any).mockResolvedValue([]);
    const user = userEvent.setup();
    const onBrowseJobs = vi.fn();

    render(
      <InterviewNewSession
        token="token"
        onBack={vi.fn()}
        onBrowseJobs={onBrowseJobs}
        onCreated={vi.fn()}
      />,
    );

    await screen.findByText("You need an application to practice for.");
    await user.click(screen.getByRole("button", { name: "Browse jobs" }));
    expect(onBrowseJobs).toHaveBeenCalledOnce();
  });

  it("shows an API error when applications cannot be loaded", async () => {
    (getMyApplications as any).mockRejectedValue(new Error("Failed to load applications."));

    render(
      <InterviewNewSession
        token="token"
        onBack={vi.fn()}
        onBrowseJobs={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    expect(await screen.findByText("Failed to load applications.")).toBeInTheDocument();
  });
});
