# ADR-0005: S3 and CloudFront for landmark media

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

Landmark photos need durable storage and delivery without exposing the storage bucket directly.

## Decision

Store managed landmark images in a private S3 bucket and deliver them through CloudFront using
Origin Access Control. Store the resulting CDN URL with the landmark record.

## Consequences

The backend owns validation, replacement, and deletion. Production still requires authorization,
monitoring, lifecycle policies, and a documented recovery process.
