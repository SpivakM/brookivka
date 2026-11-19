# Brookivka: детальний план реалізації AI-функціоналу

## 1. Мета

Реалізувати в Brookivka надійне розпізнавання історичних об’єктів у кадрі камери з використанням:

1. просторової фільтрації PostGIS;
2. детекції об’єкта та ROI cropping;
3. multi-view image embeddings;
4. vector search;
5. комбінованого visual/geo/heading reranking;
6. AR-overlay у React Native;
7. AI-гіда на основі підтверджених даних пам’ятки.

План розрахований на поточний стек:

- React Native 0.88.1 + TypeScript;
- Spring Boot 3.2.4 + Java 17;
- PostgreSQL/PostGIS;
- Hibernate Spatial;
- окремий Python AI-service;
- FAISS для локального MVP;
- Qdrant як майбутній production vector store.

**Flyway/Liquibase у цьому плані не використовуються.** Схема змінюється через JPA/Hibernate, `ddl-auto: update`, entity-анотації та SQL для специфічних spatial-індексів.

Поточний `dev` є єдиним source of truth. Він уже містить dynamic `API_URL`
setup, ADB port reverse, Vision Camera, authentication/settings UI, Groq
AI-guide та S3/CloudFront/IAM/EC2 cloud layer.

---

## 2. Принципи реалізації

### 2.1. Спочатку retrieval, не навчання з нуля

Для першої версії не потрібно навчати власну нейромережу. Треба:

- зібрати якісні reference images;
- використати готову detector-модель;
- використати готову embedding-модель;
- перевірити якість на реальному каталозі Львова;
- лише після вимірювання якості вирішувати, чи потрібен fine-tuning.

### 2.2. Географія зменшує пошук, але не визначає об’єкт

GPS дає список можливих кандидатів. Візуальна модель визначає, який із них видно в кадрі. Не можна повертати найближчу пам’ятку без visual evidence.

### 2.3. Невпевненість — валідний результат

Система повинна вміти повертати:

- `MATCHED`;
- `UNCERTAIN`;
- `NOT_FOUND`.

Якщо система не впевнена, вона не повинна показувати випадкову назву пам’ятки.

### 2.4. Backend і AI-service мають бути розділені

Spring Boot залишається основним API та джерелом metadata. Python відповідає за model inference, embeddings і vector search.

---

## 3. Цільова структура репозиторію

Після реалізації очікується приблизно така структура:

```text
brookivka/
├── backend/
│   └── src/main/java/org/example/
│       ├── controller/
│       │   ├── LandmarkController.java
│       │   ├── RecognitionController.java
│       │   └── AiGuideController.java
│       ├── dto/
│       │   ├── LandmarkResponseDto.java
│       │   ├── RecognitionResponseDto.java
│       │   └── AiGuideMessageDto.java
│       ├── entity/
│       │   ├── Landmark.java
│       │   └── LandmarkView.java
│       ├── repository/
│       │   └── LandmarkRepository.java
│       └── service/
│           ├── LandmarkService.java
│           ├── RecognitionService.java
│           └── AiGuideService.java
├── ai-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   ├── detection/
│   │   ├── embeddings/
│   │   ├── retrieval/
│   │   └── scoring/
│   ├── data/
│   │   ├── reference-images/
│   │   └── manifests/
│   ├── scripts/
│   │   ├── build_index.py
│   │   └── evaluate.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   └── src/
│       ├── modules/ar-scanner/
│       ├── modules/ai-guide/
│       └── services/
└── docs/
    ├── AI_PROJECT_SPECIFICATION.md
    └── AI_IMPLEMENTATION_PLAN.md
```

Назви можуть відрізнятися, але відповідальності модулів потрібно зберегти.

---

## 4. Фаза 0 — зафіксувати конфігурацію та контракти

### Завдання

1. Додати `ai-service/.env.example`.
2. Додати опис локального запуску AI-service у `docker-compose.yml`.
3. Зафіксувати модельні назви та версії.
4. Зафіксувати API-контракт recognition.
5. Зафіксувати максимальні розміри upload і timeout.

### Рекомендований `.env.example`

