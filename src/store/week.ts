import { create } from "zustand";
import { decomposeWeeklyGoals } from "../agents/goalDecomposer";
import { COMMANDS } from "../lib/commands";
import { invoke } from "../lib/tauri";
import { PlannerProviderError } from "../types/errors";
import type { AlarmActionReport, AlarmScheduleReport } from "../types/alarm";
import type { TaskPlan } from "../types/taskPlan";
import type { WeekState } from "../types/week";

interface WeekStore extends WeekState {
  submitWeeklyIntent: (rawGoals: string, identityStatement: string) => Promise<boolean>;
  loadWeekPlan: (weekStart?: string) => Promise<void>;
  markTaskComplete: (taskId: number) => Promise<void>;
  acknowledgeAlarm: (alarmId: number) => Promise<AlarmActionReport | null>;
  snoozeAlarmOnce: (alarmId: number) => Promise<AlarmActionReport | null>;
  resyncAlarms: () => Promise<void>;
  clearError: () => void;
}

const dayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const getMondayWeekStart = (date = new Date()) => {
  const copy = new Date(date);
  const currentDay = copy.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay;
  copy.setDate(copy.getDate() + diff);
  return copy.toISOString().slice(0, 10);
};

const normalizePlan = (plan: TaskPlan): TaskPlan => ({
  ...plan,
  tasks: [...plan.tasks].sort((a, b) => a.time_block.localeCompare(b.time_block)),
});

const updateTaskStatus = (plan: TaskPlan, taskId: number): TaskPlan => ({
  ...plan,
  tasks: plan.tasks.map((task) =>
    task.id === taskId ? { ...task, status: "done" } : task
  ),
});

export const getTodayName = () => dayNames[new Date().getDay()];

export const useWeekStore = create<WeekStore>((set, get) => ({
  activeWeekStart: getMondayWeekStart(),
  currentPlan: null,
  isLoading: false,
  isFallbackPlan: false,
  lastError: null,
  alarmSync: null,
  clearError: () => set({ lastError: null }),
  submitWeeklyIntent: async (rawGoals: string, identityStatement: string) => {
    const weekStart = getMondayWeekStart();

    if (!rawGoals.trim()) {
      set({ lastError: "Weekly goals cannot be empty." });
      return false;
    }

    if (!identityStatement.trim()) {
      set({ lastError: "Identity statement cannot be empty." });
      return false;
    }

    set({ isLoading: true, lastError: null, activeWeekStart: weekStart });

    try {
      const goalId = await invoke<number>(COMMANDS.createWeeklyGoal, {
        weekStart,
        rawText: rawGoals,
        identityStatement,
      });

      const plan = await decomposeWeeklyGoals({
        rawGoals,
        identityStatement,
        weekStart,
      });

      const normalizedPlan = normalizePlan(plan);

      await invoke<number>(COMMANDS.storeTaskPlan, {
        goalId,
        plan: normalizedPlan,
      });

      const alarmReport = await invoke<AlarmScheduleReport>(COMMANDS.scheduleWeekAlarms, {
        weekStart,
      });

      const persistedPlan = await invoke<TaskPlan | null>(COMMANDS.getWeekPlan, {
        weekStart,
      });

      set({
        currentPlan: persistedPlan ? normalizePlan(persistedPlan) : normalizedPlan,
        isFallbackPlan: false,
        isLoading: false,
        alarmSync: {
          scheduledCount: alarmReport.scheduled_count,
          failedCount: alarmReport.failed_count,
          lastSyncAt: alarmReport.last_sync_at,
        },
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      try {
        if (!(error instanceof PlannerProviderError)) {
          throw error;
        }

        const fallbackPlan = await invoke<TaskPlan>(COMMANDS.shiftLastPlanForward, {
          targetWeekStart: weekStart,
        });

        const alarmReport = await invoke<AlarmScheduleReport>(COMMANDS.scheduleWeekAlarms, {
          weekStart,
        });

        set({
          currentPlan: normalizePlan(fallbackPlan),
          isFallbackPlan: true,
          isLoading: false,
          lastError: "LLM unavailable. Loaded shifted plan from the previous week.",
          alarmSync: {
            scheduledCount: alarmReport.scheduled_count,
            failedCount: alarmReport.failed_count,
            lastSyncAt: alarmReport.last_sync_at,
          },
        });
        return true;
      } catch {
        set({
          isLoading: false,
          lastError: `Failed to build weekly plan: ${message}`,
        });
        return false;
      }
    }
  },
  loadWeekPlan: async (weekStart?: string) => {
    const targetWeek = weekStart ?? get().activeWeekStart;
    set({ isLoading: true, lastError: null });

    try {
      const plan = await invoke<TaskPlan | null>(COMMANDS.getWeekPlan, {
        weekStart: targetWeek,
      });

      set({
        currentPlan: plan ? normalizePlan(plan) : null,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ isLoading: false, lastError: `Failed to load plan: ${message}` });
    }
  },
  markTaskComplete: async (taskId: number) => {
    const { currentPlan } = get();

    if (!currentPlan) {
      return;
    }

    const task = currentPlan.tasks.find((entry) => entry.id === taskId);
    if (!task?.id) {
      set({ lastError: "Task is missing a persisted id; reload the week plan first." });
      return;
    }

    const previous = currentPlan;
    set({ currentPlan: updateTaskStatus(previous, task.id) });

    try {
      await invoke<number>(COMMANDS.markTaskCompleted, {
        taskId: task.id,
        durationActual: null,
        driftMinutes: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({
        currentPlan: previous,
        lastError: `Failed to mark task complete: ${message}`,
      });
    }
  },
  acknowledgeAlarm: async (alarmId: number) => {
    try {
      return await invoke<AlarmActionReport>(COMMANDS.acknowledgeAlarm, {
        alarmId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ lastError: `Failed to acknowledge alarm: ${message}` });
      return null;
    }
  },
  snoozeAlarmOnce: async (alarmId: number) => {
    try {
      return await invoke<AlarmActionReport>(COMMANDS.snoozeAlarmOnce, {
        alarmId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ lastError: `Failed to snooze alarm: ${message}` });
      return null;
    }
  },
  resyncAlarms: async () => {
    try {
      const report = await invoke<AlarmScheduleReport>(COMMANDS.reschedulePendingAlarms);
      set({
        alarmSync: {
          scheduledCount: report.scheduled_count,
          failedCount: report.failed_count,
          lastSyncAt: report.last_sync_at,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ lastError: `Failed to resync alarms: ${message}` });
    }
  },
}));
