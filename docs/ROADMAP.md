# Brookivka Roadmap

**Source of truth:** `dev`  
**Last reviewed:** 2026-11-13

## Phase 0: Documentation and team foundation

**Status:** Implemented, requires maintenance

- Keep architecture, status, roadmap, and decisions synchronized.
- Standardize issue, pull request, testing, and release workflows.
- Replace template documentation with Brookivka-specific setup instructions.
- Keep implementation plans and decision records synchronized with code.

## Phase 1: Product foundation

**Status:** Partially implemented

- Stabilize authentication between the mobile client and backend.
- Add a shared frontend API client and consistent API error handling.
- Complete landmark administration and media lifecycle.
- Add backend integration tests and reliable local seed data.
- Define global API errors, health checks, request IDs, and upstream timeout behavior.

## Phase 2: Recognition data and spatial model

**Status:** Planned

- Add landmark object type, visibility radius, active state, and building footprint support.
- Preserve point compatibility for statues and monuments.
- Collect licensed multi-view reference images and metadata.
- Add spatial indexes and measurable nearby-candidate queries.

## Phase 3: AI retrieval MVP

**Status:** Planned

- Create the Python inference service.
- Implement detector and ROI cropping.
- Generate DINOv2 or equivalent embeddings.
- Build a FAISS index and retrieval manifest.
- Implement visual, geographic, and heading reranking.
- Return explicit `MATCHED`, `UNCERTAIN`, and `NOT_FOUND` states.

## Phase 4: Mobile recognition experience

**Status:** Planned

- Connect GPS and heading data to recognition requests.
- Replace static AR selection with recognition results.
- Add loading, uncertainty, failure, and offline states.
- Render verified landmark overlays and open the AI guide from a confirmed result.

## Phase 5: Production hardening

**Status:** Planned

- Evaluate recognition quality on a held-out Lviv dataset.
- Add observability, rate limits, retries, model versioning, and rollback.
- Move from local FAISS to a shared vector store only when scale requires it.
- Complete HTTPS deployment, backups, secrets management, and operational monitoring.

## Cross-cutting quality gates

- Every public endpoint has a documented contract and error behavior.
- Every user-facing feature has loading, empty, offline, permission, and failure states.
- Every production AI change has a reproducible experiment and held-out evaluation.
- Every deployment has health checks, smoke tests, rollback instructions, and an owner.

## Prioritization rule

Reliability and measurable evaluation take priority over adding new model types or UI polish.
Every roadmap item should become a GitHub issue with acceptance criteria before implementation.
