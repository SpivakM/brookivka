# ADR-0002: Separate Python AI inference service

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

Model inference, image preprocessing, embeddings, and vector indexes have different dependencies
and runtime characteristics from the Spring Boot API.

## Decision

Keep Spring Boot responsible for metadata, spatial filtering, authorization, and public API
contracts. Run model inference and vector retrieval in a separate Python service.

## Consequences

The services can scale and deploy independently, but the recognition contract, timeouts, health
checks, and model/index versioning must be explicit.

## Alternatives

Embedding inference in Java was rejected for the MVP because it would increase deployment and model
compatibility complexity.
