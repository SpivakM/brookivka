# Brookivka Master Implementation Plan

This is the execution index for the whole project. The AI plan is one workstream; the supporting
product, platform, mobile, deployment, and quality workstreams must progress with it.

## Workstream order

### 1. Platform contracts and foundations

Reference: [Backend and API plan](BACKEND_IMPLEMENTATION_PLAN.md)

- Freeze API request/response and error conventions.
- Add health checks, validation, structured errors, and service boundaries.
- Define authentication before protecting media or administrative operations.
- Preserve current landmark and nearby-search compatibility.

**Exit criteria:** documented API contracts, consistent error shape, backend tests, and a stable
local Compose startup.

### 2. Mobile application integration

Reference: [Frontend plan](FRONTEND_IMPLEMENTATION_PLAN.md)

- Replace direct and duplicated requests with a shared API client.
- Connect the AI guide to the backend.
- Implement loading, empty, offline, timeout, and permission states.
- Keep the AR screen telemetry-only until recognition contracts are available.

**Exit criteria:** core screens consume documented APIs and do not use success-shaped demo fallbacks.

### 3. Authentication and authorization

Reference: [Authentication plan](AUTH_IMPLEMENTATION_PLAN.md)

- Implement backend registration, login, token validation, and current-user behavior.
- Align token persistence and logout behavior between mobile and backend.
- Protect media management and future administrative operations.

**Exit criteria:** authenticated flows work end-to-end and unauthorized requests fail explicitly.

### 4. Landmark data and media

Reference: [Media and landmark data plan](MEDIA_DATA_IMPLEMENTATION_PLAN.md)

- Stabilize landmark metadata and seed/import workflow.
- Add geometry fields without breaking point-based records.
- Define media ownership, replacement, deletion, and CDN behavior.
- Prepare multi-view reference images for AI retrieval.

**Exit criteria:** reproducible landmark data, tested media lifecycle, and a versioned AI dataset
manifest.

### 5. AI recognition

Reference: [AI implementation plan](AI_IMPLEMENTATION_PLAN.md)

- Implement spatial candidate filtering, detector/ROI, embeddings, retrieval, reranking, and API.
- Evaluate on a held-out dataset before connecting mobile AR.
- Use explicit `MATCHED`, `UNCERTAIN`, and `NOT_FOUND` states.

**Exit criteria:** benchmarked recognition service with versioned model/index artifacts and a
rollback path.

### 6. Delivery and operations

Reference: [Infrastructure and deployment plan](INFRASTRUCTURE_IMPLEMENTATION_PLAN.md)

- Make cloud deployment repeatable.
- Add HTTPS, secrets handling, health checks, backups, logs, and rollback.
- Keep local and deployed configuration explicit.

**Exit criteria:** a new environment can be deployed from documented steps and verified with smoke
tests.

### 7. Quality and release

Reference: [Testing and quality plan](TESTING_IMPLEMENTATION_PLAN.md)

- Add unit, integration, contract, mobile, device, AI, and deployment checks.
- Define release gates and evidence required for each workstream.

**Exit criteria:** release checklist passes and known limitations are recorded.

## Dependency graph

```text
API contracts
  ├── authentication ──┐
  ├── landmark/media ───┼── frontend integration
  └── health/errors ────┘

landmark geometry + dataset ── AI recognition ── mobile AR recognition

all workstreams ── testing ── deployment/release
```

## Delivery rule

Each phase becomes a set of GitHub issues with one owner, acceptance criteria, dependencies, and a
validation command or reproducible manual check. Update `STATUS.md`, `ROADMAP.md`, and the
requirements matrix when an issue is completed.
