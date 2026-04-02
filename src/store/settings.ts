import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

export type ProviderName = "claude" | "openai";

interface SettingsState {
  primaryProvider: ProviderName;
  fallbackProvider: ProviderName | null;
  apiKeys: { claude?: string; openai?: string };
  setProvider: (primary: ProviderName, fallback?: ProviderName | null) => void;
  setApiKeys: (keys: { claude?: string; openai?: string }) => void;
  loadApiKeys: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  primaryProvider: "claude",
  fallbackProvider: null,
  apiKeys: {},
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
}));