```env
AI_SERVICE_PORT=8090
AI_SERVICE_HOST=0.0.0.0

DETECTION_MODEL=yolo11n.pt
EMBEDDING_MODEL=facebook/dinov2-base
EMBEDDING_DIMENSION=768
MODEL_VERSION=recognition-v1

VECTOR_STORE=faiss
FAISS_INDEX_PATH=/app/data/index/landmarks.faiss
FAISS_METADATA_PATH=/app/data/index/metadata.json

MAX_IMAGE_BYTES=8388608
MAX_IMAGE_WIDTH=1920
MAX_IMAGE_HEIGHT=1920
INFERENCE_TIMEOUT_MS=3000

GEO_SEARCH_RADIUS_METERS=100
SCULPTURE_VISIBILITY_RADIUS_METERS=30
VISUAL_WEIGHT=0.60
GEO_WEIGHT=0.30
HEADING_WEIGHT=0.10
MATCH_THRESHOLD=0.75
MATCH_MARGIN_THRESHOLD=0.08

BACKEND_BASE_URL=http://backend:8082
GROQ_API_KEY=
AWS_S3_REGION=eu-north-1
AWS_S3_BUCKET=
AWS_CDN_BASE_URL=
```

Секрети LLM і vector database не зберігати в `.env.example` зі значеннями. У Git комітиться лише шаблон.

### Критерії готовності

- назви змінних однакові в local, staging і production;
- секрети не потрапляють у Git;
- model version повертається в API-відповіді;
- threshold і ваги можна змінювати без редагування коду.
- media configuration is available to the backend without exposing AWS credentials
  to the mobile application.

---

## 5. Фаза 1 — розширити модель пам’ятки в Hibernate

### 5.1. Оновити `Landmark`

Файл:

```text
backend/src/main/java/org/example/entity/Landmark.java
```

Додати:

```java
public enum LandmarkType {
    BUILDING,
    SCULPTURE,
    MONUMENT,
    OTHER
}
```

До entity додати:

```java
@Enumerated(EnumType.STRING)
@Column(name = "object_type", nullable = false)
private LandmarkType objectType;

@Column(name = "footprint", columnDefinition = "GEOMETRY(MultiPolygon, 4326)")
private MultiPolygon footprint;

@Column(name = "visibility_radius_m")
private Double visibilityRadiusMeters;

@Column(nullable = false)
private Boolean active;
```

Для простих будівель можна почати з `Polygon`, але `MultiPolygon` краще підтримує комплекси з кількома частинами.

### 5.2. Зберегти backward compatibility

Поточне `location Point` не видаляти. Воно потрібне:

- для існуючого frontend;
- для картографічного marker;
- як fallback для об’єктів без footprint;
- для обчислення приблизного bearing.

Логіка:

```text
BUILDING + footprint != null -> використовувати footprint
інші випадки -> використовувати location + visibility radius
```

### 5.3. Hibernate-конфігурація

Поточний підхід залишається:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

Для локального MVP це прийнятно. Потрібно не додавати паралельно Flyway/Liquibase.

### 5.4. Spatial indexes

JPA `@Index` не гарантує коректне створення GiST index для PostGIS. Для локального MVP можна виконати SQL після створення таблиці:

```sql
CREATE INDEX IF NOT EXISTS idx_landmarks_location_gist
ON landmarks USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_landmarks_footprint_gist
ON landmarks USING GIST (footprint);
```

Цей SQL можна запускати:

- вручну під час локального налаштування;
- через окремий idempotent startup component;
- через `docker-entrypoint-initdb.d` для чистої локальної БД.

Не додавати destructive SQL, який видаляє колонки або дані.

### Критерії готовності

- backend стартує на чистій PostGIS БД;
- старі seed-дані продовжують завантажуватися;
- старий `/api/landmarks/nearby` не ламається;
- footprint може бути `null`;
- building із footprint знаходиться навіть біля дальньої стіни.

---

## 6. Фаза 2 — оновити seed-дані та nearby API

### 6.1. Оновити `DataInitializer`

Файл:

```text
backend/src/main/java/org/example/config/DataInitializer.java
```

Для кожної пам’ятки додати:

- `objectType`;
- `active`;
- `visibilityRadiusMeters`;
- footprint для щонайменше 2–3 тестових будівель.

