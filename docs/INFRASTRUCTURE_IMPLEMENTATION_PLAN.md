# Infrastructure and Deployment Implementation Plan

## Goal

Turn the current Docker Compose and Terraform foundation into a repeatable, secure deployment path.

## Phase 1: Configuration inventory

- List required variables for database, Groq, AWS, frontend, and future AI service.
- Separate local, development, staging, and production values.
- Remove secrets from tracked files and logs.
- Document which values are build-time versus runtime.

## Phase 2: Local environment

- Add health checks and explicit readiness dependencies to Compose.
- Persist database data through a named volume.
- Provide safe seed/reset instructions for development.
- Add a non-secret `.env.example`.
- Verify backend connects to `db:5432` and frontend setup selects the correct host URL.

## Phase 3: AWS baseline

- Validate Terraform plan before apply.
- Keep S3 public access blocked and CloudFront Origin Access Control enabled.
- Restrict IAM permissions to required bucket prefixes and operations.
- Restrict security groups to required ingress.
- Enable encryption, versioning, lifecycle rules, and logging where appropriate.
- Define backups for the database and recovery for EC2/container state.

## Phase 4: Application deployment

- Build immutable backend and future AI-service images.
- Define image tagging and rollback rules.
- Add service health checks before routing traffic.
- Add HTTPS termination and domain configuration.
- Keep AI inference isolated from the public network where possible.
- Add deployment smoke tests for health, nearby landmarks, media, AI guide, and auth.

## Phase 5: Observability and operations

- Centralize structured application logs.
- Track request latency, 4xx/5xx rates, database health, storage growth, and upstream Groq errors.
- Track AI model/index version and recognition latency without storing raw images by default.
- Add alerts with an owner and response procedure.
- Test restore and rollback instead of only documenting them.

## Exit criteria

- Deployment is reproducible from a clean checkout and documented credentials setup.
- HTTPS, health checks, secrets handling, backups, logs, and rollback are verified.
- Production access is least-privilege and auditable.
