import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { getInterviewSession, sendInterviewMessage } from "../api/interview";
import InterviewConversation from "./InterviewConversation";

vi.mock("../api/interview", () => ({
  getInterviewSession: vi.fn(),
  sendInterviewMessage: vi.fn(),
}));

describe("InterviewConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends the assistant message returned by the send endpoint", async () => {
    vi.mocked(getInterviewSession).mockResolvedValue({
      id: 12,
      job_id: 4,
      job_title: "Frontend Engineer",
      company_name: "Acme",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      messages: [{ role: "assistant", content: "Tell me about yourself." }],
    });
    vi.mocked(sendInterviewMessage).mockResolvedValue({
      role: "assistant",
      content: "That is a strong answer.",
    });

    const user = userEvent.setup();
    render(<InterviewConversation token="token" sessionId={12} onBack={vi.fn()} />);

    await screen.findByText("Tell me about yourself.");
    await user.type(screen.getByRole("textbox"), "I build accessible products.");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(sendInterviewMessage).toHaveBeenCalledWith(
        "token",
        12,
        "I build accessible products.",
      ),
    );
    expect(await screen.findByText("That is a strong answer.")).toBeInTheDocument();
  });
});
