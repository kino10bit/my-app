const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for WatermelonDB
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

// Add the db extension for SQLite files
config.resolver.assetExts.push('db');

// Configure resolver for web platform compatibility
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Platform-specific module resolution
config.resolver.alias = {
  ...config.resolver.alias,
  // Completely exclude Node.js modules for web builds
  'better-sqlite3': require.resolve('./src/utils/empty-module.js'),
  'fs': require.resolve('./src/utils/empty-module.js'),
  'path': require.resolve('./src/utils/empty-module.js'),
};

// More comprehensive module exclusion for web
config.resolver.blockList = [
  // Block better-sqlite3 completely
  /node_modules\/better-sqlite3\/.*/,
  // Block SQLite Node.js specific modules
  /node_modules\/@nozbe\/watermelondb\/adapters\/sqlite\/sqlite-node\/.*/,
  // Block any SQLite native dependencies
  /node_modules\/@nozbe\/watermelondb\/.*\/sqlite-node\/.*/,
];

module.exports = config;