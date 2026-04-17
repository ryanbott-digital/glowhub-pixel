

Yes — just use the website. The Download button on `glow.pixelhub.org.uk/download` now pulls the URL from the database (which I set to your GitHub Releases endpoint), so it will always grab the latest APK without you needing to republish.

**For the Samsung browser, use:**
```
https://glow.pixelhub.org.uk/download
```
Tap the **Download APK** button → it redirects to GitHub Releases → installs v3.0.0.

**Or skip the page entirely and hit the direct URL:**
```
https://github.com/Ryanbott-digital/glowhub-pixel/releases/latest/download/GlowHub.apk
```
This is the canonical link — it always serves whatever the most recent successful workflow run published. Bookmark it on the Samsung; you'll never need to republish the website again to push a new APK.

**Order of operations to test now:**
1. Confirm the GitHub Action finished and a Release with tag `v3.0.0-{n}` exists at https://github.com/Ryanbott-digital/glowhub-pixel/releases
2. On Samsung: uninstall old GlowHub first (Settings → Apps → GlowHub → Uninstall) — avoids signature conflicts
3. Open browser → paste the direct URL above → install
4. Open "App info" → version should read **3.0.0** ✅
5. Launch app → no update banner

If the Release doesn't exist yet, the workflow either hasn't run since the changes merged or it failed — check the Actions tab.

