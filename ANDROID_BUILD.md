# AROMATIC POS - Android APK Build

This project is prepared for Capacitor Android packaging.

## Requirements
- Windows/macOS/Linux PC
- Node.js LTS
- Android Studio
- Android SDK / Android SDK Platform
- Java/JDK supported by the installed Android Studio

## Build
Open a terminal in this project folder:

```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to finish.
2. Connect an Android phone or use an emulator for testing.
3. For an installable debug APK: Build > Build APK(s).
4. For a release APK: Build > Generate Signed App Bundle / APK > APK.

The web POS files are used as the Android app content. Billing data is stored locally in the app's WebView local storage.

## Important current limitations
- The existing web POS does not contain a native camera barcode scanner. The barcode field remains available.
- The existing print flow uses browser `window.open()` / `print()`. Native Android thermal printing may require a Capacitor/Bluetooth/USB printer plugin and additional Android code.
- UPI QR generation currently uses the external QR Server URL, so QR image generation needs internet access.
- The supplied project did not contain the original 192/512 app icons, so temporary POS icons were added. Replace them with the final AROMATIC POS logo before publishing.
