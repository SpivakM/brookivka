# API Reference

This documents the currently implemented backend endpoints. Planned endpoints are described in
the implementation plans and must not be treated as available until implemented and tested.

## Base URL

- Local backend: `http://localhost:8082`
- Android device with ADB reverse: `http://127.0.0.1:8082`
- Other physical devices: use the API URL selected by `frontend/scripts/setup-env.js`.

## Current endpoints

### Nearby landmarks

```http
GET /api/landmarks/nearby?lat={latitude}&lng={longitude}&radius={meters}
```

Parameters:

- `lat`: required decimal latitude.
- `lng`: required decimal longitude.
- `radius`: optional distance in meters; default `500`.

Response: `200 OK`

```json
[
  {
    "id": 1,
    "name": "Landmark",
    "description": "...",
    "fullDescription": "...",
    "architectureStyle": "...",
    "buildYear": 1900,
    "photoUrl": "https://cdn.example/...",
    "category": "historic",
    "latitude": 49.8418,
    "longitude": 24.0316
  }
]
```

Current behavior uses point geometry and PostGIS distance filtering. Footprint-aware filtering is
planned.

### AI guide chat

```http
POST /api/ai-guide/chat
Content-Type: application/json
```

Request:

```json
{
  "landmarkName": "Оперний театр",
  "context": "Verified landmark description",
  "userMessage": "Розкажи про цю будівлю"
}
```

Response: `200 OK`

```json
{
  "reply": "..."
}
```

The backend calls Groq. The API key is server-side only. Timeout and upstream error behavior must
be hardened according to the backend implementation plan.

### Upload landmark photo

```http
POST /api/landmarks/{id}/photo
Content-Type: multipart/form-data
```

Form field: `file`.

Accepted types: JPEG, PNG, WebP. Maximum configured request/file size: 10 MB.

Response: `200 OK` with the updated landmark DTO.

### Delete landmark photo

```http
DELETE /api/landmarks/{id}/photo
```

Response: `204 No Content`.

## Planned endpoint groups

These are not implemented yet:

- `/api/auth/*` registration, login, current user, and logout/session behavior;
- `/api/recognition/*` visual landmark recognition;
- administrative landmark/content endpoints;
- health/readiness and operational endpoints if not provided by the deployment runtime.

## Error contract

The current controllers do not yet guarantee one global error format. New endpoints must use the
planned format:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {},
  "requestId": "..."
}
```

Do not return a successful HTTP status with a fallback error message.
