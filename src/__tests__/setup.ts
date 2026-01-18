// Jest setup file - runs before each test file

// Reset mock storage before each test using global reference
beforeEach(() => {
  const globalKey = '__MMKV_MOCK_STORAGE__';
  const storage = (global as Record<string, unknown>)[globalKey] as Map<string, string> | undefined;
  if (storage) {
    storage.clear();
  }
});
