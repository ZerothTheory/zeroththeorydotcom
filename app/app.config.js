module.exports = { // eslint-disable-line no-undef
  name: 'zeroth-theory',
  displayName: 'Zeroth Theory',
  owner: 'michael-simoneau',
  slug: 'zeroth-doctrine',
  version: '1.0.0',
  description: '"Zeroth Theory" by Michael Simoneau',
  sdkVersion: '54.0.0',
  platforms: ['web', 'ios', 'android'],
  icon: './assets/zeroth-logo.png',
  splash: {
    image: './assets/zeroth-logo.png',
    resizeMode: 'contain',
    backgroundColor: '#000000'
  },
  updates: {
    url: 'https://u.expo.dev/8e68ff97-475a-40f0-8db1-46224f982726'
  },
  runtimeVersion: {
    policy: 'appVersion'
  },
  extra: {
    eas: {
      projectId: '8e68ff97-475a-40f0-8db1-46224f982726'
    }
  },
  web: {
    bundler: 'metro',
    output: 'hosted',
    favicon: './assets/favicon.png'
  },
  ios: {
    bundleIdentifier: 'com.michael-simoneau.zeroth-theory',
    buildNumber: '1',
    icon: {
      dark: './assets/zeroth-logo.png',
      light: './assets/zeroth-logo.png',
      monochrome: './assets/zeroth-logo.png'
    }
  },
  android: {
    package: 'com.michael-simoneau.zeroth-theory',
    versionCode: 1,
    icon: './assets/zeroth-logo.png'
  }
}
