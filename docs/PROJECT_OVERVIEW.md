# Brookivka — General Project Description

## 1. Project purpose

Brookivka is a mobile AR tourism application for exploring historical landmarks in Lviv, Ukraine.
The application combines:

- an interactive landmark catalog;
- map-based exploration and walking routes;
- a camera-based AR scanner;
- an AI guide for landmark questions;
- user authentication and local session storage;
- configurable light/dark themes;
- a cloud-ready backend and media infrastructure.

The long-term AI objective is to identify the landmark visible in the camera frame. The recognition
system should combine geographic filtering, object detection, visual embeddings, vector retrieval,
and final ranking using visual, geographic, and compass-heading signals.

## 2. Current implementation status

The repository is an integrated MVP. The following functionality already exists:

- React Native mobile application for Android and iOS;
- navigation between home, AR scanner, landmarks, map, AI guide, authentication, and settings;
- Spring Boot REST backend;
- PostgreSQL/PostGIS database;
- Hibernate/JPA persistence with `ddl-auto: update`;
- nearby landmark search using PostGIS `ST_DWithin`;
- seed landmark data for central Lviv;
- Groq Chat Completions integration for the AI guide;
- Vision Camera preview and native frame processor telemetry;
- dynamic local/cloud API URL selection;
- AsyncStorage-based frontend auth session state;
- light/dark theme context;
- Docker Compose for PostGIS and backend;
- AWS infrastructure-as-code for EC2, S3, CloudFront, IAM, and an S3 VPC endpoint.
- backend landmark media upload/delete integration using AWS SDK and CloudFront URLs.

The complete visual recognition pipeline is not implemented yet. In particular, the repository does
not yet contain the production detector, ROI cropping, embedding model, vector index, recognition
endpoint, or real GPS/compass-driven AR matching.

## 3. Technology stack

### Mobile frontend

| Area | Technology |
|---|---|
| Framework | React Native 0.88.1 |
| Language | TypeScript |
| UI/runtime | React 19.3 |
| Navigation | React Navigation 7 |
| Camera | `react-native-vision-camera` 4.7.3 |
| Frame processing | `react-native-worklets-core` 1.6.2 |
| Maps | `react-native-maps` |
| Media/UI | `react-native-video`, `react-native-svg` |
| Configuration | `react-native-config` |
| Local storage | `@react-native-async-storage/async-storage` |
| Validation | Jest, ESLint, TypeScript |

### Backend

| Area | Technology |
|---|---|
| Framework | Spring Boot 3.2.4 |
| Language | Java 17 |
| API | Spring Web |
| Persistence | Spring Data JPA |
| ORM | Hibernate |
| Spatial support | Hibernate Spatial + JTS |
| Database | PostgreSQL with PostGIS 16 / 3.4 |
| External AI | Groq OpenAI-compatible Chat Completions API |
| Media SDK | AWS SDK for Java S3 |
| Build | Maven |

### Infrastructure

| Area | Technology |
|---|---|
| Local runtime | Docker Compose |
| Cloud IaC | Terraform/OpenTofu-compatible HCL |
| Region | AWS `eu-north-1` |
| Application server | EC2 `c7i-flex.large` |
| Media storage | Private S3 bucket |
| Media delivery | CloudFront with Origin Access Control |
| EC2 media access | IAM role and S3 VPC Gateway Endpoint |

## 4. Repository structure

```text
brookivka/
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/
│       ├── java/org/example/
│       │   ├── config/          # Seed data and application configuration
│       │   ├── controller/      # REST controllers
│       │   ├── dto/             # API request/response records and DTOs
│       │   ├── entity/          # JPA/Hibernate entities
│       │   ├── repository/      # Spring Data repositories and spatial SQL
│       │   └── service/         # External AI and business services
│       └── resources/
│           └── application.yml
├── frontend/
│   ├── package.json
│   ├── android/                 # Android native project
│   ├── ios/                     # iOS native project
│   ├── scripts/                 # API environment and ADB setup
│   └── src/
│       ├── modules/
│       │   ├── ai-guide/
│       │   ├── ar-scanner/
│       │   ├── auth/
│       │   ├── home/
│       │   ├── landmarks/
│       │   ├── map-routes/
│       │   └── settings/
│       ├── navigation/
│       ├── shared/components/
│       └── shared/context/
├── infra/
│   ├── main.tf
│   └── .terraform.lock.hcl
├── docs/
│   ├── PROJECT_OVERVIEW.md
│   ├── AI_PROJECT_SPECIFICATION.md
│   └── AI_IMPLEMENTATION_PLAN.md
├── docker-compose.yml
└── README.md
```

