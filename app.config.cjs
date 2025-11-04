// Expo app configuration (CommonJS variant to avoid ESM loader issues)
const fs = require('fs');
const path = require('path');

function fileIfExists(p) {
  try {
    return fs.existsSync(p) ? p : undefined;
  } catch {
    return undefined;
  }
}

const icon = fileIfExists(path.resolve('assets/icon.png'));
const adaptiveForeground = fileIfExists(path.resolve('assets/adaptive-icon.png'));
const splash = fileIfExists(path.resolve('assets/splash.png'));
const BRAND_BG = '#FFF7E6';

module.exports = {
  expo: {
    name: 'MasalMatik',
    slug: 'masalmatik',
    version: '1.0.1',
    orientation: 'portrait',
    icon: icon,
    userInterfaceStyle: 'light',
    splash: {
      ...(splash ? { image: splash } : icon ? { image: icon } : {}),
      backgroundColor: BRAND_BG,
      resizeMode: 'contain',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.masalmatik.app',
    },
    android: {
      package: 'com.masalmatik.app',
      privacyPolicy: 'https://kocgurbuzislam.github.io/masalmatik-privacy/PRIVACY_POLICY.md',
      versionCode: 2,
      adaptiveIcon: {
        ...(adaptiveForeground ? { foregroundImage: adaptiveForeground } : icon ? { foregroundImage: icon } : {}),
        backgroundColor: BRAND_BG,
      },
      permissions: [
        'INTERNET',
      ],
      minSdkVersion: 21,
      targetSdkVersion: 34,
      compileSdkVersion: 34,
      // Privacy Policy URL - Google Play Store için ZORUNLU
      // privacyPolicy: 'https://yourdomain.com/privacy-policy', // Bu satırın yorumunu kaldırıp URL'nizi ekleyin
    },
    web: {
      favicon: icon,
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://masalmatik.onrender.com',
    },
    privacy: 'public',
  },
};
