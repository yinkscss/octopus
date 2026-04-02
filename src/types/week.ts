import type { TaskPlan } from "./taskPlan";

export interface AlarmSyncStatus {
  scheduledCount: number;
  failedCount: number;
  lastSyncAt: string;
}

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
  alarmSync: AlarmSyncStatus | null;
}
