

## Kill the Top Bar on Samsung Tablet APK

### What's actually showing
Samsung's system status bar + an address-bar overlay. The Capacitor APK is loading `glowhub-pixel.lovable.app/player` via `server.url`, but the Activity has no immersive flags and the launch theme isn't fullscreen — so Android keeps the status bar visible the whole time.

### Fix (3 small native changes)

**1. `android/app/src/main/res/values/styles.xml`** — add fullscreen + translucent status to BOTH themes (currently only the GitHub workflow patches `AppTheme`, not the launch theme that the activity actually uses):

```xml
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="windowActionBar">false</item>
    <item name="windowNoTitle">true</item>
    <item name="android:windowFullscreen">true</item>
    <item name="android:windowTranslucentStatus">true</item>
    <item name="android:windowTranslucentNavigation">true</item>
    <item name="android:background">@null</item>
</style>

<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="android:background">@drawable/splash</item>
    <item name="android:windowFullscreen">true</item>
    <item name="android:windowTranslucentStatus">true</item>
    <item name="android:windowTranslucentNavigation">true</item>
    <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
</style>
```

**2. `android/app/src/main/java/.../MainActivity.java`** — enable Android immersive sticky mode so status & nav bars are fully hidden and only re-appear with a swipe:

```java
package app.lovable.ac739cba0262443bbcae51cf10fbf03b;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().setFlags(
      WindowManager.LayoutParams.FLAG_FULLSCREEN,
      WindowManager.LayoutParams.FLAG_FULLSCREEN
    );
    hideSystemBars();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) hideSystemBars();
  }

  private void hideSystemBars() {
    View decor = getWindow().getDecorView();
    decor.setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
      | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_FULLSCREEN
    );
  }
}
```

**3. `.github/workflows/build-firetv.yml`** — bump the immersive patch so it also touches `AppTheme.NoActionBar` (the runtime theme), not just `AppTheme`. Replace the current `sed` block on `STYLES` with one that injects the four `android:window*` items into `AppTheme.NoActionBar` as well.

### Then
- Re-run the GitHub workflow → reinstall the new APK on the Samsung tablet.
- The status bar / URL overlay should be gone — only the WebView fills the screen.

### Why the previous fixes didn't help on Samsung
Samsung's tablet skin keeps showing the status bar unless the Activity explicitly enters immersive mode. The web-side `requestFullscreen()` only affects the browser document — it can't hide Android's system status bar inside a Capacitor WebView. The fix has to be in the native Activity.

### Files to edit
- `android/app/src/main/res/values/styles.xml`
- `android/app/src/main/java/app/lovable/ac739cba0262443bbcae51cf10fbf03b/MainActivity.java`
- `.github/workflows/build-firetv.yml`

