

## Where to Click

You're on the right page. Two options:

### Option A — Download from Artifacts (always works)
1. Scroll to the **Artifacts** section at the bottom (you can see it in your screenshot)
2. Click **GlowHub-FireTV** (the row showing 5.51 MB) — or click the small **download arrow icon** on the far right of that row
3. Browser downloads `GlowHub-FireTV.zip`
4. Unzip it → you'll get `app-release.apk`
5. Sideload to the Samsung tablet (transfer via USB / Google Drive / email and tap to install)

### Option B — Try the public URL again
Since the APK is only 5.51 MB (way under 100 MB), the auto-commit step should have succeeded this run. Try:

**https://glow.pixelhub.org.uk/GlowHub.apk**

If it downloads → done, that URL now works for all future builds.
If it still 404s → the push step failed silently (branch protection most likely). Tell me and I'll switch the workflow to publish via a `builds` branch or GitHub Releases instead.

### Recommendation
Do **Option A right now** to unblock testing. Then try Option B in a separate tab — if B works too, even better for future updates.

### No code changes needed this turn
This is purely a "click here" guide. Once you've installed the APK on the Samsung, report back whether the status bar is gone.

