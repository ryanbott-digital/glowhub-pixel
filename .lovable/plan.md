

## No changes needed — deps already present

Verified `package.json`:

| Plugin requested | In package.json? | Version |
|---|---|---|
| `@capacitor/status-bar` | ✅ | ^8.0.2 |
| `@capacitor/navigation-bar` | ⚠️ uses `@hugotomazi/capacitor-navigation-bar` instead | ^4.0.1 |
| `@capacitor-community/keep-awake` | ✅ | ^8.0.1 |

### About the nav-bar package
There is **no official `@capacitor/navigation-bar`** in the Capacitor ecosystem. The standard community plugin is `@hugotomazi/capacitor-navigation-bar`, which is what `src/lib/immersive-mode.ts` already imports. The GitHub Actions build will install it via `npm install` and Capacitor will auto-link it during `npx cap sync`.

### Build will succeed
All three deps are committed to `package.json` and `bun.lock`. The next workflow run will install them cleanly — no edits required.

### Suggested next step
Just re-run the **Build Fire TV APK** workflow on GitHub. When it completes, download the new APK from Artifacts and sideload to the Samsung.

