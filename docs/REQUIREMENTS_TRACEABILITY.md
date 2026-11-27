# Requirements Traceability

This document connects product requirements to implementation, documentation, and validation.
Update it when a requirement changes.

| Requirement | Current implementation | Target implementation | Validation |
|---|---|---|---|
| Browse landmarks | Landmark API and mobile catalog | Add complete loading/error states | API and screen tests |
| Find nearby landmarks | PostGIS point-based nearby query | Footprints, object types, spatial indexes | Spatial integration tests |
| View landmark media | S3 upload/delete and CloudFront URL | Authorization and lifecycle hardening | Media API tests |
| Ask the AI guide | Spring Groq endpoint | Connect mobile UI and harden errors/timeouts | Controller/service tests |
| Recognize a landmark | Not implemented; AR is telemetry/demo | Detector, ROI, embeddings, vector search, reranking | Held-out AI benchmark |
| Display AR result | Static/demo selection | GPS/heading-aware verified overlays | Device and UI tests |
| Authenticate users | Frontend context exists; backend contract incomplete | Implement and document auth endpoints | Integration and security tests |
| Deploy services | Docker Compose and Terraform components | Complete HTTPS, secrets, backups, monitoring | Deployment smoke tests |
| API reliability | Controllers and services exist | Stable validation, errors, timeouts, health checks, request IDs | Backend contract tests |
| Delivery process | Documentation and templates exist | Repeatable deployment, rollback, and ownership | Release and operations checks |

## Definition of done

A requirement is complete only when:

- implementation exists;
- API/UI behavior is documented;
- automated or reproducible validation exists;
- failure behavior is explicit;
- security and operational impact are reviewed;
- the status and roadmap are updated.
