# Backend and API Implementation Plan

## Goal

Turn the current Spring Boot backend into a stable API boundary for the mobile client, landmark
catalog, media, authentication, AI guide, and future recognition service.

## Phase 1: API baseline

### Tasks

- Add a global exception handler with a stable error response:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {},
  "requestId": "..."
}
```

- Validate query parameters and request bodies at controller boundaries.
- Define explicit response DTOs; do not expose JPA entities directly.
- Add `GET /actuator/health` or an equivalent non-sensitive health endpoint.
- Add request correlation IDs to logs and error responses.
- Define timeout and upstream-error behavior for Groq.
- Replace success-shaped AI-guide fallback text with explicit error responses.

### Exit criteria

- Invalid input returns 4xx with a documented error shape.
- Upstream failures return a non-2xx response.
- Logs contain a request ID but no secrets or raw user content by default.

## Phase 2: Landmark domain

### Tasks

- Add service-layer methods for landmark lookup, nearby search, and media operations.
- Keep current point geometry compatible.
- Add `objectType`, `visibilityRadiusMeters`, `active`, and optional `footprint`.
- Validate SRID 4326 and geometry types.
- Add active-only filtering to public searches.
- Add deterministic seed/import behavior rather than duplicate seed rows.
- Add pagination or bounded result limits for catalog endpoints.

### Exit criteria

- Existing nearby requests continue to work.
- Buildings can use polygons and point objects retain point behavior.
- Spatial queries have integration coverage against PostGIS.

## Phase 3: Authentication and authorization

Implement according to [AUTH_IMPLEMENTATION_PLAN.md](AUTH_IMPLEMENTATION_PLAN.md).

### Exit criteria

- Registration and login contracts are documented and tested.
- Protected operations reject missing, invalid, and insufficient credentials.

## Phase 4: AI service integration

### Tasks

- Define the Spring-to-Python recognition request and response contract.
- Forward location, heading, image, and request metadata safely.
- Add connect/read timeouts, bounded payloads, and explicit upstream failure handling.
- Add feature flags for recognition rollout and emergency disablement.
- Store model/index version in recognition responses and logs.

### Exit criteria

- Backend never invents recognition results when the AI service fails.
- `UNCERTAIN` and `NOT_FOUND` are preserved end-to-end.

## Phase 5: Documentation and compatibility

- Publish endpoint contracts in `API_REFERENCE.md`.
- Add contract tests for mobile-consumed endpoints.
- Mark deprecated fields and maintain a compatibility window before removal.
