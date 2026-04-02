import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import { z } from "zod";
import { ClaudeProvider } from "../llm/claude";
import { OpenAIProvider } from "../llm/openai";
import { LLMRouter } from "../llm/router";
import type { AgentConfig } from "../llm/provider";
import { useSettingsStore, type ProviderName } from "./settings";

interface LLMState {
  router: LLMRouter | null;
  isLoading: boolean;
  lastResponse: string | null;
  error: string | null;
  initRouter: () => void;
  setLastResponse: (response: string | null) => void;
  sendPrompt: (prompt: string) => Promise<void>;
}

const responseSchema = z.object({ response: z.string() });

const defaultConfig: AgentConfig = {
  maxTokens: 400,
  temperature: 0.3,
  timeout: 5000,
};

const createProvider = (provider: ProviderName) =>
  provider === "claude" ? new ClaudeProvider() : new OpenAIProvider();

const createRouter = () => {
  const { primaryProvider, fallbackProvider } = useSettingsStore.getState();
  return new LLMRouter(
    createProvider(primaryProvider),
    fallbackProvider ? createProvider(fallbackProvider) : undefined
  );
};

export const useLLMStore = create<LLMState>((set) => ({
  router: null,
  isLoading: false,
  lastResponse: null,
  error: null,
  initRouter: () => {
    set({ router: createRouter() });
  },
  setLastResponse: (response) => set({ lastResponse: response }),
  sendPrompt: async (prompt: string) => {
    if (!prompt.trim()) {
      set({ error: "Prompt cannot be empty." });
      return;
    }

    const router = createRouter();
    set({ isLoading: true, error: null, router });

    try {
      const systemPrompt =
        "Respond ONLY with valid JSON: { \"response\": \"<answer>\" }.";
      const result = await router.callWithFallback(
        systemPrompt,
        prompt,
        defaultConfig,
        responseSchema
      );

      set({ lastResponse: result.response, isLoading: false });
      await invoke("store_llm_response", { response: result.response });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message, isLoading: false });
    }
  },
}));
