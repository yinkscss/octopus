/**
 * Tauri API wrapper using window.__TAURI__ global
 * This is more reliable than ES module imports in some Tauri v2 configurations
 */

declare global {
  interface Window {
    __TAURI_INTERNALS__?: {
      invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
    };
  }
}

function normalizeInvokeError(cmd: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (/Command\s+.+\s+not\s+found/i.test(message)) {
    return new Error(
      `Backend command '${cmd}' is unavailable in the current Tauri session. ` +
        "Restart dev runtime with a clean session (stop stale Vite/Tauri processes, then run npm run tauri dev)."
    );
  }

  return error instanceof Error ? error : new Error(message);
}

export async function invoke<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    throw new Error("Tauri: window is not defined (not in browser environment)");
  }

  // Check if __TAURI_INTERNALS__ is available
  if (!window.__TAURI_INTERNALS__) {
    console.error("window.__TAURI_INTERNALS__ is undefined");
    console.error("window keys:", Object.keys(window));
    throw new Error(
      "Tauri: __TAURI_INTERNALS__ is not available. Make sure you're running in a Tauri app."
    );
  }

  try {
    return await window.__TAURI_INTERNALS__.invoke<T>(cmd, args);
  } catch (error) {
    console.error(`Tauri invoke error for command "${cmd}":`, error);
    throw normalizeInvokeError(cmd, error);
  }
}
