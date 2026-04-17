package app.lovable.ac739cba0262443bbcae51cf10fbf03b;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Custom Capacitor plugin exposing Android's "Display over other apps"
 * (SYSTEM_ALERT_WINDOW) permission state and a deep-link to the
 * platform-specific settings screen so kiosk users can grant it.
 */
@CapacitorPlugin(name = "OverlayPermission")
public class OverlayPermissionPlugin extends Plugin {

    @PluginMethod
    public void check(PluginCall call) {
        JSObject ret = new JSObject();
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            granted = Settings.canDrawOverlays(getContext());
        }
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void request(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            } catch (Exception e) {
                // Some OEM ROMs hide the per-app screen — fall back to the global list
                try {
                    Intent fallback = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(fallback);
                } catch (Exception ignored) {
                    call.reject("Unable to open overlay settings");
                    return;
                }
            }
        }
        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }
}
