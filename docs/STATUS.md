# Project Status

**Last reviewed:** 2026-11-13  
**Branch baseline:** `dev`

## Working

- React Native mobile application with navigation, theme, and local session context.
- Spring Boot backend with JPA/Hibernate and PostgreSQL/PostGIS.
- Nearby landmark lookup through a spatial query.
- Vision Camera integration with frame processor telemetry.
- Groq-backed `POST /api/ai-guide/chat` endpoint.
- Landmark photo upload and deletion through private S3 and CloudFront.
- Docker Compose local database/backend environment.
- Terraform definitions for the current AWS storage and compute layer.
- Documentation index, contribution workflow, ADRs, roadmap, status, release, operations, and
  requirements-traceability files.

## In progress or incomplete

- Frontend authentication expects backend endpoints that are not complete.
- AI guide mobile screen still uses demo response behavior instead of the backend endpoint.
- `react-native-camera-kit` remains as a legacy dependency although Vision Camera is active.
- Backend and frontend API error handling are not yet standardized.
- No shared frontend API client exists yet.
- No repeatable application deployment pipeline exists yet.

## Not implemented

- Building footprints and object-type-aware landmark geometry.
- Detector, ROI cropping, embeddings, vector search, and recognition API.
- GPS/heading fusion for visual recognition.
- Multi-view reference dataset and evaluation benchmark.
- Production HTTPS reverse proxy, secrets manager integration, backups, and monitoring.

## Current blockers and risks

| Area | Risk | Next action |
|---|---|---|
| Recognition quality | No labeled reference/evaluation dataset | Define dataset manifest and collection rules |
| Schema evolution | Spatial fields are not yet modeled | Add entity fields and test-compatible PostGIS queries |
| Mobile/backend auth | Frontend and backend contracts differ | Define and implement the auth API |
| Operations | AWS layer is not a complete deployment pipeline | Document and implement deployment verification |
| API quality | Endpoint contracts and errors are inconsistent | Implement backend baseline and shared frontend client |
| Content pipeline | No curated import/review process | Define canonical data and media workflow |

## Next recommended work

1. Define the backend API contract and authentication behavior.
2. Add the landmark geometry/data model without breaking current point searches.
3. Create the AI dataset manifest and evaluation protocol.
4. Build the first offline retrieval benchmark before adding mobile inference.
5. Implement the global API error contract and shared frontend API client.
