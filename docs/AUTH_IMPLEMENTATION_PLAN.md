# Authentication and Authorization Implementation Plan

## Goal

Align the existing frontend `AuthContext` with a secure backend authentication contract.

## Proposed contract

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "strong-password",
  "displayName": "User"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

### Response

```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "expiresAt": "...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "displayName": "User"
  }
}
```

The exact token technology must be recorded in an ADR before implementation. Passwords must never
be stored or logged in plaintext.

## Phase 1: Contract and threat model

- Decide JWT versus server-side sessions.
- Define password policy, token lifetime, logout semantics, and account enumeration behavior.
- Define roles for regular users and future landmark administrators.
- Define rate limits and failed-login handling.
- Document personal-data retention and deletion behavior.

## Phase 2: Backend implementation

- Add user entity, repository, service, controller, DTOs, and password hashing.
- Add authentication middleware/filter.
- Add current-user endpoint if the mobile client needs profile restoration.
- Return stable 401/403/409/422 errors.
- Add tests for duplicate email, invalid credentials, expired token, and protected routes.

## Phase 3: Frontend implementation

- Replace placeholder requests in `AuthContext`.
- Store tokens using the platform-appropriate secure storage mechanism rather than ordinary
  AsyncStorage when the chosen security design requires it.
- Restore session on startup and clear it on logout or invalidation.
- Add disabled/loading states to login and registration forms.
- Avoid exposing whether an email exists in a way that enables enumeration.

## Phase 4: Protected resources

- Protect photo upload/delete and future administration endpoints.
- Keep public landmark discovery read-only and bounded.
- Add authorization tests for ownership and administrator roles.

## Exit criteria

- Registration, login, session restore, logout, and expiry work on Android and iOS.
- Secrets and passwords are absent from logs, analytics, screenshots, and crash reports.
- Security review is completed before production authentication is enabled.
