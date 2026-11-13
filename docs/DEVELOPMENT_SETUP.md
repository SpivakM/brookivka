# Development Setup

## Required tools

### Backend

- Docker with Compose;
- Java 17 for local Maven execution;
- Maven or the project Maven wrapper when available.

### Frontend

- Node.js `>=22.11.0`;
- npm;
- Android Studio and SDK for Android;
- Xcode and CocoaPods for iOS;
- a device or emulator.

## Start the backend

From the repository root:

```bash
docker compose up --build
```

The backend listens on port `8082`. PostgreSQL/PostGIS is internal to the Compose network at
`db:5432` and persists in the `postgres_data` volume.

Local defaults are defined in `backend/src/main/resources/application.yml`. Override secrets and
deployment values with environment variables:

```env
DB_PASSWORD=...
GROQ_API_KEY=...
AWS_S3_REGION=eu-north-1
AWS_S3_BUCKET=...
AWS_CDN_BASE_URL=https://...
```

## Start the frontend

```bash
cd frontend
npm ci
npm run setup
npm start
```

In another terminal:

```bash
cd frontend
npm run android
```

`npm run setup` checks whether the local backend is reachable, detects a local network address,
optionally reads production configuration, and configures Android ADB reverse ports. Do not commit
machine-specific environment files or secrets.

For iOS:

```bash
cd frontend
npm ci
bundle exec pod install
npm run ios
```

## Common development flows

### Backend-only changes

```bash
docker compose up --build backend db
cd backend
mvn test
```

### Frontend-only changes

```bash
cd frontend
npm run lint
npx tsc --noEmit
npm test -- --runInBand
```

### API smoke check

```bash
curl -i "http://localhost:8082/api/landmarks/nearby?lat=49.8418&lng=24.0316&radius=500"
```

## Troubleshooting

| Symptom | Check |
|---|---|
| Backend cannot connect to database | `docker compose ps`, database health, and `db:5432` inside Compose |
| Device cannot reach backend | Run `npm run setup`, use ADB reverse, or verify the detected local IP |
| AI guide fails | Check backend `GROQ_API_KEY`; never put it in frontend configuration |
| Media upload fails | Check AWS region, bucket, CDN URL, IAM permissions, MIME type, and 10 MB limit |
| Camera fails | Check native permissions and Vision Camera setup on the target platform |
| Tests fail on missing tools | Record the missing dependency and environment in the pull request |

## Development boundaries

- Do not add Flyway/Liquibase without an ADR.
- Do not put AI inference or cloud credentials in the mobile app.
- Do not treat demo AR selection or demo AI-guide responses as production behavior.
- Update status, plans, and API documentation with behavior changes.
