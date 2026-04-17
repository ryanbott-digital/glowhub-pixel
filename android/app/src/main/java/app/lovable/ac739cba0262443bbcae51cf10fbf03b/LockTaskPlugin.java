package app.lovable.ac739cba0262443bbcae51cf10fbf03b;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Lock Task Mode (a.k.a. Screen Pinning) for kiosk builds.
 *
 * On a stock (non-device-owner) Samsung tablet, calling startLockTask()
 * will pin the app — the user must hold Back+Recents (or perform the
 * configured unpin gesture) to exit. Combined with our immersive flags,
 * this prevents accidental exits in retail windows.
 *
 * If the device is provisioned as device-owner, lock task mode becomes
 * silent (no system prompt) and truly unbreakable.
 */
@CapacitorPlugin(name = "LockTask")
public class LockTaskPlugin extends Plugin {

  @PluginMethod
  public void start(PluginCall call) {
    final Activity activity = getActivity();
    if (activity == null) {
      call.reject("No activity");
      return;
    }
    activity.runOnUiThread(() -> {
      try {
        activity.startLockTask();
        JSObject ret = new JSObject();
        ret.put("started", true);
        call.resolve(ret);
      } catch (Throwable t) {
        call.reject("startLockTask failed: " + t.getMessage());
      }
    });
  }

  @PluginMethod
  public void stop(PluginCall call) {
    final Activity activity = getActivity();
    if (activity == null) {
      call.reject("No activity");
      return;
    }
    activity.runOnUiThread(() -> {
      try {
        activity.stopLockTask();
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
      } catch (Throwable t) {
        call.reject("stopLockTask failed: " + t.getMessage());
      }
    });
  }

  @PluginMethod
  public void isActive(PluginCall call) {
    Context ctx = getContext();
    ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
    boolean active = false;
    if (am != null) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        int mode = am.getLockTaskModeState();
        active = mode != ActivityManager.LOCK_TASK_MODE_NONE;
      } else {
        active = am.isInLockTaskMode();
      }
    }
    JSObject ret = new JSObject();
    ret.put("active", active);
    call.resolve(ret);
  }
}
