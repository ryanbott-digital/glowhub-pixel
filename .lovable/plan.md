

## How to Trigger the Fire TV Build

I can't run GitHub Actions from inside Lovable — I only edit code, GitHub runs the workflow. Here's exactly how to kick it off:

### Steps

1. Go to your repo on GitHub: **github.com/<your-username>/<repo-name>**
2. Click the **Actions** tab at the top.
3. In the left sidebar, click **Build Fire TV APK**.
4. On the right, click the **Run workflow** dropdown button.
5. Leave **Build type** as `release` (or pick `debug` if you want a faster, unsigned test build).
6. Click the green **Run workflow** button.
7. Wait ~3–5 minutes. When the run finishes with a green check:
   - Scroll to the bottom of the run page → **Artifacts** → download `GlowHub-FireTV` (zip containing the APK), **OR**
   - The workflow also auto-commits the new APK to `public/GlowHub.apk`, so it's available at:  
     `https://glow.pixelhub.org.uk/GlowHub.apk`

### If "Run workflow" button is missing
That means GitHub disabled the workflow (happens after long inactivity or repeated failures). Fix:
- Actions tab → Build Fire TV APK → top right → **Enable workflow**.
- Then repeat steps 4–6.

### What this build includes
The latest immersive-mode native fixes are already merged:
- `MainActivity.java` — immersive sticky flags
- `styles.xml` — fullscreen + translucent bars on both themes
- `build-firetv.yml` — patches the runtime theme during build

So the next APK off this workflow should be the one that finally kills the Samsung status bar.

Once it's built and installed, let me know if the bar's gone and I'll move on to the next thing.

