

## Get the APK Despite the 404

### Why 404
We made the "commit APK back to repo" step non-fatal so the workflow stays green even if the push fails. The push *is* failing (likely branch protection, GITHUB_TOKEN write perms, or file size), so `public/GlowHub.apk` was never committed → the URL 404s. The APK *was* still built — it's sitting in the workflow run's Artifacts.

### Two paths

**Path A — Grab it from Artifacts right now (fastest, works today)**
1. GitHub → your repo → **Actions** tab
2. Click the most recent green **Build Fire TV APK** run
3. Scroll to bottom → **Artifacts** section → click **GlowHub-FireTV** → downloads a zip
4. Unzip → `app-release.apk` (or `app-debug.apk`) → sideload to the Samsung tablet

**Path B — Fix the auto-publish so the URL works (proper fix)**
The workflow needs the push to actually succeed. Likely culprits:
- `permissions: contents: write` missing at the workflow level (GITHUB_TOKEN defaults to read-only on many repos now)
- APK >100MB → GitHub rejects the push
- Branch protection on `main` blocking direct pushes from Actions

Plan once you approve:
1. Read `.github/workflows/build-firetv.yml` to confirm current `permissions` block and push target
2. Add `permissions: contents: write` at workflow root if missing
3. Restore the push step to **fail loudly** (remove the `|| echo warning`) so we actually see the real error next run
4. Add an `ls -lh public/GlowHub.apk` line before push so the log shows the file size (rules out the >100MB issue)
5. You re-run the workflow → if it fails, paste the red push-step error here → I pinpoint it

### Recommendation
Do Path A right now to unblock testing the immersive-mode fix on the Samsung. Then approve Path B so the public download URL works for future builds.

### Files Path B touches
- `.github/workflows/build-firetv.yml`

