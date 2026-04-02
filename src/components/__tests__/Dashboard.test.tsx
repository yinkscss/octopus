import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const markTaskComplete = vi.fn();
const acknowledgeAlarm = vi.fn();
const snoozeAlarmOnce = vi.fn();

const storeState = {
  currentPlan: {
    identity_statement: "I ship",
    week_start: "2026-04-06",
    tasks: [
      {
        id: 22,
        day: "monday",
        title: "Ship onboarding",
        implementation_intention: "When it is 09:00, I will ship onboarding.",
        time_block: "09:00",
        duration_minutes: 90,
        type: "deep_work",
        app_rules: ["Twitter"],
        two_minute_start: "Open project",
        status: "pending",
      },
    ],
    time_blocks: [],
    alarms: [],
  },
  markTaskComplete,
  acknowledgeAlarm,
  snoozeAlarmOnce,
  isFallbackPlan: false,
  isLoading: false,
  lastError: null as string | null,
  alarmSync: null as { scheduledCount: number; failedCount: number; lastSyncAt: string } | null,
};

vi.mock("../../store/week", () => ({
  useWeekStore: () => storeState,
  getTodayName: () => "monday",
}));

import Dashboard from "../Dashboard";

describe("Dashboard", () => {
  beforeEach(() => {
    markTaskComplete.mockReset();
    storeState.isFallbackPlan = false;
    storeState.lastError = null;
  });

  it("renders today tasks", () => {
    render(<Dashboard />);
    expect(screen.getByText("Ship onboarding")).toBeInTheDocument();
  });

  it("marks a task complete", () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Mark Complete" }));
    expect(markTaskComplete).toHaveBeenCalledWith(22);
  });

  it("shows fallback status", () => {
    storeState.isFallbackPlan = true;
    render(<Dashboard />);
    expect(screen.getByText(/shifted plan/i)).toBeInTheDocument();
  });
});
