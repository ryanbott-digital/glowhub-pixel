

## Fix: Upgrade JDK from 17 to 21

The build error `invalid source release: 21` occurs because `capacitor.build.gradle` sets `JavaVersion.VERSION_21` but the workflow installs JDK 17.

### Change

**File: `.github/workflows/build-firetv.yml`** — line 36-40

Change:
```yaml
- name: Set up JDK 17
  uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: 17
```

To:
```yaml
- name: Set up JDK 21
  uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: 21
```

That is the only change needed. Once applied, re-run the workflow from GitHub Actions.

