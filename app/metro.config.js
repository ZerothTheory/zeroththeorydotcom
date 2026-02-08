const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package exports for ESM packages (three, postprocessing, etc.)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
