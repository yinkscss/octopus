import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const submitWeeklyIntent = vi.fn();

const storeState = {
  submitWeeklyIntent,
  isLoading: false,
  lastError: null as string | null,
  isFallbackPlan: false,
};

vi.mock("../../store/week", () => ({
  useWeekStore: () => storeState,
}));

import WeeklyIntent from "../WeeklyIntent";

describe("WeeklyIntent", () => {
  beforeEach(() => {
    submitWeeklyIntent.mockReset();
    storeState.isLoading = false;
    storeState.lastError = null;
    storeState.isFallbackPlan = false;
  });

  it("submits goals and identity", () => {
    render(<WeeklyIntent />);

    fireEvent.change(screen.getByLabelText("Weekly Goals"), {
      target: { value: "Ship onboarding" },
    });
    fireEvent.change(screen.getByLabelText("Identity Statement"), {
      target: { value: "I am someone who ships." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Build 7-Day Plan" }));

    expect(submitWeeklyIntent).toHaveBeenCalledWith(
      "Ship onboarding",
      "I am someone who ships."
    );
  });

  it("shows fallback warning", () => {
    storeState.isFallbackPlan = true;
    render(<WeeklyIntent />);
    expect(screen.getByText(/Planner fallback active/i)).toBeInTheDocument();
  });

  it("shows last error", () => {
    storeState.lastError = "Failed to build weekly plan";
    render(<WeeklyIntent />);
    expect(screen.getByText("Failed to build weekly plan")).toBeInTheDocument();
  });
});
