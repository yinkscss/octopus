import type { TaskPlan } from "./taskPlan";

export interface WeeklyIntentInput {
  rawGoals: string;
  identityStatement: string;
}

export interface WeekState {
  activeWeekStart: string;
  currentPlan: TaskPlan | null;
  isLoading: boolean;
  isFallbackPlan: boolean;
  lastError: string | null;
}
