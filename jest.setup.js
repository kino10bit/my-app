// Mock Expo modules
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        playAsync: jest.fn(),
        unloadAsync: jest.fn(),
      })),
    },
    setAudioModeAsync: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

// Mock WatermelonDB
jest.mock('@nozbe/watermelondb', () => ({
  Database: jest.fn(),
  Collection: jest.fn(),
  Model: jest.fn(),
  tableSchema: jest.fn(),
  appSchema: jest.fn(),
}));

jest.mock('@nozbe/watermelondb/adapters/sqlite', () => ({
  default: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((options) => options.ios),
  },
}));

// Global test setup
global.__DEV__ = true;