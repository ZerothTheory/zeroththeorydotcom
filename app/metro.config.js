const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Do NOT enable unstable_enablePackageExports — it causes ESM resolution
// which brings in import.meta.env usage from zustand and others.
// Metro's default CJS resolution works fine for our deps.

module.exports = config;
