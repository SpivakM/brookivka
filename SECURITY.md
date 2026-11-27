# Security Policy

## Scope

This policy covers the Brookivka mobile application, Spring Boot backend, infrastructure
configuration, and future AI services.

## Reporting a vulnerability

Do not open a public issue for a security vulnerability. Report it privately to the project
maintainers with:

- affected component and version or commit;
- reproduction steps or proof of concept;
- potential impact;
- suggested mitigation, if known.

Do not include real credentials, private user data, or production secrets in the report.

## Security requirements

- Store secrets in environment variables or a managed secret store.
- Never put `GROQ_API_KEY`, AWS credentials, database passwords, or tokens in the mobile bundle.
- Keep the S3 bucket private and serve media through the configured CloudFront distribution.
- Validate upload MIME types, file size, and ownership on the backend.
- Do not log access tokens, API keys, raw private images, or precise location data unnecessarily.
- Apply authentication and authorization before adding administrative landmark or media operations.
- Use HTTPS for deployed APIs and restrict infrastructure security groups to required ports.

## Dependency and incident handling

Security-sensitive dependency updates should be reviewed separately from feature changes. Suspected
incidents must be recorded privately first, followed by credential rotation, containment, impact
assessment, and a documented recovery.
