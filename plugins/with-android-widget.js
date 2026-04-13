const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin — injects Splish widget receivers into AndroidManifest.xml.
 * This runs during `expo prebuild` so our changes survive regeneration.
 */
function addWidgetReceivers(androidManifest) {
  const application = androidManifest.manifest.application[0];
  if (!application.receiver) application.receiver = [];

  const WIDGETS = [
    { name: '.widget.SplishWidget',       label: 'Splish (Small)',  resource: '@xml/widget_info_small' },
    { name: '.widget.SplishWidgetMedium', label: 'Splish (Medium)', resource: '@xml/widget_info_medium' },
  ];

  for (const w of WIDGETS) {
    const alreadyAdded = application.receiver.some(
      (r) => r.$?.['android:name'] === w.name
    );
    if (alreadyAdded) continue;

    application.receiver.push({
      $: {
        'android:name': w.name,
        'android:exported': 'true',
        'android:label': w.label,
      },
      'intent-filter': [
        {
          action: [
            { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
          ],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': w.resource,
          },
        },
      ],
    });
  }

  return androidManifest;
}

module.exports = function withAndroidWidget(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addWidgetReceivers(config.modResults);
    return config;
  });
};
