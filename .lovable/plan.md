

## Problem

Fire TV requires apps to declare a **Leanback Launcher** intent filter and provide a **banner** image (320×180px) in the Android manifest. Without these, the OS installs the APK but hides it from the app grid.

## Solution — Native Android Project Changes

These changes must be made in the exported Android project (after `npx cap add android`), not in Lovable:

### 1. Add Leanback launcher intent to `AndroidManifest.xml`

In `android/app/src/main/AndroidManifest.xml`, inside the main `<activity>` block, add a second intent filter:

```xml
<intent-filter>
  <action android:name="android.intent.action.MAIN" />
  <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
</intent-filter>
```

Also add to the `<application>` tag:
```xml
android:banner="@drawable/tv_banner"
```

### 2. Add a TV banner image

Place a 320×180px PNG at:
```
android/app/src/main/res/drawable/tv_banner.png
```

This is what Fire TV shows in the app grid.

### 3. Declare touchscreen as not required

Add to `AndroidManifest.xml` (inside `<manifest>`):
```xml
<uses-feature android:name="android.hardware.touchscreen" android:required="false" />
<uses-feature android:name="android.software.leanback" android:required="false" />
```

### 4. Rebuild the APK

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```

Then re-upload the new APK to Lovable's `public/GlowHub.apk`.

## What Lovable Can Do Now

- Generate the 320×180 TV banner image using the GLOW branding
- Update documentation/install guide to mention these requirements

## Summary

The APK needs native Android manifest changes that happen outside Lovable. Once the Leanback launcher intent and banner are added, the app will appear in Fire TV's app list normally.

