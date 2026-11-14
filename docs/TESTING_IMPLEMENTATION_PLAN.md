# Testing and Quality Implementation Plan

## Goal

Provide evidence that each workstream is correct, compatible, secure, and operable.

## Backend tests

- Unit-test services, validation, error mapping, and Groq failure handling.
- Integration-test repositories and spatial queries against PostGIS.
- Test media MIME/size validation, replacement, deletion, and partial failures.
- Test authentication, token expiry, authorization, and rate limits.
- Add API contract tests for mobile-consumed endpoints.

## Frontend tests

- Unit-test API client status/error mapping.
- Test AuthContext startup, login, logout, expiry, and storage failure.
- Test AI guide loading, success, timeout, retry, and error states.
- Test landmark empty/error/filter behavior.
- Test AR permission and recognition result states.
- Mock native camera, location, and sensor modules at the boundary.

## AI tests

- Build a fixed evaluation split and never tune thresholds on it.
- Measure top-1/top-5 retrieval, confidence calibration, false positives, and latency.
- Test buildings, statues, partial views, occlusion, lighting, and nearby distractors.
- Test candidate filtering independently from visual retrieval.
- Test score weights, top-1/top-2 margin, and all explicit result statuses.
- Store model/index/dataset versions with each result.

## Device and integration tests

- Verify Android and iOS permission flows.
- Test local backend selection, ADB reverse, cloud URL fallback, and offline behavior.
- Verify camera lifecycle across background/foreground and rotation.
- Test upload on real devices with slow and interrupted networks.

## Deployment tests

- Validate Terraform plan.
- Start Compose from a clean environment.
- Run health and smoke checks after deployment.
- Verify CloudFront media delivery without public S3 access.
- Test database backup restore and application rollback.

## Release gates

A release is blocked when:

- a core endpoint returns undocumented success-shaped errors;
- secrets are exposed;
- authentication or authorization tests fail;
- AI changes lack a held-out evaluation;
- deployment or rollback cannot be verified;
- known limitations are missing from `STATUS.md`.
