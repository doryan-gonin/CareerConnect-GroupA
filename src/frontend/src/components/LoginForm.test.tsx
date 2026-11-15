import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import LoginForm from "./LoginForm";
import { loginUser } from "../api/auth";

vi.mock("../api/auth", () => ({ loginUser: vi.fn() }));

describe("LoginForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits credentials and passes the token to the parent", async () => {
    const user = userEvent.setup();
    const onLoggedIn = vi.fn();
    vi.mocked(loginUser).mockResolvedValue({
      access_token: "access-token",
      token_type: "bearer",
      is_recruiter: false,
    });
    render(<LoginForm onLoggedIn={onLoggedIn} onSwitchToSignup={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "candidate@example.com");
    await user.type(screen.getByLabelText("Password"), "Secure!123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(loginUser).toHaveBeenCalledWith("candidate@example.com", "Secure!123");
    expect(onLoggedIn).toHaveBeenCalledWith("access-token", false);
  });

  it("shows server errors", async () => {
    const user = userEvent.setup();
    vi.mocked(loginUser).mockRejectedValue(new Error("Invalid credentials."));
    render(<LoginForm onLoggedIn={vi.fn()} onSwitchToSignup={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "candidate@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid credentials.")).toBeInTheDocument();
  });
});
