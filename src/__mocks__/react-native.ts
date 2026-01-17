// Mock React Native modules for testing
export const Platform = {
  OS: 'ios',
  select: (obj: Record<string, unknown>) => obj.ios,
};

export const NativeModules = {
  AppGroupStore: {
    setString: jest.fn(),
    getString: jest.fn().mockResolvedValue(null),
  },
};

export default {
  Platform,
  NativeModules,
};