На першому етапі footprint можна задати як приблизні тестові полігони, але вони повинні бути замінені на перевірені геодані до production.

### 6.2. Оновити SQL nearby search

Файл:

```text
backend/src/main/java/org/example/repository/LandmarkRepository.java
```

Пошук має враховувати тип геометрії:

```sql
ST_DWithin(
    COALESCE(l.footprint, l.location)::geography,
    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
    :radiusMeters
)
```

На практиці для різних типів може бути зрозуміліше мати окремі умови:

```sql
(
  l.object_type = 'BUILDING'
  AND l.footprint IS NOT NULL
  AND ST_DWithin(l.footprint::geography, :userPoint::geography, :radiusMeters)
)
OR
(
  (l.object_type <> 'BUILDING' OR l.footprint IS NULL)
  AND ST_DWithin(l.location::geography, :userPoint::geography, l.visibility_radius_m)
)
```

Запит повинен також повертати або обчислювати:

- `distanceMeters`;
- `bearingDegrees`;
- `objectType`.

### 6.3. DTO

Файл:

```text
backend/src/main/java/org/example/dto/LandmarkResponseDto.java
```

Додати поля:

```text
objectType
distanceMeters
bearingDegrees
visibilityRadiusMeters
```

### Критерії готовності

- `radius` задається в метрах;
- longitude/latitude не переплутані;
- nearby query працює з `Point`, `Polygon`, `MultiPolygon`;
- повертаються тільки `active = true` записи;
- є тести для будівлі, статуї та об’єкта поза radius.

---

## 7. Фаза 3 — створити dataset reference images

### 7.1. Формат каталогу

```text
ai-service/data/reference-images/
└── landmark-3/
    ├── front-01.jpg
    ├── front-02.jpg
    ├── left-01.jpg
    ├── right-01.jpg
    ├── rear-01.jpg
    └── detail-01.jpg
```

### 7.2. Manifest

```json
[
  {
    "viewId": "landmark-3-front-01",
    "landmarkId": 3,
    "imagePath": "landmark-3/front-01.jpg",
    "objectType": "BUILDING",
    "viewType": "FRONT"
  }
]
```

### 7.3. Вимоги до зображень

Для кожного об’єкта:

- мінімум 5 views для MVP;
- бажано 10–15 views;
- різні кути огляду;
- різна дистанція;
- денне та хмарне освітлення;
- без watermark, якщо це заборонено ліцензією;
- зафіксоване джерело та право використання.

Потрібно додати негативні приклади: схожі фасади, церкви, куполи, статуї та випадкові міські сцени.

### Критерії готовності

- кожен `landmarkId` має manifest;
- кожен файл читається;
- немає битих або дубльованих images;
- dataset не містить приватних зображень без згоди;
- test images не використовуються при побудові index.

---

## 8. Фаза 4 — створити Python AI-service

### 8.1. Ініціалізація

Створити:

```text
ai-service/requirements.txt
ai-service/Dockerfile
ai-service/app/main.py
```

Залежності MVP:

```text
fastapi
uvicorn
pydantic-settings
python-multipart
numpy
opencv-python-headless
pillow
torch
torchvision
transformers
ultralytics
faiss-cpu
httpx
```

Версії потрібно зафіксувати після першого успішного запуску. Не використовувати floating major versions у production image.

### 8.2. Config module

Файл:

```text
ai-service/app/config.py
```

Використати typed settings. Усі threshold, paths, model names і timeout мають читатися з environment.

### 8.3. Health endpoints

Додати:

```http
GET /health
GET /ready
```

`/health` перевіряє, що процес живий. `/ready` перевіряє, що detector, embedding model і FAISS index завантажені.

### Критерії готовності

- AI-service запускається локально;
- `/health` повертає 200;
- `/ready` повертає 200 лише після завантаження моделей;
- помилки loading явно видно в логах.

---

## 9. Фаза 5 — реалізувати detector і ROI cropping

### 9.1. Detector

Початковий варіант:

```text
YOLO11n або YOLOv8n
```

Підтримувані категорії:

```text
building
sculpture
statue
monument
```

### 9.2. ROI pipeline

Порядок:

