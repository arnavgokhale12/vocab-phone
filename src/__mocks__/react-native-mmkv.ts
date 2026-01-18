// Mock MMKV storage for testing
// Using a global to ensure the same Map is shared across all imports
const globalKey = '__MMKV_MOCK_STORAGE__';
(global as Record<string, unknown>)[globalKey] = (global as Record<string, unknown>)[globalKey] || new Map<string, string>();

function getMockStorage(): Map<string, string> {
  return (global as Record<string, unknown>)[globalKey] as Map<string, string>;
}

export const createMMKV = jest.fn(() => ({
  getString: (key: string) => getMockStorage().get(key) ?? undefined,
  set: (key: string, value: string) => getMockStorage().set(key, value),
  delete: (key: string) => getMockStorage().delete(key),
  clearAll: () => getMockStorage().clear(),
  getAllKeys: () => Array.from(getMockStorage().keys()),
}));

// Helper for tests to reset storage
export const __resetMockStorage = () => getMockStorage().clear();
export const __getMockStorage = () => getMockStorage();
