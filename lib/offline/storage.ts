// Utility functions for safe storage access in SSR/SSG environments

export function getLocalStorageItem(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn("localStorage access failed:", error);
    return null;
  }
}

export function setLocalStorageItem(key: string, value: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn("localStorage write failed:", error);
    return false;
  }
}

export function removeLocalStorageItem(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn("localStorage remove failed:", error);
    return false;
  }
}

export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}
