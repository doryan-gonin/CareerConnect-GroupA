import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import ApplicationStatusBadge from "./ApplicationStatusBadge";

describe("ApplicationStatusBadge", () => {
  it("renders the application status", () => {
    render(<ApplicationStatusBadge status="Interview" />);
    expect(screen.getByText("Interview")).toBeInTheDocument();
  });

  it("renders unknown statuses without crashing", () => {
    render(<ApplicationStatusBadge status="Pending review" />);
    expect(screen.getByText("Pending review")).toBeInTheDocument();
  });
});