1. прочитати та перевірити image;
2. привести розмір до inference size;
3. виконати detection;
4. відкинути detections нижче `DETECTION_CONFIDENCE_THRESHOLD`;
5. вибрати релевантний box;
6. розширити box на 5–15%;
7. обрізати ROI;
8. передати ROI в embedding model.

Якщо кілька об’єктів мають близькі confidence, потрібно створити кілька ROI та повернути їх у retrieval. Не слід безумовно вибирати перший box.

### 9.3. Fallback

Якщо detector нічого не знайшов:

- виконати embedding повного кадру;
- зменшити `visualScore` або застосувати penalty;
- позначити `detectionFallback = true`;
- не повертати `MATCHED`, якщо немає достатнього margin.

### Unit tests

Перевірити:

- валідний box;
- box біля краю кадру;
- box, що виходить за межі;
- відсутній detection;
- кілька detection;
- занадто маленький box.

---

## 10. Фаза 6 — embeddings і FAISS index

### 10.1. Embedding model

Початковий baseline:

```text
DINOv2 base
```

Модель повинна:

- працювати на тому самому preprocessing для reference і query;
- повертати однакову dimensionality;
- давати L2-normalized vector;
- мати version у metadata.

### 10.2. Побудова index

Файл:

```text
ai-service/scripts/build_index.py
```

Алгоритм:

1. прочитати manifest;
2. завантажити кожне reference image;
3. виконати той самий preprocessing;
4. отримати embedding;
5. нормалізувати vector;
6. додати vector у FAISS;
7. зберегти `landmarks.faiss`;
8. зберегти `metadata.json`;
9. зберегти model name/version і checksum dataset.

### 10.3. Retrieval

На query:

1. створити embedding ROI;
2. виконати FAISS top-K search;
3. згрупувати results за `landmarkId`;
4. взяти найкращий view або top-3 aggregate;
5. передати candidates у reranker.

### Критерії готовності

- index можна відтворити однією командою;
- reference і query проходять однаковий preprocessing;
- `landmarkId` коректно дістається з metadata;
- зміна model version вимагає нового index;
- пошук не виконується по неактивних або неповних metadata.

---

## 11. Фаза 7 — реалізувати reranking

### 11.1. Вхід reranker

Для кожного кандидата:

```text
visualSimilarity
distanceMeters
bearingDegrees
headingDegrees
headingAccuracy
objectType
gpsAccuracyMeters
```

### 11.2. Нормалізація

```text
Svisual = normalize cosine similarity to [0, 1]
Sgeo = clamp(1 - effectiveDistance / searchRadius, 0, 1)
Sheading = max(0, cos(angleDifferenceRadians))
```

Якщо heading відсутній або `headingAccuracy` погана:

```text
Score = normalized(wv * Svisual + wg * Sgeo)
```

Інакше:

```text
Score = wv * Svisual + wg * Sgeo + wh * Sheading
```

### 11.3. Вибір статусу

```text
if no candidates:
    NOT_FOUND
elif top1.score < MATCH_THRESHOLD:
    UNCERTAIN
elif top1.score - top2.score < MATCH_MARGIN_THRESHOLD:
    UNCERTAIN
else:
    MATCHED
```

Порогові значення не вважати остаточними. Вони мають бути відкалібровані на validation dataset.

### Unit tests

Обов’язково протестувати:

- високий visual score + близький об’єкт;
- високий visual score + далекий об’єкт;
- близький, але візуально неправильний об’єкт;
- відсутній heading;
- поганий heading accuracy;
- однакові top-1/top-2;
- score нижче threshold;
- polygon distance замість centroid distance.

---

## 12. Фаза 8 — recognition API у Python

### Endpoint

```http
POST /recognition/match
Content-Type: multipart/form-data
```

Поля:

```text
image: binary, required
latitude: number, required
longitude: number, required
gpsAccuracyMeters: number, optional
headingDegrees: number, optional
headingAccuracy: number, optional
```

### Внутрішній pipeline

```text
validate input
    -> request nearby candidates from Spring Boot
    -> detect object
    -> crop ROI
    -> create embedding
    -> FAISS top-K
    -> filter results to nearby candidates
    -> rerank
    -> return response
```

Краще передавати список nearby candidate IDs з backend, а не дозволяти AI-service самостійно дублювати геологіку. Це зменшує розбіжності між сервісами.

### Response

