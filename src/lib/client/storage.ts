/**
 * Safe Browser Storage Wrapper
 * Prevents SSR errors and provides a consistent API for localStorage/sessionStorage
 */

/**
 * Checks if the browser storage is available
 */
const isBrowser = typeof window !== 'undefined';

export const storage = {
  /**
   * Get an item from localStorage
   */
  get<T>(key: string, defaultValue: T | null = null): T | null {
    if (!isBrowser) return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Set an item in localStorage
   */
  set<T>(key: string, value: T): void {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error);
    }
  },

  /**
   * Remove an item from localStorage
   */
  remove(key: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  },

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    if (!isBrowser) return;
    try {
      window.localStorage.clear();
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
  },

  /**
   * Session Storage helpers
   */
  session: {
    get<T>(key: string, defaultValue: T | null = null): T | null {
      if (!isBrowser) return defaultValue;
      try {
        const item = window.sessionStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : defaultValue;
      } catch (_error) {
        return defaultValue;
      }
    },
    set<T>(key: string, value: T): void {
      if (!isBrowser) return;
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch (_error) {}
    },
  },
};
