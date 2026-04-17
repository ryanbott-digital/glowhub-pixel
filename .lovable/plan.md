

The repo is public now, so `https://github.com/Ryanbott-digital/glowhub-pixel/releases/latest/download/GlowHub.apk` will resolve for anyone. No code changes needed.

## Test it

1. **Laptop sanity check** (10 seconds): open the URL above in an incognito tab. It should immediately download `GlowHub.apk` (~6.7 MB). If it does, the pipeline is fully wired.

2. **Samsung install**:
   - Settings → Apps → GlowHub → **Uninstall** (critical — signature mismatch will block reinstall otherwise)
   - Browser → either tap **Download APK** on `glow.pixelhub.org.uk/download` *or* paste the direct GitHub URL
   - Install when prompted
   - Settings → Apps → GlowHub → App info → version should read **3.0.0**
   - Launch app → no orange update banner at the top

3. **If the banner still appears**: force-close the Samsung browser, clear its cache, and reload `/download` once — the old service worker may still be serving cached HTML for a minute after the republish.

Nothing for me to build. Run the test and report back if anything's still off.

