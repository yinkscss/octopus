import { describe, expect, it } from "vitest";
import { makeItAttractive, makeItEasy, makeItHard, makeItObvious, validateTaskPlan } from "../atomicHabits";
import type { TaskPlan } from "../../types/taskPlan";

const basePlan: TaskPlan = {
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
      two_minute_start: "Open project and write first TODO",
      status: "pending",
    },
  ],
  time_blocks: [],
  alarms: [],
};

describe("atomicHabits", () => {
  it("passes obvious check when implementation intention exists", () => {
    expect(makeItObvious(basePlan.tasks[0]).passed).toBe(true);
  });

  it("autofixes missing two-minute start", () => {
    const result = makeItEasy({ ...basePlan.tasks[0], two_minute_start: "" });
    expect(result.passed).toBe(false);
    expect(result.autoFix?.two_minute_start).toContain("Open your workspace");
  });

  it("autofixes deep work app rules", () => {
    const attractive = makeItAttractive({ ...basePlan.tasks[0], app_rules: [] });
    const hard = makeItHard({ ...basePlan.tasks[0], app_rules: [] });
    expect(attractive.autoFix?.app_rules?.length).toBeGreaterThan(0);
    expect(hard.autoFix?.app_rules?.length).toBeGreaterThan(0);
  });

  it("returns a validated plan with autofixes applied", () => {
    const plan = {
      ...basePlan,
      tasks: [
        {
          ...basePlan.tasks[0],
          implementation_intention: "",
          app_rules: [],
          two_minute_start: "",
        },
      ],
    };

    const validated = validateTaskPlan(plan);
    expect(validated.tasks[0].implementation_intention.length).toBeGreaterThan(0);
    expect(validated.tasks[0].app_rules.length).toBeGreaterThan(0);
    expect(validated.tasks[0].two_minute_start.length).toBeGreaterThan(0);
  });
});