## 5. Main user-facing functions

### Home

The home screen is the application entry point. It provides branded navigation to the main
features and uses local media assets for the visual presentation.

### Landmark catalog

`LandmarksScreen` requests nearby landmarks from:

```http
GET /api/landmarks/nearby?lat={latitude}&lng={longitude}&radius={meters}
```

The screen supports text filtering by landmark name, description, category, and architectural
style. Landmark cards display the metadata returned by the backend.

### Map and routes

`MapScreen` uses `react-native-maps` to display Lviv and landmark markers. It also exposes a
collapsible list of predefined walking routes with distance, duration, rating, and image metadata.

### AR scanner

`ARScannerScreen` uses Vision Camera:

1. requests camera permission;
2. opens the rear camera;
3. runs a native frame processor;
4. reports frame dimensions and frame counters to JavaScript;
5. displays a visual landmark overlay;
6. can navigate to the AI guide for the selected landmark.

Current limitation: the frame processor is telemetry-only. The screen still uses a demonstration
nearby request with static coordinates and fallback landmark selection. It is not yet a real
visual recognition pipeline.

### AI guide

The backend exposes:

```http
POST /api/ai-guide/chat
```

Request:

```json
{
  "landmarkName": "Оперний Театр",
  "context": "Опис пам’ятки",
  "userMessage": "Розкажи про Дзеркальну залу"
}
```

Response:

```json
{
  "reply": "..."
}
```

`GroqGuideService` sends a Ukrainian-language system prompt and the user question to Groq. The
Groq key is read from the backend environment and must never be shipped to the mobile application.

The current frontend AI guide still contains demo messages and a local timeout response. The next
frontend task is to call `/api/ai-guide/chat`, preserve the conversation state, and handle loading,
timeouts, retries, and errors.

### Landmark media

The backend supports landmark photo management:

```http
POST /api/landmarks/{id}/photo
Content-Type: multipart/form-data

DELETE /api/landmarks/{id}/photo
```

Only JPEG, PNG, and WebP uploads are accepted. Uploads are limited to 10 MB per file/request.
`LandmarkMediaService` stores objects under `landmarks/{landmarkId}/...` in the private S3 bucket,
removes the previous managed object when replacing a photo, and saves the CloudFront URL in
`Landmark.photoUrl`.

### Authentication

`AuthContext` provides:

- login;
- registration;
- logout;
- token state;
- user profile state;
- initialization state;
- AsyncStorage persistence.

The frontend expects `/api/auth/login` and `/api/auth/register`, but the current backend does not
yet contain an authentication controller or implementation. Authentication is therefore a frontend
integration foundation, not a completed backend feature.

### Settings and themes

`ThemeContext` supports dark and light palettes. `SettingsScreen` exposes theme, language,
recognition frequency, search radius, notifications, permissions, support, and app-rating UI.
Some settings are currently UI-level state and are not yet persisted or connected to recognition
configuration.

## 6. Backend data model

The current `Landmark` entity contains:

```text
id
name
description
fullDescription
architectureStyle
buildYear
photoUrl
category
location: Point, SRID 4326
```

The current spatial query uses `ST_DWithin` with a geography cast, so the request radius is measured
in meters. The current model stores a point only. The AI recognition design requires extending it
with:

```text
objectType: BUILDING | SCULPTURE | MONUMENT | OTHER
footprint: Polygon/MultiPolygon, SRID 4326
visibilityRadiusMeters
active
```

Buildings should use footprints whenever available. Statues and monuments can use a point plus a
small visibility radius. The existing point should remain as a fallback and map marker coordinate.

## 7. AI recognition target architecture

