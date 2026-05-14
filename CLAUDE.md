# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build
```

No test suite is configured.

## Architecture

**Lichtkern** is a German-language practice management SPA for energetic healers/therapists. It is a React + Vite app deployed on Vercel with Firebase for auth and data storage.

### Entry points

- `index.html` → `src/main.jsx` → `App.jsx` (root component)
- `lichtkern.jsx` re-exports `App.jsx` as the Vercel build target

### State management

All app state lives in `App.jsx` (`Root` → `App` component). There is no Redux or context — every screen receives its data and save handlers as props. Persistence uses Firebase Firestore via the helper functions in `src/config/firebase.js` (`fsGet`/`fsSet`/`fsDelete`), keyed per user under `users/{uid}/data/{key}`.

Firestore keys: `lk_clients`, `lk_sessions`, `lk_appts`, `lk_gentrees`, `lk_templates`, `lk_reminders`, `lk_settings`.

### Backend / API

`api/ki.js` is a Vercel Serverless Function that proxies requests to the Groq API (model: `llama-3.3-70b-versatile`). The `GROQ_API_KEY` environment variable must be set in the Vercel project. Client-side calls go through `groqFetch(prompt)` in `src/config/firebase.js`.

### Color system — strict two-token rule

There are two separate design-token objects. **Never mix them, never hardcode hex values.**

| Scope | Token object | Source file |
|---|---|---|
| All screens, components, `App.jsx` | `T` | `src/config/theme.js` |
| All oracle modules (`src/oracle/`) | `OT` | `src/oracle/OracleUI.jsx` |

**`src/oracle/OracleUI.jsx` is the single source of truth for every oracle module.** It defines and exports `OT` (oracle tokens) along with shared data (`CHAKRA_SYSTEM`, `ORGAN_MAP`, etc.) and shared UI primitives (`OCard`, `OBtn`, `OTag`, `OLabel`). Oracle files import from `OracleUI.jsx`, not from `theme.js`.

Violet and teal accent colors are being replaced by gold equivalents across the entire app. When changing colors in any file, use `T.gold` / `T.goldL` (screens/components) or `OT.gold` / `OT.goldL` (oracle) instead of any violet or teal token.

### Config layer (`src/config/`)

| File | Purpose |
|---|---|
| `theme.js` | Single `T` object — all colors/shadows for the app UI |
| `constants.js` | `APPT_TYPES`, `LEVELS`, `TECHNIQUES`, `KNOWLEDGE`, date/time constants |
| `helpers.js` | `uid()`, `lvl()`, date helpers (`todayStr`, `parseDate`, `addDays`, etc.) |
| `firebase.js` | Firebase init, auth exports, `fsGet`/`fsSet`/`fsDelete`, `groqFetch` |

### UI components (`src/components/`)

`UI.jsx` exports the design-system primitives used everywhere:
- `Card`, `Btn` (variants: `primary`, `ghost`, `soft`, `success`, `violet`, `danger`), `TI` (text input / textarea), `Select`, `LBar` (level progress bar), `Pill`, `SL` (section label), `NAV`, `BottomNav`

Fonts: **Cinzel** (headings) and **Raleway** (body) — loaded from Google Fonts at runtime.

### Screens (`src/screens/`)

Each screen is a named export used directly in `App.jsx`. Screens do not manage their own persistence — they call `save*` callbacks passed from `App.jsx`.

Key screens: `Dashboard`, `Clients`, `Session`, `CalendarScreen`, `History`, `Analytics`, `Billing`, `PDFModal`, `GenTree`, `Knowledge`, `TemplatesScreen`, `SettingsScreen`, `OnboardingScreen`.

### Oracle modules (`src/oracle/`)

All oracle modules import their tokens, data, and UI primitives exclusively from `OracleUI.jsx`. Currently commented out in `App.jsx` imports.

## Deployment

Deployed to Vercel. The `GROQ_API_KEY` secret must be set in Vercel environment variables — it is never exposed to the browser.
