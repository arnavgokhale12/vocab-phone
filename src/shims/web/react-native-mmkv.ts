/**
 * Web shim for react-native-mmkv.
 * Uses localStorage as the backing store, namespaced by the MMKV instance id.
 */

interface MMKVOptions {
  id?: string;
}

interface MMKVInstance {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  clearAll: () => void;
  getAllKeys: () => string[];
}

export function createMMKV(options?: MMKVOptions): MMKVInstance {
  const prefix = options?.id ? `mmkv_${options.id}_` : 'mmkv_default_';

  return {
    getString(key: string): string | undefined {
      try {
        const value = localStorage.getItem(prefix + key);
        return value === null ? undefined : value;
      } catch {
        return undefined;
      }
    },

    set(key: string, value: string): void {
      try {
        localStorage.setItem(prefix + key, value);
      } catch {
        // Storage quota exceeded or other error
      }
    },

    delete(key: string): void {
      try {
        localStorage.removeItem(prefix + key);
      } catch {
        // ignore
      }
    },

    clearAll(): void {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {
        // ignore
      }
    },

    getAllKeys(): string[] {
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            keys.push(k.slice(prefix.length));
          }
        }
        return keys;
      } catch {
        return [];
      }
    },
  };
}