```text
React Native + Vision Camera
        |
        | frame + GPS + heading
        v
Spring Boot API
        |
        | nearby candidate IDs and metadata
        v
Python AI service
        |
        | detector -> ROI -> embedding -> vector search -> reranking
        v
PostGIS + FAISS/Qdrant
```

### Recognition stages

1. Validate image, coordinates, GPS accuracy, and heading.
2. Query PostGIS for nearby candidate landmarks.
3. Detect `building`, `sculpture`, `statue`, or `monument`.
4. Crop and normalize the detected ROI.
5. Generate a normalized visual embedding.
6. Search multi-view reference embeddings.
7. Aggregate results by landmark ID.
8. Rerank using visual, geographic, and heading scores.
9. Return `MATCHED`, `UNCERTAIN`, or `NOT_FOUND`.

Recommended initial stack:

- YOLOv8n or YOLO11n for detection;
- DINOv2 as the first embedding baseline;
- FAISS for the small local MVP index;
- Qdrant later if the catalog or deployment scale requires a shared vector service.

Initial ranking weights:

```text
visual  = 0.60
geo     = 0.30
heading = 0.10
```

The system must use a score threshold and top-1/top-2 margin. A nearest landmark must not be
returned as a visual match without sufficient visual evidence.

## 8. Runtime configuration

### Backend

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/ar_tourist_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<database-password>
GROQ_API_KEY=<groq-key>
AWS_S3_REGION=eu-north-1
AWS_S3_BUCKET=<private-s3-bucket>
AWS_CDN_BASE_URL=https://<cloudfront-domain>
```

The AWS SDK uses the EC2 IAM instance profile in cloud deployments. Do not put long-lived AWS
access keys in application or frontend environment files.

### Frontend

`frontend/scripts/setup-env.js`:

1. checks whether the local backend responds on `127.0.0.1:8082`;
2. selects a local network URL when the backend is available;
3. otherwise reads `frontend/.env.production` if present;
4. falls back to a detected local IPv4 or Android emulator address `10.0.2.2`;
5. writes the selected `API_URL` to the runtime `.env`.

`frontend/scripts/reverse-ports.js` maps Android device ports `8081` and `8082` through ADB.

Do not store Groq keys, database passwords, AWS credentials, or private tokens in frontend
configuration.

## 9. Local environment

Start the backend stack:

```bash
docker compose up --build
```

The services are:

```text
db       PostGIS container, internal Docker address db:5432
backend  Spring Boot API, host port 8082
```

Start the frontend:

```bash
cd frontend
npm ci
npm run setup
npm start
```

Run Android:

```bash
cd frontend
npm run android
```

The current Node engine requirement is `>=22.11.0`.

## 10. Cloud infrastructure

`infra/main.tf` defines:

- a private S3 media bucket with randomized suffix;
- public-access blocking;
- S3 CORS configuration;
- CloudFront distribution with Origin Access Control;
- S3 Gateway VPC endpoint;
- EC2 IAM role and instance profile;
- EC2 `c7i-flex.large`;
- 25 GB gp3 root volume;
- 2 GB swap file;
- security group access for SSH and backend port `8082`;
- outputs for server IP, CDN URL, and bucket name.

This is infrastructure-as-code, not a complete deployment pipeline. Application deployment,
HTTPS/reverse proxy, secret management, backups, monitoring, and cost controls still require
separate implementation.

## 11. Engineering constraints

- Keep Hibernate as the schema mechanism for the current MVP; do not introduce Flyway/Liquibase
  unless the deployment model later requires versioned migrations.
- Keep PostGIS spatial logic in backend repositories/services.
- Keep model inference outside Spring Boot in a dedicated Python service.
- Never expose external AI keys to the mobile client.
- Treat `UNCERTAIN` and `NOT_FOUND` as valid user-facing outcomes.
- Do not log raw camera frames or secrets.
- Preserve the existing frontend navigation and API compatibility while adding recognition.
- Do not run recognition on every camera frame; throttle and cancel stale requests.

## 12. Related documentation

- [AI project specification](./AI_PROJECT_SPECIFICATION.md)
- [AI implementation plan](./AI_IMPLEMENTATION_PLAN.md)