```json
{
  "status": "MATCHED",
  "requestId": "uuid",
  "bestMatch": {
    "landmarkId": 3,
    "name": "Оперний Театр",
    "score": 0.91,
    "visualScore": 0.94,
    "geoScore": 0.88,
    "headingScore": 0.72,
    "distanceMeters": 46.3,
    "bearingDegrees": 271.4,
    "objectType": "BUILDING",
    "matchedViewId": "landmark-3-front-02"
  },
  "candidates": [],
  "detectionFallback": false,
  "modelVersion": "recognition-v1",
  "processingMs": 184
}
```

### Error responses

```text
400 — invalid coordinates, image or parameters
413 — image too large
408 — inference timeout
503 — model/index not ready
500 — unexpected processing error
```

Ніколи не повертати HTTP 200 із фальшивим `bestMatch` при помилці.

---

## 13. Фаза 9 — Spring Boot integration

### 13.1. Recognition controller

Створити:

```text
backend/src/main/java/org/example/controller/RecognitionController.java
```

Варіанти:

```http
POST /api/recognition/match
```

Spring Boot може:

1. прийняти image і metadata;
2. виконати nearby search;
3. передати image та candidate IDs у AI-service;
4. додати verified landmark metadata до відповіді;
5. повернути frontend стабільний DTO.

### 13.2. Service layer

Не розміщувати HTTP calls до AI-service безпосередньо в controller. Створити `RecognitionService` і typed client через `WebClient` або `RestClient`.

Потрібно додати:

- connection timeout;
- read timeout;
- обмежену кількість retry лише для transient 5xx/connection errors;
- correlation/request ID;
- явне повідомлення про AI-service недоступність.

### 13.3. DTO

Не повертати JPA entities напряму. Створити:

```text
RecognitionResponseDto
RecognitionCandidateDto
RecognitionStatus
```

### Критерії готовності

- backend не падає, якщо AI-service недоступний;
- timeout повертається як зрозумілий 408/503;
- response містить verified landmark fields із PostGIS/backend;
- frontend не залежить від внутрішньої структури Python response.

---

## 14. Фаза 10 — інтеграція React Native AR

### 14.1. Дозволи та sensors

Додати:

- camera permission;
- location permission;
- compass/heading permission, якщо потрібна конкретній платформі;
- обробку denied/restricted states.

Не хардкодити координати Львова в `ARScannerScreen`.

### 14.2. Capture loop

Поточний одноразовий `fetchLandmarkFromDb` потрібно замінити на state machine:

```text
IDLE
  -> CAPTURING
  -> RECOGNIZING
  -> MATCHED / UNCERTAIN / NOT_FOUND
  -> IDLE
```

Правила:

- не запускати другий inference, поки перший не завершився;
- sampling interval 500–1000 мс;
- зупиняти requests, коли screen unmounts;
- скасовувати застарілі requests;
- оновлювати UI лише для найновішого request;
- стабілізувати результат 2–3 послідовними match-ами перед overlay.

### 14.3. UI states

AR UI повинен мати:

- `loading`: аналіз кадру;
- `matched`: назва, опис, distance;
- `uncertain`: «Поверніться ближче або наведіть камеру на об’єкт»;
- `notFound`: «Об’єкт не визначено»;
- `permissionError`;
- `networkError`;
- `retry`.

### 14.4. Navigation to AI guide

Передавати в `AIGuideScreen`:

```text
landmarkId
landmarkName
initialContext
recognitionConfidence
```

Не передавати довільний текст як verified fact, якщо recognition status не `MATCHED`.

---

## 15. Фаза 11 — реалізувати AI-гід

### 15.1. Поточний backend API

Backend уже має endpoint:

```http
POST /api/ai-guide/chat
```

Request:

```json
{
  "landmarkName": "Оперний Театр",
  "context": "Опис пам’ятки з бази",
  "userMessage": "Розкажи про Дзеркальну залу"
}
```

Response:

```json
{
  "reply": "..."
}
```

Поточна реалізація знаходиться у `AiGuideController` та `GroqGuideService` і
використовує Groq Chat Completions. Не створювати дубльований session API для
першої інтеграції.

Майбутні endpoints:

```http
POST /api/ai-guide/sessions
POST /api/ai-guide/sessions/{sessionId}/messages
```

