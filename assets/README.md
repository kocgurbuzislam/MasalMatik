App assets

Expected files (place your PNGs here):

- icon.png
  - Square 1024x1024 PNG (no rounded corners; Expo will mask)
  - Path: assets/icon.png

- adaptive-icon.png (optional but recommended for Android)
  - Square 1024x1024 PNG with transparent background and centered glyph/logo
  - Path: assets/adaptive-icon.png
  - Background color configured in app.config.js (android.adaptiveIcon.backgroundColor)

- splash.png (optional)
  - Large square or portrait PNG, suggested >= 1242x2436
  - Path: assets/splash.png
  - Shown while app loads; configured to contain and white background by default

Notes
- app.config.js only references these if the files exist, so builds won’t fail before you add them.
- After adding files, run: npx expo start -c (clear cache) or rebuild via EAS.

