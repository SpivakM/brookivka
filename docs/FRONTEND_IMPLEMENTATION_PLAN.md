# Frontend Implementation Plan

## Goal

Make the React Native application consume real backend behavior consistently and provide reliable
UX for catalog, map, authentication, AI guide, media, and future recognition.

## Phase 1: Shared client foundation

### Tasks

- Create one typed API client around the configured base URL.
- Add request timeout, JSON parsing, HTTP status handling, and error normalization.
- Add authenticated request support and token refresh/expiry behavior.
- Remove duplicated direct `fetch` logic from screens.
- Centralize API DTO types and map them to view models.
- Keep environment selection in `setup-env.js`; do not hardcode deployment URLs in screens.

### Exit criteria

- Every backend request uses the shared client.
- Screens distinguish loading, empty, offline, timeout, unauthorized, and server-error states.

## Phase 2: Core screens

### Tasks

- Connect landmarks and map screens to nearby landmark data.
- Add cancellation/debouncing for search and filters.
- Add stable keys and image loading/error placeholders.
- Make route data explicit as either backend data or clearly labeled local demo data.
- Persist only settings intended to survive restart.

## Phase 3: Authentication

Implement according to [AUTH_IMPLEMENTATION_PLAN.md](AUTH_IMPLEMENTATION_PLAN.md).

- Replace demo token behavior with backend responses.
- Clear user state and storage on logout.
- Handle expired sessions without infinite retry loops.
- Protect screens/actions that require authentication.

## Phase 4: AI guide

### Tasks

- Replace local timeout responses in `AIGuideScreen` with `POST /api/ai-guide/chat`.
- Send the selected landmark name, safe context, and user message.
- Render pending, success, timeout, rate-limit, and error states.
- Prevent duplicate sends and preserve conversation history locally for the active session.
- Avoid displaying untrusted markdown/HTML without sanitization.

## Phase 5: AR and recognition

- Keep current frame telemetry behind a feature boundary.
- Add location and compass permission flows.
- Request recognition only at a controlled frequency and with cancellation.
- Render only backend-confirmed results.
- Provide explicit uncertain/not-found/offline states.
- Open the AI guide with the selected recognition result, not a static fallback.

## Phase 6: Native platform quality

- Verify Android camera, location, and sensor permissions.
- Verify iOS camera, location, and motion permission descriptions.
- Test low-memory, denied-permission, background/foreground, and orientation behavior.
- Remove `react-native-camera-kit` only after confirming no native references remain.