Додавати їх лише тоді, коли потрібне серверне зберігання історії діалогу.

### 15.2. Context packet

Перед LLM передавати:

```json
{
  "landmarkId": 3,
  "name": "Оперний Театр",
  "description": "...",
  "fullDescription": "...",
  "architectureStyle": "Неоренесанс",
  "buildYear": 1900,
  "recognitionStatus": "MATCHED"
}
```

LLM має відповідати лише в межах verified context або явно казати, що інформація потребує перевірки.

### 15.3. Frontend

У `AIGuideScreen.tsx` замінити `setTimeout` на API client для
`POST /api/ai-guide/chat`:

- показувати sending state;
- блокувати повторну відправку або підтримувати queue;
- показувати timeout/error;
- повторювати невдале повідомлення;
- зберігати історію поточної сесії;
- не втрачати user message при помилці response;
- передавати `landmarkName`, verified `context` і `userMessage`;
- не зберігати `GROQ_API_KEY` у frontend.

---

## 16. Фаза 12 — docker-compose і середовища

### Local

```text
PostGIS      Docker network: db:5432
Spring Boot  localhost:8082
AI-service   localhost:8090 (коли буде доданий)
FAISS        local volume
Frontend     React Native Metro
```

Frontend local configuration:

```text
frontend/.env              API_URL=http://<local-ip>:8082
frontend/.env.production   API_URL=https://api.brookivka.com (optional runtime file)
```

`npm run setup` запускає `scripts/setup-env.js` і `scripts/reverse-ports.js`.
Setup перевіряє локальний backend, автоматично вибирає local/cloud API URL і
записує його в `.env`. ADB reverse прокидає порти `8081` і `8082`.

Коли Python AI-service буде створений, додати в `docker-compose.yml`:

```yaml
ai-service:
  build:
    context: ./ai-service
  ports:
    - "8090:8090"
  env_file:
    - ./ai-service/.env
  depends_on:
    - backend
  volumes:
    - ./ai-service/data:/app/data
```

Для CPU-only локального MVP не додавати GPU runtime без необхідності.

Поточний `docker-compose.yml` вже запускає PostGIS і backend, передає
`DB_PASSWORD` через environment substitution і не відкриває PostGIS на host.
Для AI-гід також потрібно передавати `GROQ_API_KEY` тільки в `backend`:

```yaml
backend:
  environment:
    GROQ_API_KEY: ${GROQ_API_KEY}
```

У production значення має надходити з secret manager, а не з committed `.env`.

### AWS/OpenTofu

`infra/main.tf` створює AWS ресурси в `eu-north-1`:

- приватний S3 bucket для media;
- CloudFront із Origin Access Control;
- IAM role/instance profile для EC2;
- VPC Gateway Endpoint для S3;
- EC2 `c7i-flex.large` із 25 GB gp3 і 2 GB swap;
- outputs `server_public_ip`, `cdn_base_url`, `media_bucket_name`.

Це не є повним CI/CD deployment: окремо потрібно налаштувати deploy pipeline,
налаштувати secrets, прив’язати `photoUrl`/media metadata до CDN URL і перевірити
AWS policy та costs.

### Staging

- окрема PostGIS база;
- окремий AI-service deployment;
- окремий FAISS index або Qdrant collection;
- тестовий dataset;
- debug logging без сирих images;
- health checks.

### Production

- secrets через secret manager;
- immutable model image;
- Qdrant замість локального FAISS при горизонтальному масштабуванні;
- object storage для reference images;
- metrics і tracing;
- backups PostGIS metadata;
- обмеження uploads і rate limiting.

---

## 17. Фаза 13 — тестування

### Backend tests

Додати тести для:

- nearby Point;
- nearby Polygon/MultiPolygon;
- radius у метрах;
- longitude/latitude order;
- inactive landmarks;
- missing footprint fallback;
- DTO mapping;
- AI-service timeout;
- invalid AI response;
- recognition status mapping.

### AI-service tests

Додати:

- input validation;
- image size/type validation;
- detector box normalization;
- no-detection fallback;
- embedding dimensions;
- FAISS metadata mapping;
- geo score;
- heading score;
- missing heading;
- threshold/margin statuses;
- top-K aggregation.

