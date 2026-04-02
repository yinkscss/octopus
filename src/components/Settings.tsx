import { invoke } from "@tauri-apps/api";
import { useEffect, useState } from "react";
import { useSettingsStore, type ProviderName } from "../store/settings";

const providerOptions: Array<{ value: ProviderName; label: string }> = [
  { value: "claude", label: "Claude" },
  { value: "openai", label: "OpenAI" },
];

export default function Settings() {
  const {
    primaryProvider,
    fallbackProvider,
    apiKeys,
    setProvider,
    loadApiKeys,
    setApiKeys,
  } = useSettingsStore();
  const [claudeKey, setClaudeKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadApiKeys().catch((error) => {
      setStatus(`Failed to load keys: ${String(error)}`);
    });
  }, [loadApiKeys]);

  useEffect(() => {
    setClaudeKey(apiKeys.claude ?? "");
    setOpenaiKey(apiKeys.openai ?? "");
  }, [apiKeys.claude, apiKeys.openai]);

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      await invoke("set_api_key", { provider: "claude", key: claudeKey });
      await invoke("set_api_key", { provider: "openai", key: openaiKey });
      setApiKeys({ claude: claudeKey, openai: openaiKey });
      setStatus("API keys saved to Keychain.");
    } catch (error) {
      setStatus(`Save failed: ${String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="screen">
      <div className="section">
        <label className="label" htmlFor="claude-key">
          Claude API Key
        </label>
        <input
          id="claude-key"
          className="input"
          type="password"
          value={claudeKey}
          onChange={(event) => setClaudeKey(event.target.value)}
          placeholder="sk-ant-..."
        />
      </div>

      <div className="section">
        <label className="label" htmlFor="openai-key">
          OpenAI API Key
        </label>
        <input
          id="openai-key"
          className="input"
          type="password"
          value={openaiKey}
          onChange={(event) => setOpenaiKey(event.target.value)}
          placeholder="sk-..."
        />
      </div>

      <div className="section">
        <label className="label" htmlFor="primary-provider">
          Primary Provider
        </label>
        <select
          id="primary-provider"
          className="select"
          value={primaryProvider}
          onChange={(event) => {
            const nextPrimary = event.target.value as ProviderName;
            const nextFallback =
              fallbackProvider === nextPrimary ? null : fallbackProvider;
            setProvider(nextPrimary, nextFallback);
          }}
        >
          {providerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="section">
        <label className="label" htmlFor="fallback-provider">
          Fallback Provider
        </label>
        <select
          id="fallback-provider"
          className="select"
          value={fallbackProvider ?? "none"}
          onChange={(event) => {
            const value = event.target.value;
            setProvider(
              primaryProvider,
              value === "none" ? null : (value as ProviderName)
            );
          }}
        >
          <option value="none">None</option>
          {providerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button className="button" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </button>

      {status && <p className="status">{status}</p>}
      <p className="hint">API keys are stored in macOS Keychain.</p>
    </div>
  );
}
