

## Automate Fire TV APK Patching

Unfortunately, I can't build Android APKs directly in this environment (no Android SDK). However, I **can** automate the patching step so you don't have to manually edit XML files.

### How it would work

1. You go to PWABuilder and download the **source code ZIP** (not the pre-built APK)
2. You upload that ZIP here
3. I run a script that automatically:
   - Injects the `LEANBACK_LAUNCHER` intent filter into `AndroidManifest.xml`
   - Adds `android:banner="@drawable/tv_banner"` to the `<application>` tag
   - Adds `touchscreen not required` feature declarations
   - Copies the `tv_banner.png` into the correct `res/drawable/` folder
4. I give you back the patched ZIP
5. You open it in Android Studio and hit Build → APK (one click)

### What I'll build

- A Python patch script that modifies the PWABuilder Android source ZIP
- It will handle all the manifest changes and asset placement automatically

### Limitation

You'll still need Android Studio to compile the final APK from the patched source, but all the fiddly XML editing will be done for you.

### Alternative

If you want to skip Android Studio entirely, you could use PWABuilder's **cloud build** — but their cloud build doesn't support custom manifest modifications. So the patch-then-build approach is the most reliable path.