### Frontend tests

Додати:

- permission denied state;
- recognition loading;
- matched overlay;
- uncertain overlay;
- stale request ignored;
- unmount cancels request;
- navigation to AI guide only with valid landmark ID.

### Evaluation script

Створити:

```text
ai-service/scripts/evaluate.py
```

Виводити:

```text
Recall@1
Recall@5
precision for MATCHED
false-positive rate
UNCERTAIN rate
p50 latency
p95 latency
```

---

## 18. Фаза 14 — observability

Логувати структуровано:

```text
requestId
modelVersion
landmarkCandidateCount
detectionFound
detectionFallback
vectorSearchCount
top1Score
top2Score
scoreMargin
status
processingMs
```

Не логувати:

- raw camera frames;
- повні приватні координати без потреби;
- LLM API keys;
- access tokens;
- user chat content у production без policy/consent.

Потрібні метрики:

- recognition requests total;
- matched/uncertain/not-found counts;
- detector failures;
- AI-service 4xx/5xx;
- latency by stage;
- model version distribution.

---

## 19. Порядок виконання задач

Реалізовувати в такій послідовності:

1. Конфігурація і API DTO.
2. `Landmark` fields: type, footprint, radius, active.
3. Hibernate/PostGIS nearby query.
4. Seed polygon data.
5. Backend tests для spatial search.
6. Reference image dataset і manifest.
7. Спільний frontend API client із `API_URL` і auth token handling.
8. Python AI-service skeleton.
9. Detector і ROI cropping.
10. DINOv2 embeddings.
11. FAISS index builder.
12. Reranking і thresholds.
13. Python recognition endpoint.
14. Spring Boot recognition client/controller.
15. Device GPS/camera integration через Vision Camera.
16. AR state machine та overlay.
17. Frontend AI-guide integration із `/api/ai-guide/chat`.
18. За потреби завершити auth screens через `AuthContext` і додати backend
    `/api/auth/*`; поточний backend цих endpoints не містить, тому auth не
    блокуватиме перший recognition MVP.
19. Docker local environment із AI-service.
20. Evaluation dataset і quality thresholds.
21. Observability та production hardening.

Не переходити до AR integration, поки recognition endpoint не має стабільного response contract і тестів.

---

## 20. Definition of Done для MVP

MVP готовий, якщо:

- користувач надає camera/location permissions;
- backend знаходить spatial candidates через PostGIS;
- building search використовує footprint, якщо він доступний;
- detector знаходить ROI або повертає fallback;
- embedding/vector search повертає top-K;
- reranking рахує visual, geo, heading;
- система повертає `MATCHED`, `UNCERTAIN` або `NOT_FOUND`;
- hardcoded `id === 3` видалено;
- AR overlay показує реальний результат;
- AI-guide отримує verified landmark context через backend;
- локальне середовище запускається через Docker;
- є automated tests для критичної логіки;
- latency, model version і status доступні в логах;
- secrets і raw images не потрапляють у repository/logs.

---

## 21. Команди перевірки

### Backend

```bash
cd backend
./mvnw test
./mvnw package -DskipTests
```

Якщо Maven wrapper не доданий:

```bash
mvn test
mvn package -DskipTests
```

### Frontend

```bash
cd frontend
npm test -- --runInBand
npm run lint
npx tsc --noEmit
```

### AI-service

```bash
cd ai-service
python -m pytest
python scripts/build_index.py
python scripts/evaluate.py
```

### Docker

```bash
docker compose config
docker compose up --build
```

Перед запуском Docker перевірити доступність Docker daemon.

---

## 22. Рішення, які не потрібно змінювати зараз

- Не переходити з Hibernate на Flyway/Liquibase лише через додавання footprint.
- Не переносити всю inference-логіку в Java.
- Не навчати detector з нуля без dataset та evaluation.
- Не використовувати LLM для визначення landmark за фото.
- Не додавати Qdrant до MVP, якщо каталог малий і FAISS достатній.
- Не запускати inference на кожному camera frame.
- Не повертати nearest landmark як гарантований результат.

Перший практичний milestone: **PostGIS footprint search + Python baseline recognition на 5–10 пам’ятках + реальний AR response замість hardcoded landmark**.
