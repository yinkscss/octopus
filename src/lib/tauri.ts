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
    throw error;
  }
}
