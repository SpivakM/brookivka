# Brookivka frontend

The frontend is a React Native 0.88.1 application written in TypeScript. It targets Android and
iOS and provides the landmark catalog, map/routes, AR scanner, AI guide, authentication, settings,
and theme UI.

## Architecture

```text
src/
├── modules/
│   ├── ai-guide/       # AI guide screen
│   ├── ar-scanner/     # Vision Camera scanner
│   ├── auth/           # Login and registration
│   ├── home/           # Entry screen
│   ├── landmarks/      # Landmark catalog
│   ├── map-routes/     # Map and route cards
│   └── settings/       # User settings
├── navigation/         # Stack and navigation types
└── shared/
    ├── components/     # Reusable navigation/UI
    ├── constants/      # Theme and API constants
    └── context/        # Auth and theme state
```

The current AR implementation uses Vision Camera and Worklets. Its frame processor reports
telemetry only; detector, ROI, embeddings, and recognition API integration are planned.

## Setup

From this directory:

```bash
npm ci
npm run setup
npm start
```

Run Android in another terminal:

```bash
npm run android
```

For iOS, install CocoaPods dependencies and run:

```bash
bundle exec pod install
npm run ios
```

See the repository [development setup](../docs/DEVELOPMENT_SETUP.md) for device, backend, and
troubleshooting instructions.

## Runtime configuration

`npm run setup` runs:

- `scripts/setup-env.js` to select a reachable local or cloud API URL;
- `scripts/reverse-ports.js` to configure Android ADB reverse for ports `8081` and `8082`.

Do not place Groq keys, AWS credentials, or other backend secrets in the mobile application.

Google Maps requires the client key at mobile build time. Set `GOOGLE_MAPS_API_KEY` in the
frontend build environment (or in an uncommitted `frontend/.env` file) for both Android and iOS.
The key should be restricted to this app's Android package/SHA-1 and iOS bundle ID.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm test -- --runInBand
```

Known test limitations should be recorded in the pull request and `docs/STATUS.md` when they
represent a repository-wide issue.

## Frontend implementation rules

- Use the shared API client once it is introduced; do not add screen-specific request behavior.
- Represent loading, empty, offline, permission, timeout, and error states explicitly.
- Keep authentication state in `AuthContext` and visual preferences in `ThemeContext`.
- Do not display an unverified landmark name from a failed or uncertain recognition result.
- Update navigation types when adding screens or route parameters.
