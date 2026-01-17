// Mock MMKV storage for testing
const mockStorage = new Map<string, string>();

export const createMMKV = jest.fn(() => ({
  getString: (key: string) => mockStorage.get(key) ?? undefined,
  set: (key: string, value: string) => mockStorage.set(key, value),
  delete: (key: string) => mockStorage.delete(key),
  clearAll: () => mockStorage.clear(),
  getAllKeys: () => Array.from(mockStorage.keys()),
}));

// Helper for tests to reset storage
export const __resetMockStorage = () => mockStorage.clear();
export const __getMockStorage = () => mockStorage;
