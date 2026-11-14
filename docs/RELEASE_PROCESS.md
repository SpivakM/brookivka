# Release Process

## Release types

- **Development:** changes integrated on `dev`.
- **Candidate:** a tested commit selected for release validation.
- **Production:** a tagged backend/infrastructure release and a versioned mobile build.

## Release checklist

1. Confirm the scope and linked issues are complete.
2. Review [STATUS.md](STATUS.md) and update known limitations.
3. Run frontend lint, type-check, tests, and platform build checks.
4. Run backend tests and package/build checks.
5. Validate Docker Compose startup and health endpoints.
6. Review environment variables and confirm no secrets are committed.
7. Verify database compatibility and any required Hibernate schema updates.
8. For AI changes, record the experiment and model/index version.
9. Deploy to the intended environment.
10. Run smoke tests for landmarks, media, AI guide, and authentication.
11. Monitor logs and key errors after deployment.
12. Update `CHANGELOG.md`, tag the release, and record rollback instructions.

## Rollback

Rollback the application to the last known-good image or commit first. Do not manually delete
database columns or spatial data during an incident. Schema changes must remain backward-compatible
with the previous application version or have a documented recovery procedure.

## Mobile releases

Record the backend API version, environment URL, native dependency changes, platform build number,
permissions, and any migration or cache-clearing requirement.
