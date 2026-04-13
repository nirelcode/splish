const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withHardMode(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // ── Permissions ──────────────────────────────────────────────────────────
    if (!manifest['uses-permission']) manifest['uses-permission'] = [];
    const perms = manifest['uses-permission'];

    function addPerm(name) {
      if (!perms.find((p) => p.$?.['android:name'] === name)) {
        perms.push({ $: { 'android:name': name } });
      }
    }

    addPerm('android.permission.SYSTEM_ALERT_WINDOW');
    addPerm('android.permission.FOREGROUND_SERVICE');
    addPerm('android.permission.FOREGROUND_SERVICE_SPECIAL_USE');
    // PACKAGE_USAGE_STATS is a protected permission — tools:ignore prevents build tools stripping it
    if (!perms.find((p) => p.$?.['android:name'] === 'android.permission.PACKAGE_USAGE_STATS')) {
      perms.push({
        $: {
          'android:name': 'android.permission.PACKAGE_USAGE_STATS',
          'tools:ignore': 'ProtectedPermissions',
        },
      });
    }

    // Ensure tools namespace is declared on the manifest root
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // ── Service registration ─────────────────────────────────────────────────
    const app = manifest.application[0];
    if (!app.service) app.service = [];

    const svcName = 'expo.modules.hardmode.HardModeLockService';
    if (!app.service.find((s) => s.$?.['android:name'] === svcName)) {
      app.service.push({
        $: {
          'android:name': svcName,
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        property: [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value': 'Displays a full-screen overlay to remind the user to drink water',
            },
          },
        ],
      });
    }

    return config;
  });
};
