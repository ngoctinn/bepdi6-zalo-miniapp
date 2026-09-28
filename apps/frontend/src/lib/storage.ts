import { setStorage, getStorage, removeStorage } from "zmp-sdk/apis";

/**
 * Native storage wrapper for Zalo Mini App.
 * Uses zmp-sdk native storage (persists across webview restarts)
 * instead of volatile browser localStorage.
 */
export async function nativeStorageSet(
  key: string,
  value: string,
): Promise<void> {
  try {
    await setStorage({ data: { [key]: value } });
  } catch (error) {
    console.warn(`[storage] Failed to set key "${key}":`, error);
    // Fallback to localStorage in dev environment
    if (import.meta.env.DEV) {
      localStorage.setItem(key, value);
    }
  }
}

export async function nativeStorageGet(key: string): Promise<string | null> {
  try {
    const result = await getStorage({ keys: [key] });
    return result?.[key] ?? null;
  } catch (error) {
    console.warn(`[storage] Failed to get key "${key}":`, error);
    // Fallback to localStorage in dev environment
    if (import.meta.env.DEV) {
      return localStorage.getItem(key);
    }
    return null;
  }
}

export async function nativeStorageRemove(key: string): Promise<void> {
  try {
    await removeStorage({ keys: [key] });
  } catch (error) {
    console.warn(`[storage] Failed to remove key "${key}":`, error);
    if (import.meta.env.DEV) {
      localStorage.removeItem(key);
    }
  }
}
