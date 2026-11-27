# Contributing to Brookivka

## Before starting

Read:

- [Project overview](docs/PROJECT_OVERVIEW.md)
- [Current status](docs/STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture decisions](docs/adr/README.md)

Use GitHub Issues for work tracking and link the issue from every pull request.

## Branches

- `dev` is the integration branch and the current source of truth.
- Create short-lived branches from `dev`.
- Use `feature/<short-name>`, `fix/<short-name>`, `docs/<short-name>`, or `chore/<short-name>`.
- Do not commit directly to `dev`.

## Development rules

- Keep secrets out of Git and mobile bundles.
- Preserve the current Spring Boot, React Native, PostGIS, and AWS boundaries.
- Keep AI inference in a separate Python service when implementation begins.
- Use Hibernate `ddl-auto: update` for the current MVP; do not add a migration framework without an ADR.
- Update relevant documentation when behavior, configuration, or architecture changes.

## Pull requests

Every pull request should include:

- a concise summary;
- linked issue or requirement;
- testing performed and any limitations;
- screenshots or recordings for user-facing mobile changes;
- documentation updates when applicable.

Reviewers should verify behavior, error handling, security, compatibility, and documentation.

## Commits

Use imperative, focused commit messages such as:

```text
feat: add landmark photo upload
fix: handle missing nearby landmarks
docs: update deployment runbook
```

Keep unrelated refactors out of feature commits.

## Validation

Frontend:

```bash
cd frontend
npm run lint
npx tsc --noEmit
npm test -- --runInBand
```

Backend:

```bash
cd backend
mvn test
mvn package -DskipTests
```

If a command cannot run locally, record the reason in the pull request.
