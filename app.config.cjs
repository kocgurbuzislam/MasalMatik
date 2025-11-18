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
    // Version: Semantic versioning (MAJOR.MINOR.PATCH)
    // - MAJOR: Breaking changes (1.0.0 -> 2.0.0)
    // - MINOR: New features, backward compatible (1.0.0 -> 1.1.0)
    // - PATCH: Bug fixes, backward compatible (1.0.0 -> 1.0.1)
    version: '1.0.0',
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
      bundleIdentifier: 'com.islamkgb.masalmatik',
    },
    android: {
      package: 'com.masalmatik.app',
      privacyPolicy: 'https://kocgurbuzislam.github.io/masalmatik-privacy/PRIVACY_POLICY.md',
      // versionCode: Android için her yeni build'de mutlaka artırılmalı (1, 2, 3, 4...)
      // Google Play'de herhangi bir track'te kullanılan versionCode tekrar kullanılamaz
      // Her yeni AAB dosyası için versionCode'u +1 artırın
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
