import { invoke } from "../lib/tauri";
import { useEffect, useState } from "react";
import {
  active,
} from "@tauri-apps/plugin-notification";
import { COMMANDS } from "../lib/commands";
import { useSettingsStore, type ProviderName } from "../store/settings";

type NativePermissionState = "granted" | "denied" | "prompt" | "default";

const getNativeNotificationPermission = async (): Promise<NativePermissionState> => {
  const granted = await invoke<boolean>("plugin:notification|is_permission_granted");
  return granted ? "granted" : "denied";
};

const requestNativeNotificationPermission = async (): Promise<NativePermissionState> => {
  return invoke<NativePermissionState>("plugin:notification|request_permission");
};

const providerOptions: Array<{ value: ProviderName; label: string }> = [
  { value: "claude", label: "Claude" },
  { value: "openai", label: "OpenAI" },
];

export default function Settings() {
  const {
    primaryProvider,
    fallbackProvider,
    apiKeys,
    alarmDaemon,
    lastAlarmSyncAt,
    setProvider,
    loadApiKeys,
    setApiKeys,
    refreshAlarmDaemon,
    resyncAlarms,
    ensureAlarmLaunchAgent,
  } = useSettingsStore();
  const [claudeKey, setClaudeKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    "unknown" | "granted" | "denied" | "prompt" | "default"
  >("unknown");

  useEffect(() => {
    loadApiKeys().catch((error) => {
      setStatus(`Failed to load keys: ${String(error)}`);
    });
    refreshAlarmDaemon().catch((error) => {
      setStatus(`Failed to load alarm daemon status: ${String(error)}`);
    });
    getNativeNotificationPermission()
      .then((state) => {
        setNotificationPermission(state);
      })
      .catch((error) => {
        setStatus(`Failed to read notification permission: ${String(error)}`);
      });
  }, [loadApiKeys, refreshAlarmDaemon]);

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

  const handleResyncAlarms = async () => {
    setStatus(null);
    try {
      const report = await resyncAlarms();
      setStatus(
        `Alarm sync completed: ${report.scheduled_count} scheduled, ${report.failed_count} failed.`
      );
      await refreshAlarmDaemon();
    } catch (error) {
      setStatus(`Alarm sync failed: ${String(error)}`);
    }
  };

  const handleEnsureLaunchAgent = async () => {
    setStatus(null);
    try {
      const plistPath = await ensureAlarmLaunchAgent();
      setStatus(`LaunchAgent configured at ${plistPath}.`);
    } catch (error) {
      setStatus(`Failed to configure LaunchAgent: ${String(error)}`);
    }
  };

  const handleRequestNotificationPermission = async () => {
    setStatus(null);
    try {
      const permission = await requestNativeNotificationPermission();
      const granted = permission === "granted";
      setNotificationPermission(permission);
      setStatus(
        granted
          ? "Native notification permission granted."
          : `Native notification permission is ${permission}.`
      );
    } catch (error) {
      setStatus(`Failed to request notification permission: ${String(error)}`);
    }
  };

  const handleSendTestNotification = async () => {
    setStatus(null);
    try {
      const permission = await getNativeNotificationPermission();
      const granted = permission === "granted";
      setNotificationPermission(permission);

      if (!granted) {
        setStatus(
          "Native notifications are not granted. Click 'Request Notification Permission' first."
        );
        return;
      }

      await invoke<void>(COMMANDS.sendNativeTestNotification);

      // Best-effort visibility check for debugging.
      const activeNotifications = await active().catch(() => []);
      setStatus(
        `Native test notification sent. Active notifications reported by plugin: ${activeNotifications.length}.`
      );
    } catch (error) {
      setStatus(`Failed to send test notification: ${String(error)}`);
    }
  };

  const handleOpenNotificationSettings = async () => {
    setStatus(null);
    try {
      await invoke<void>(COMMANDS.openMacOSNotificationSettings);
      setStatus("Opened macOS Notifications settings.");
    } catch (error) {
      setStatus(`Failed to open macOS Notifications settings: ${String(error)}`);
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

      <div className="section">
        <p className="label">Alarm Daemon</p>
        <p className="hint">
          Status: {alarmDaemon ? (alarmDaemon.running ? "running" : "stopped") : "unknown"}
          {alarmDaemon ? `, queued jobs ${alarmDaemon.scheduled_jobs}` : ""}
        </p>
        {lastAlarmSyncAt && <p className="hint">Last alarm sync: {lastAlarmSyncAt}</p>}
        <div className="row" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="button secondary" onClick={() => void handleResyncAlarms()}>
            Resync Alarms
          </button>
          <button className="button secondary" onClick={() => void handleEnsureLaunchAgent()}>
            Ensure LaunchAgent
          </button>
        </div>
      </div>

      <div className="section">
        <p className="label">Notification Diagnostics</p>
        <p className="hint">Permission: {notificationPermission}</p>
        <p className="hint">
          This panel uses native plugin permission commands and native Rust notification dispatch.
        </p>
        <div className="row" style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            className="button secondary"
            onClick={() => void handleRequestNotificationPermission()}
          >
            Request Notification Permission
          </button>
          <button
            className="button secondary"
            onClick={() => void handleSendTestNotification()}
          >
            Send Test Notification
          </button>
          <button
            className="button secondary"
            onClick={() => void handleOpenNotificationSettings()}
          >
            Open Notification Settings
          </button>
        </div>
      </div>

      {status && <p className="status">{status}</p>}
      <p className="hint">API keys are stored in macOS Keychain.</p>
    </div>
  );
}
