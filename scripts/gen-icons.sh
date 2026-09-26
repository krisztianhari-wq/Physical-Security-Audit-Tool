#!/usr/bin/env bash
# Regenerates every app icon from assets/ (made by scripts/mkicon.swift):
#   app-icon-source.png          desktop + iOS
#   app-icon-android-source.png  Android (smaller drawing: adaptive icons show only the central ~60 %)
# Run after `tauri android init` / `tauri ios init` (the generated projects hold the mobile icons).
set -euo pipefail
cd "$(dirname "$0")/.."
ANDROID_RES=src-tauri/gen/android/app/src/main/res
TMP=$(mktemp -d)
if [ -d "$ANDROID_RES" ]; then
  npx tauri icon assets/app-icon-android-source.png --ios-color '#2F6497' >/dev/null
  cp -R "$ANDROID_RES"/mipmap-* "$TMP"/
fi
npx tauri icon assets/app-icon-source.png --ios-color '#2F6497' >/dev/null
if [ -d "$ANDROID_RES" ]; then cp -R "$TMP"/mipmap-* "$ANDROID_RES"/; fi
echo "icons regenerated"
