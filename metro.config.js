const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for WatermelonDB
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

// Add the db extension for SQLite files
config.resolver.assetExts.push('db');

module.exports = config;