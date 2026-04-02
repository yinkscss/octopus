import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const storeState = {
  submitWeeklyIntent: vi.fn(),
  isLoading: false,
  lastError: null as string | null,
  isFallbackPlan: false,
  alarmSync: {
    scheduledCount: 12,
    failedCount: 0,
    lastSyncAt: "2026-04-02 10:00:00",
  },
};

vi.mock("../../store/week", () => ({
  useWeekStore: () => storeState,
}));

import WeeklyIntent from "../WeeklyIntent";

describe("WeeklyIntent alarm sync", () => {
  it("shows alarm sync telemetry", () => {
    render(<WeeklyIntent />);
    expect(screen.getByText(/Alarm sync:/i)).toBeInTheDocument();
    expect(screen.getByText(/12 scheduled/i)).toBeInTheDocument();
  });
});
