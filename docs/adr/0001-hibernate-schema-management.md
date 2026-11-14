# ADR-0001: Hibernate schema management for the MVP

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

The MVP uses Spring Data JPA, Hibernate Spatial, and PostgreSQL/PostGIS. The project does not yet
have a production migration workflow or stable deployment compatibility requirements.

## Decision

Use Hibernate entity annotations with `ddl-auto: update` during the MVP. Use explicit idempotent SQL
only for spatial indexes or database features that annotations cannot safely express.

## Consequences

This reduces setup complexity while the schema is changing quickly. Before production schema
compatibility becomes critical, introduce versioned migrations through a new ADR and a staged
conversion plan.

## Alternatives

Flyway or Liquibase were considered but deferred until the deployment and schema lifecycle require
versioned migrations.
