const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

const APP_GROUP = 'group.io.splish.app';

/**
 * Expo config plugin — adds the App Groups entitlement required for
 * sharing data between the main app and the SplishWidget extension.
 * Also ensures the NSCameraUsageDescription is in Info.plist.
 */
module.exports = function withIosAppGroups(config) {
  // 1. Add App Groups entitlement
  config = withEntitlementsPlist(config, (config) => {
    const groups = config.modResults['com.apple.security.application-groups'] ?? [];
    if (!groups.includes(APP_GROUP)) {
      groups.push(APP_GROUP);
    }
    config.modResults['com.apple.security.application-groups'] = groups;
    return config;
  });

  // 2. Ensure required Info.plist keys are present
  config = withInfoPlist(config, (config) => {
    if (!config.modResults.NSCameraUsageDescription) {
      config.modResults.NSCameraUsageDescription =
        'Splish uses your camera to verify you\'ve drunk water in Hard Mode.';
    }
    return config;
  });

  return config;
};
