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
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://masalmatik.onrender.com',
    },
    ...(icon ? { icon } : {}),
    android: {
      package: 'com.masalmatik.app',
      adaptiveIcon: {
        ...(adaptiveForeground ? { foregroundImage: adaptiveForeground } : icon ? { foregroundImage: icon } : {}),
        backgroundColor: BRAND_BG,
      },
    },
    splash: {
      ...(splash ? { image: splash } : icon ? { image: icon } : {}),
      backgroundColor: BRAND_BG,
      resizeMode: 'contain',
    },
  },
};
