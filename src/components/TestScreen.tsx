import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useLLMStore } from "../store/llm";
import { useSettingsStore, type ProviderName } from "../store/settings";

const providerLabels: Record<ProviderName, string> = {
  claude: "Claude",
  openai: "OpenAI",
};

export default function TestScreen() {
  const { primaryProvider, fallbackProvider, setProvider } =
    useSettingsStore();
  const { isLoading, lastResponse, error, sendPrompt, setLastResponse } =
    useLLMStore();
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    invoke<string | null>("get_last_llm_response")
      .then((response) => {
        if (response) {
          setLastResponse(response);
        }
      })
      .catch((err) => {
        console.error("[TestScreen] Failed to load last response:", err);
      });
  }, []);

  return (
    <div className="screen">
      <div className="section">
        <label className="label" htmlFor="prompt">
          Enter prompt
        </label>
        <textarea
          id="prompt"
          className="textarea"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Say hello in exactly 3 words"
        />
      </div>

      <div className="section">
        <label className="label" htmlFor="provider">
          Select Provider
        </label>
        <select
          id="provider"
          className="select"
          value={primaryProvider}
          onChange={(event) => {
            const nextPrimary = event.target.value as ProviderName;
            const nextFallback =
              fallbackProvider === nextPrimary ? null : fallbackProvider;
            setProvider(nextPrimary, nextFallback);
          }}
        >
          {Object.entries(providerLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <button
        className="button"
        onClick={() => void sendPrompt(prompt)}
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send to LLM"}
      </button>

      {error && <p className="error">{error}</p>}

      <div className="section">
        <label className="label" htmlFor="response">
          Response
        </label>
        <textarea
          id="response"
          className="textarea response"
          readOnly
          value={lastResponse ?? ""}
          placeholder="No response yet."
        />
      </div>
    </div>
  );
}
