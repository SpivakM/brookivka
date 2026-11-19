# Landmark Data and Media Implementation Plan

## Goal

Create a reliable landmark content pipeline that supports current catalog features, cloud media, and
future multi-view AI recognition.

## Phase 1: Canonical landmark records

- Define required and optional fields for name, descriptions, category, architecture, build year,
  active state, object type, visibility radius, point, and footprint.
- Define language strategy for Ukrainian and future translations.
- Define stable IDs and an import format.
- Separate seed/demo data from curated production data.
- Add duplicate and invalid-coordinate checks.

## Phase 2: Spatial model

- Keep `location` as a compatibility field during migration.
- Add polygon footprint for buildings and point/radius behavior for statues and monuments.
- Validate geometry SRID 4326 and reject invalid polygons.
- Add spatial indexes using idempotent SQL where Hibernate annotations are insufficient.
- Define candidate query behavior for missing footprint, inactive records, and boundary cases.
- Measure query latency and candidate counts at realistic radii.

## Phase 3: Media lifecycle

- Validate MIME type, extension, size, and image readability.
- Generate safe object keys; never use user-supplied paths.
- Replace and delete only objects managed by the application.
- Keep S3 private and deliver through CloudFront.
- Decide whether media URLs are public, signed, or proxied before protected content is added.
- Add cleanup handling for database/S3 partial failures.
- Add lifecycle rules and storage monitoring.

## Phase 4: AI reference dataset

- Collect only licensed or permissioned images.
- Store source, license, photographer/owner, capture date, viewpoint, object ID, and split.
- Require 5–15 views per object where available.
- Include facade, corner, rear, detail, distance, weather, and lighting variation.
- Keep query/evaluation images separate from reference images.
- Record checksums and dataset version in `AI_EXPERIMENT_LOG.md`.

## Phase 5: Content operations

- Define who can create, edit, publish, archive, and delete landmark records.
- Add review status and change history before public administration begins.
- Provide an import validation report before applying changes.

## Exit criteria

- A clean dataset can be loaded repeatedly without duplicates.
- Public APIs return only active, valid records.
- Every AI reference image has provenance and a stable landmark ID.
