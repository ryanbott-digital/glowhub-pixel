
Problem summary

- Your screenshots only show the GitHub Actions summary, not the exact failed command.
- From the repo, the most likely failure is the Capacitor Android sync/build path: `capacitor.config.ts` expects `webDir: "dist"`, but the workflow never runs a web build, so CI probably has no `dist` folder when it reaches Capacitor.
- Republishing the site would not fix that. The APK workflow builds the native shell from the GitHub repo and workflow steps, not from the already-published website.

Implementation plan

1. Fix the workflow order in `.github/workflows/build-firetv.yml`
   - Keep checkout, Bun, Java, and Android setup.
   - Change dependency install to a locked install.
   - Add `bun run build` before any Capacitor command so `dist/` exists.
   - Then run `npx cap add android` and `npx cap sync android`.

2. Make the Fire TV patching more reliable
   - Move the manifest/banner/theme patch step to after `cap sync android`, so Capacitor cannot overwrite the edits.
   - Keep the Leanback launcher, banner image, fullscreen theme, and internet permission.
   - Add the non-touchscreen TV feature flag if it is missing.

3. Add proper CI diagnostics
   - Add a sanity check that `dist/` exists after the web build.
   - Make the failing stage obvious with clearer step boundaries.
   - Upload Gradle logs or Android build outputs on failure so the next run shows the real reason instead of only “exit code 1”.

4. Clean up workflow compatibility
   - Update the workflow to a current Node version to avoid the Node 20 deprecation path.
   - Keep the runtime app URL pointed at the published `/player` route so installed APKs still load your live player.

5. Verify end to end
   - Re-run the GitHub workflow.
   - Confirm the job produces an APK artifact.
   - Confirm the repo copy step updates `public/GlowHub.apk` if that step is retained.
   - Then test one real install on Firestick or Android TV and verify the existing in-app update notification flow still works.

Technical notes

- Current likely root cause: the workflow never builds the Vite app, but Capacitor is configured to use `dist`.
- Secondary issue: patching Android files before `cap sync` is fragile.
- The Node 20 warning shown in your screenshots is not the main failure, but it should be updated while fixing the workflow.
