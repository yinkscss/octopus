import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import { COMMANDS } from "../lib/commands";
import type { AlarmDaemonStatus, AlarmScheduleReport } from "../types/alarm";

export type ProviderName = "claude" | "openai";

interface SettingsState {
  primaryProvider: ProviderName;
  fallbackProvider: ProviderName | null;
  apiKeys: { claude?: string; openai?: string };
  alarmDaemon: AlarmDaemonStatus | null;
  lastAlarmSyncAt: string | null;
  setProvider: (primary: ProviderName, fallback?: ProviderName | null) => void;
  setApiKeys: (keys: { claude?: string; openai?: string }) => void;
  loadApiKeys: () => Promise<void>;
  refreshAlarmDaemon: () => Promise<void>;
  resyncAlarms: () => Promise<AlarmScheduleReport>;
  ensureAlarmLaunchAgent: () => Promise<string>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  primaryProvider: "claude",
  fallbackProvider: null,
  apiKeys: {},
  alarmDaemon: null,
  lastAlarmSyncAt: null,
  setProvider: (primary, fallback = null) =>
    set({ primaryProvider: primary, fallbackProvider: fallback }),
  setApiKeys: (keys) => set({ apiKeys: keys }),
  loadApiKeys: async () => {
    const [claude, openai] = await Promise.all([
      invoke<string>("get_api_key", { provider: "claude" }),
      invoke<string>("get_api_key", { provider: "openai" }),
    ]);

    set({
      apiKeys: {
        claude: claude || undefined,
        openai: openai || undefined,
      },
    });
  },
  refreshAlarmDaemon: async () => {
    const daemon = await invoke<AlarmDaemonStatus>(COMMANDS.getAlarmDaemonStatus);
    set({ alarmDaemon: daemon });
  },
  resyncAlarms: async () => {
    const report = await invoke<AlarmScheduleReport>(COMMANDS.reschedulePendingAlarms);
    set({
      lastAlarmSyncAt: report.last_sync_at,
    });
    return report;
  },
  ensureAlarmLaunchAgent: async () => {
    return invoke<string>(COMMANDS.ensureAlarmLaunchAgent);
  },
}));
