# ADR-0003: FAISS before a managed vector store

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

The first recognition dataset is expected to be small, and a reproducible local benchmark is more
important than distributed vector infrastructure.

## Decision

Use FAISS for the initial offline and MVP retrieval index. Consider Qdrant or another shared vector
store only after dataset size, concurrency, and operational requirements justify it.

## Consequences

The initial system is simple and inexpensive. Index rebuilds, artifact versioning, and service
restart behavior must be documented.
