# Brookivka

Brookivka is a React Native AR tourism application for exploring historical landmarks in Lviv,
Ukraine. It combines a landmark catalog, map routes, camera-based AR, and an AI guide.

## Documentation

- [General project overview](docs/PROJECT_OVERVIEW.md)
- [AI project specification](docs/AI_PROJECT_SPECIFICATION.md)
- [AI implementation plan](docs/AI_IMPLEMENTATION_PLAN.md)

## Repository structure

```text
backend/   Spring Boot 3.2.4, Java 17, JPA/Hibernate, PostGIS API
frontend/  React Native 0.88.1 mobile application
infra/     AWS Terraform/OpenTofu infrastructure
docs/      Project and AI documentation
```

## Current features

- landmark catalog with PostGIS nearby search;
- interactive Lviv map and walking routes;
- Vision Camera AR preview and frame processor telemetry;
- Groq-powered backend AI guide endpoint;
- authentication/session and theme contexts in the mobile client;
- Docker Compose local backend environment;
- AWS S3, CloudFront, IAM, VPC endpoint, and EC2 infrastructure definitions.

The complete landmark recognition pipeline is planned but not yet implemented. The current AR
screen still uses demonstration landmark selection; detector, ROI cropping, embeddings, vector
search, GPS/heading fusion, and recognition API are documented in the AI plan.

## Quick start

### Backend and database

Requirements: Docker with Compose.

```bash
docker compose up --build
```

The backend is available on `http://localhost:8082`. PostGIS is available to the backend as
`db:5432` inside the Compose network and is not exposed to the host by default.

Optional environment variables:

```env
DB_PASSWORD=your-local-database-password
GROQ_API_KEY=your-groq-api-key
```

### Frontend

Requirements:

- Node.js `>=22.11.0`;
- Android Studio/SDK for Android, or Xcode/CocoaPods for iOS;
- a connected device or emulator.

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

`npm run setup` selects the local backend when it is reachable, otherwise it uses the optional
production environment file. On Android it also reverses ports `8081` and `8082` through ADB.

## Backend API

Nearby landmarks:

```http
GET /api/landmarks/nearby?lat=49.8418&lng=24.0316&radius=500
```

AI guide:

```http
POST /api/ai-guide/chat
Content-Type: application/json
```

```json
{
  "landmarkName": "Оперний Театр",
  "context": "Опис пам’ятки",
  "userMessage": "Розкажи про цю будівлю"
}
```

The Groq API key is used only by the backend and must never be included in the mobile app.

## Validation commands

```bash
cd frontend
npm run lint
npm test -- --runInBand
npx tsc --noEmit
```

Backend validation:

```bash
cd backend
mvn test
mvn package -DskipTests
```

## Development rules

- Keep secrets out of Git and mobile bundles.
- Use Hibernate `ddl-auto: update` for the current MVP.
- Keep spatial queries and geometry handling in the backend.
- Add the future recognition model as a separate Python service rather than embedding inference
  into the Spring Boot process.
- Preserve explicit `MATCHED`, `UNCERTAIN`, and `NOT_FOUND` recognition states.
- See the linked documentation before changing the AI architecture.
