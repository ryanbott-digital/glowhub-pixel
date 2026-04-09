

# Premium Widget Configuration UI

## Overview

Add a new "Widget Settings" section to the Settings page where Pro users can configure their Weather and RSS widgets. Configurations are persisted to the `premium_widgets` table (already exists with RLS). Free users see an upgrade prompt via `ProGuard`.

## Plan

### 1. Create `src/components/PremiumWidgetConfig.tsx`

A self-contained component that:
- Fetches the user's saved widget configs from `premium_widgets` (filtered by `widget_type` = `weather` or `rss`)
- **Weather widget config**: city input, temperature unit toggle (°C / °F)
- **RSS widget config**: feed URL input, scroll speed selector, headline count
- Upserts configs on save (insert if new, update if exists)
- Delete button per widget
- Uses the glassmorphism styling consistent with the rest of the dashboard

### 2. Integrate into `src/pages/Settings.tsx`

- Import `ProGuard` and `PremiumWidgetConfig`
- Add a new "Pro Widgets" section after the existing settings sections
- Wrap `PremiumWidgetConfig` in `<ProGuard showUpgradePrompt featureName="Widget Configuration">`
- Free users see the standard upgrade prompt; Pro users see the config form

### 3. Wire Studio to read saved configs

- In `src/pages/Studio.tsx`, when adding a weather or RSS widget, query `premium_widgets` for the user's saved defaults and pre-populate the element's `content` JSON (city, feed URL, etc.)
- Falls back to current hardcoded defaults if no saved config exists

## Technical Detail

```text
Settings page
├── Existing settings sections...
└── Pro Widgets (wrapped in ProGuard)
    ├── Weather Config Card
    │   ├── City input
    │   └── Unit toggle (°C/°F)
    └── RSS Config Card
        ├── Feed URL input
        ├── Scroll speed select
        └── Headline count slider
```

**Database interaction** uses the existing `premium_widgets` table:
- `widget_type`: `"weather"` or `"rss"`
- `config`: JSONB storing `{ city, unit }` or `{ feedUrl, speed, count }`
- `name`: user-friendly label

**Files changed**: 3
- **New**: `src/components/PremiumWidgetConfig.tsx`
- **Modified**: `src/pages/Settings.tsx`, `src/pages/Studio.tsx`

