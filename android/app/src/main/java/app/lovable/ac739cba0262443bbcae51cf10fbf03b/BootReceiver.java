package app.lovable.ac739cba0262443bbcae51cf10fbf03b;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Native auto-start receiver. When the device finishes booting (or
 * resumes from a power cycle on HTC/quickboot devices), launch the
 * Glow player MainActivity into a fresh task. Acts as the always-on
 * backstop for the JS-side capacitor-autostart helper.
 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)
                || "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)) {
            try {
                Intent launch = new Intent(context, MainActivity.class);
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(launch);
            } catch (Exception e) {
                // Swallow — boot receivers must never crash
            }
        }
    }
}
