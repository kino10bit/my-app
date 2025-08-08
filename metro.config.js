const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for WatermelonDB
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

// Add the db extension for SQLite files
config.resolver.assetExts.push('db');

// Configure resolver for web platform compatibility
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Comprehensive module aliasing for web builds
config.resolver.alias = {
  ...config.resolver.alias,
  // Replace Node.js modules with empty modules
  'better-sqlite3': require.resolve('./src/utils/empty-module.js'),
  'fs': require.resolve('./src/utils/empty-module.js'),
  'path': require.resolve('./src/utils/empty-module.js'),
  // Replace entire SQLite adapter with LokiJS for web
  '@nozbe/watermelondb/adapters/sqlite': require.resolve('./src/utils/empty-module.js'),
  '@nozbe/watermelondb/adapters/sqlite/index': require.resolve('./src/utils/empty-module.js'),
};

// Platform-specific module resolution function
config.resolver.resolverMainFields = (platform) => {
  if (platform === 'web') {
    return ['browser', 'main'];
  }
  return ['react-native', 'main'];
};

// Comprehensive module exclusion
config.resolver.blockList = [
  // Block better-sqlite3 and related modules
  /node_modules\/better-sqlite3\/.*/,
  // Block all SQLite Node.js specific code
  /node_modules\/@nozbe\/watermelondb\/adapters\/sqlite\/sqlite-node\/.*/,
  /node_modules\/@nozbe\/watermelondb\/adapters\/sqlite\/.*sqlite-node.*/,
  // Block the entire SQLite adapter directory for web
  ...(process.env.EXPO_PLATFORM === 'web' ? [
    /node_modules\/@nozbe\/watermelondb\/adapters\/sqlite\/.*/,
  ] : []),
];

module.exports = config;