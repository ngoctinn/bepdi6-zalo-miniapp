import { setStorage, getStorage, removeStorage } from "zmp-sdk/apis";

/**
 * Native storage wrapper for Zalo Mini App.
 * Uses dual-layer persistence (localStorage + zmp-sdk native storage)
 * so that state survives webview restarts, cache purges, and native app suspension.
 */

export async function nativeStorageSet(
  key: string,
  value: string,
): Promise<void> {
  // Always update browser localStorage synchronously if available
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore localStorage errors (e.g. private mode or quota exceeded)
  }

  // Persist to ZMP native storage
  try {
    await setStorage({ data: { [key]: value } });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[storage] Failed to set native key "${key}":`, error);
    }
  }
}

export async function nativeStorageGet(key: string): Promise<string | null> {
  // 1. Try native storage first (authoritative on mobile client)
  try {
    const result = await getStorage({ keys: [key] });
    if (result && result[key] !== undefined && result[key] !== null) {
      const val = String(result[key]);
      // Sync back to localStorage for faster synchronous access
      try {
        localStorage.setItem(key, val);
      } catch {
        // Ignore
      }
      return val;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[storage] Failed to get native key "${key}":`, error);
    }
  }

  // 2. Fallback to localStorage
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function nativeStorageRemove(key: string): Promise<void> {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }

  try {
    await removeStorage({ keys: [key] });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[storage] Failed to remove native key "${key}":`, error);
    }
  }
}
