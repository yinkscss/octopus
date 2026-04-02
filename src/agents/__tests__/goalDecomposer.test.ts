import { describe, expect, it, vi, beforeEach } from "vitest";
import { ZodError } from "zod";
import { decomposeWeeklyGoals } from "../goalDecomposer";
import { LLMRouter } from "../../llm/router";
import { PlannerProviderError, PlannerValidationError } from "../../types/errors";

const validPlan = {
  identity_statement: "I am someone who ships.",
  week_start: "2026-04-06",
  tasks: [
    {
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
  time_blocks: [
    {
      day: "monday",
      start_time: "09:00",
      end_time: "10:30",
      mode: "deep_work",
      app_rules: ["Twitter"],
    },
  ],
  alarms: [
    {
      day: "monday",
      time: "08:50",
      label: "Start now",
      type: "transition",
      status: "scheduled",
    },
  ],
};

describe("goalDecomposer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a valid plan when router succeeds", async () => {
    vi.spyOn(LLMRouter.prototype, "callWithFallback").mockResolvedValue(validPlan);

    const result = await decomposeWeeklyGoals({
      rawGoals: "Ship onboarding this week",
      identityStatement: "I am someone who ships.",
      weekStart: "2026-04-06",
    });

    expect(result.week_start).toBe("2026-04-06");
    expect(result.tasks.length).toBeGreaterThan(0);
  });

  it("normalizes partially malformed task payloads", async () => {
    vi.spyOn(LLMRouter.prototype, "callWithFallback").mockResolvedValue({
      identity_statement: "broken",
      week_start: "2026-04-06",
      tasks: [{ title: "missing fields" }],
      time_blocks: [],
      alarms: [],
    } as never);

    const result = await decomposeWeeklyGoals({
      rawGoals: "Ship onboarding this week",
      identityStatement: "I am someone who ships.",
      weekStart: "2026-04-06",
    });

    expect(result.tasks[0].title).toBe("missing fields");
    expect(result.tasks[0].implementation_intention.length).toBeGreaterThan(0);
    expect(result.tasks[0].two_minute_start.length).toBeGreaterThan(0);
    expect(result.time_blocks.length).toBeGreaterThan(0);
    expect(result.alarms.length).toBeGreaterThan(0);
  });

  it("normalizes camelCase and uppercase day outputs", async () => {
    vi.spyOn(LLMRouter.prototype, "callWithFallback").mockResolvedValue({
      identityStatement: "I am someone who ships.",
      weekStart: "2026-04-06",
      tasks: [
        {
          day: "Monday",
          task: "Ship onboarding",
          implementationIntention: "When it is 09:00, I will ship onboarding.",
          timeBlock: "9:00 AM",
          durationMinutes: 120,
          category: "Deep Work",
          twoMinuteStart: "Open project",
        },
      ],
    } as never);

    const result = await decomposeWeeklyGoals({
      rawGoals: "Ship onboarding this week",
      identityStatement: "I am someone who ships.",
      weekStart: "2026-04-06",
    });

    expect(result.identity_statement).toBe("I am someone who ships.");
    expect(result.tasks[0].day).toBe("monday");
    expect(result.tasks[0].time_block).toBe("09:00");
    expect(result.tasks[0].duration_minutes).toBe(90);
    expect(result.tasks[0].type).toBe("deep_work");
    expect(result.time_blocks.length).toBeGreaterThan(0);
    expect(result.alarms.length).toBeGreaterThan(0);
  });

  it("fails with validation error when task list is absent", async () => {
    vi.spyOn(LLMRouter.prototype, "callWithFallback").mockResolvedValue({
      identityStatement: "I am someone who ships.",
      weekStart: "2026-04-06",
      alarms: [],
      timeBlocks: [],
    } as never);

    await expect(
      decomposeWeeklyGoals({
        rawGoals: "Ship onboarding this week",
        identityStatement: "I am someone who ships.",
        weekStart: "2026-04-06",
      })
    ).rejects.toBeInstanceOf(PlannerValidationError);
  });

  it("wraps provider failures", async () => {
    vi.spyOn(LLMRouter.prototype, "callWithFallback").mockRejectedValue(
      new Error("network down")
    );

    await expect(
      decomposeWeeklyGoals({
        rawGoals: "Ship onboarding this week",
        identityStatement: "I am someone who ships.",
        weekStart: "2026-04-06",
      })
    ).rejects.toBeInstanceOf(PlannerProviderError);
  });

  it("wraps zod errors as planner validation errors", async () => {
    vi.spyOn(LLMRouter.prototype, "callWithFallback").mockRejectedValue(
      new ZodError([])
    );

    await expect(
      decomposeWeeklyGoals({
        rawGoals: "Ship onboarding this week",
        identityStatement: "I am someone who ships.",
        weekStart: "2026-04-06",
      })
    ).rejects.toBeInstanceOf(PlannerValidationError);
  });
});
