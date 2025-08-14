const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Web プラットフォーム検出
const isWeb = process.env.EXPO_PLATFORM === 'web' || process.argv.includes('--web');

// Add support for WatermelonDB
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

// Add the db extension for SQLite files
config.resolver.assetExts.push('db');

// Comprehensive module aliasing - conditional based on platform
config.resolver.alias = {
  ...config.resolver.alias,
  // Always alias these Node.js specific modules for web
  'better-sqlite3': require.resolve('./src/utils/empty-module.js'),
  'fs': require.resolve('./src/utils/empty-module.js'), 
  'path': require.resolve('./src/utils/empty-module.js'),
  // Completely replace WatermelonDB SQLite adapter with empty module
  '@nozbe/watermelondb/adapters/sqlite': require.resolve('./src/utils/empty-module.js'),
  '@nozbe/watermelondb/adapters/sqlite/index': require.resolve('./src/utils/empty-module.js'),
  '@nozbe/watermelondb/adapters/sqlite/makeDispatcher': require.resolve('./src/utils/empty-module.js'),
  '@nozbe/watermelondb/adapters/sqlite/makeDispatcher/index': require.resolve('./src/utils/empty-module.js'),
  '@nozbe/watermelondb/adapters/sqlite/sqlite-node/Database': require.resolve('./src/utils/empty-module.js'),
  '@nozbe/watermelondb/adapters/sqlite/sqlite-node/DatabaseBridge': require.resolve('./src/utils/empty-module.js'),
  '@nozbe/watermelondb/adapters/sqlite/sqlite-node': require.resolve('./src/utils/empty-module.js'),
  '@nozbe/watermelondb/adapters/sqlite/sqlite-node/index': require.resolve('./src/utils/empty-module.js'),
  // Force all SQLite references to empty module
  ...(isWeb ? {
    '@nozbe/watermelondb/adapters/sqlite': require.resolve('./src/utils/empty-module.js'),
  } : {}),
  // Explicit tslib resolution
  'tslib': require.resolve('tslib'),
};

// Set resolverMainFields as an array instead of function
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Custom resolver to handle WatermelonDB SQLite modules
config.resolver.resolverModules = [
  'node_modules',
  ...config.resolver.resolverModules || [],
];

// Add custom resolverRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // If this is a WatermelonDB SQLite-related module, return empty module
  if (platform === 'web' && (
    moduleName.includes('@nozbe/watermelondb/adapters/sqlite') ||
    moduleName.includes('sqlite-node') ||
    moduleName.includes('DatabaseBridge') ||
    moduleName.includes('better-sqlite3')
  )) {
    return {
      filePath: require.resolve('./src/utils/empty-module.js'),
      type: 'sourceFile',
    };
  }
  
  // Fallback to default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// Platform-specific resolver
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

// Comprehensive module exclusion - Always block SQLite for web
config.resolver.blockList = [
  // Block better-sqlite3 completely
  /node_modules\/better-sqlite3\/.*/,
  // Block entire SQLite adapter directory 
  /node_modules\/@nozbe\/watermelondb\/adapters\/sqlite\/.*/,
  // Block specific SQLite files
  /.*sqlite-node.*/,
  /.*Database\.js.*sqlite/,
];

module.exports = config;