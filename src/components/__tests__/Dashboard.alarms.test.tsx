import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const storeState = {
  currentPlan: {
    identity_statement: "I ship",
    week_start: "2026-04-06",
    tasks: [],
    time_blocks: [],
    alarms: [],
  },
  markTaskComplete: vi.fn(),
  acknowledgeAlarm: vi.fn(),
  snoozeAlarmOnce: vi.fn(),
  isFallbackPlan: false,
  isLoading: false,
  lastError: null as string | null,
  alarmSync: {
    scheduledCount: 9,
    failedCount: 1,
    lastSyncAt: "2026-04-02 10:00:00",
  },
};

vi.mock("../../store/week", () => ({
  useWeekStore: () => storeState,
  getTodayName: () => "monday",
}));

import Dashboard from "../Dashboard";

describe("Dashboard alarm sync", () => {
  it("shows alarm sync status", () => {
    render(<Dashboard />);
    expect(screen.getByText(/Alarm sync:/i)).toBeInTheDocument();
    expect(screen.getByText(/9 scheduled/i)).toBeInTheDocument();
    expect(screen.getByText(/1 failed/i)).toBeInTheDocument();
  });
});
