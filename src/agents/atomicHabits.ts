import { PlannerValidationError } from "../types/errors";
import type { Task, TaskPlan } from "../types/taskPlan";

interface ValidationResult {
  passed: boolean;
  reason?: string;
  autoFix?: Partial<Task>;
}

export const makeItObvious = (task: Task): ValidationResult => {
  if (task.implementation_intention.trim()) {
    return { passed: true };
  }

  if (task.time_block) {
    return {
      passed: false,
      reason: "Missing implementation intention",
      autoFix: {
        implementation_intention: `When it is ${task.time_block}, I will ${task.title}.`,
      },
    };
  }

  return {
    passed: false,
    reason: "Missing implementation intention",
  };
};

export const makeItAttractive = (task: Task): ValidationResult => {
  if (task.type !== "deep_work") {
    return { passed: true };
  }

  if (task.app_rules.length > 0) {
    return { passed: true };
  }

  return {
    passed: false,
    reason: "Deep work block missing app rules",
    autoFix: {
      app_rules: ["Twitter", "YouTube", "Discord", "Slack"],
    },
  };
};

export const makeItEasy = (task: Task): ValidationResult => {
  if (task.two_minute_start.trim()) {
    return { passed: true };
  }

  return {
    passed: false,
    reason: "Missing two-minute start",
    autoFix: {
      two_minute_start: `Open your workspace and write the first sentence for ${task.title}.`,
    },
  };
};

export const makeItHard = (task: Task): ValidationResult => {
  if (task.type !== "deep_work") {
    return { passed: true };
  }

  if (task.app_rules.length > 0) {
    return { passed: true };
  }

  return {
    passed: false,
    reason: "Deep work task has no friction rules",
    autoFix: {
      app_rules: ["Twitter", "YouTube", "Safari", "Messages"],
    },
  };
};

const applyRule = (task: Task, rule: (task: Task) => ValidationResult): Task => {
  const result = rule(task);
  if (result.passed) {
    return task;
  }

  if (!result.autoFix) {
    throw new PlannerValidationError(result.reason ?? "Task failed Atomic Habits validation");
  }

  return {
    ...task,
    ...result.autoFix,
  };
};

export const validateTaskPlan = (plan: TaskPlan): TaskPlan => {
  const tasks = plan.tasks.map((task) => {
    const obvious = applyRule(task, makeItObvious);
    const attractive = applyRule(obvious, makeItAttractive);
    const easy = applyRule(attractive, makeItEasy);
    return applyRule(easy, makeItHard);
  });

  return {
    ...plan,
    tasks,
  };
};
