# Brookivka: технічний опис проєкту та специфікація AI

## 1. Призначення документа

Цей документ є технічним handoff для розробника або команди, яка буде реалізовувати AI-функції проєкту Brookivka. Він описує:

- продукт і користувацькі сценарії;
- поточний стан репозиторію;
- цільову архітектуру розпізнавання пам’яток;
- контракт між мобільним клієнтом, backend, геобазою та AI-сервісом;
- модель даних, pipeline inference, формулу reranking;
- вимоги до якості, продуктивності, безпеки й тестування;
- поетапний план реалізації MVP.

Надані матеріали містять концепцію просторової фільтрації, ROI cropping, metric learning, multi-view embeddings і комбінованого reranking. У цьому документі ця концепція прив’язана до фактичної структури репозиторію.

## 2. Короткий опис продукту

Brookivka — мобільний туристичний застосунок для дослідження історичних пам’яток Львова. Користувач може:

1. переглядати список пам’яток із короткими описами;
2. знаходити об’єкти на інтерактивній карті;
3. відкривати AR-сканер із камерою;
4. отримувати коротку картку об’єкта поверх відеопотоку;
5. відкривати AI-гіда та ставити запитання про вибрану пам’ятку;
6. переглядати тематичні пішохідні маршрути.

Основна AI-цінність продукту — не просто показати найближчу точку на карті, а визначити, який саме об’єкт видно в кадрі, використовуючи одночасно:

- географічний контекст;
- візуальну схожість;
- тип і область об’єкта в кадрі;
- напрямок, у якому дивиться користувач.

## 3. Поточний стан репозиторію

### 3.1. Frontend

Мобільний застосунок розташований у `frontend/` і побудований на React Native 0.88.1, TypeScript та React Navigation.

Основні екрани:

- `EntryScreen` — стартовий екран;
- `ARScannerScreen` — камера та AR-overlay;
- `LandmarksScreen` — список пам’яток із пошуком;
- `MapScreen` — карта Львова та маршрути;
- `AIGuideScreen` — чат із AI-гідами.

Використовуються:

- `react-native-camera-kit` для камери;
- `react-native-maps` для карти;
- `react-native-safe-area-context`;
- `react-native-svg` для візуальних overlay-ефектів;
- `react-native-config` для `API_URL`.

Поточний AR-екран уже отримує пам’ятки через `/api/landmarks/nearby`, але координати користувача та цільовий об’єкт поки задані статично. Вибір об’єкта виконується через `id === 3` або перший результат. Це демонстраційна логіка, яку має замінити реальний AI pipeline.

`AIGuideScreen` наразі містить локальні тестові повідомлення та штучну відповідь через `setTimeout`. Підключення LLM/backend endpoint ще не реалізоване.

### 3.2. Backend

Backend розташований у `backend/` і побудований на:

- Spring Boot 3.2.4;
- Java 17;
- Spring Web;
- Spring Data JPA;
- Hibernate Spatial;
- PostgreSQL/PostGIS.

Поточна модель `Landmark` містить:

| Поле | Призначення |
|---|---|
| `id` | стабільний ідентифікатор пам’ятки |
| `name` | назва |
| `description` | короткий опис |
| `fullDescription` | повний опис для detail/AI context |
| `architectureStyle` | архітектурний стиль |
| `buildYear` | рік побудови |
| `photoUrl` | URL зображення |
| `category` | категорія |
| `location` | PostGIS `Point` у SRID 4326 |

Наявний endpoint:

```http
GET /api/landmarks/nearby?lat={latitude}&lng={longitude}&radius={meters}
```

Запит використовує `ST_DWithin` з приведенням до `geography`, тому `radius` задається в метрах. Backend повертає JSON зі значеннями `latitude` і `longitude`.

### 3.3. Інфраструктура

`docker-compose.yml` запускає:

- PostGIS 16 / 3.4 на порту `5432`;
- Spring Boot backend на порту `8082`.

Початкові дані завантажуються через `DataInitializer` і містять пам’ятки центрального Львова. Це seed-дані для MVP, а не повноцінний production catalog.

## 4. Цільова AI-функція

### 4.1. Вхідні дані

AI inference має приймати:

- один кадр із камери або серію кадрів;
- GPS користувача: latitude, longitude;
- heading/compass у градусах, якщо доступний;
- горизонтальну та вертикальну точність GPS;
- timestamp кадру;
- за можливості — device orientation і field of view камери.

Кадр не повинен автоматично надсилатися на сервер без явної потреби: базова обробка може виконуватися на пристрої, щоб зменшити latency, трафік і ризики приватності.

### 4.2. Вихідні дані

AI endpoint має повертати:

```json
{
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
    "objectType": "building",
    "matchedViewId": "landmark-3-front-02"
  },
  "candidates": [],
  "processingMs": 184,
  "modelVersion": "retrieval-v1"
}
```

Якщо впевненість нижча за поріг, `bestMatch` має бути `null`, а UI повинен показати невпевнений стан, а не вигадувати пам’ятку.

## 5. AI pipeline

### Етап 0. Валідація та нормалізація

Перед inference потрібно:

- перевірити діапазони GPS (`latitude` від -90 до 90, `longitude` від -180 до 180);
- нормалізувати heading до `[0, 360)`;
- відхилити надто старий кадр;
- перевірити MIME type, розмір і максимальну роздільність зображення;
- обрізати або стиснути кадр до погодженого inference size;
- врахувати `accuracy` GPS.

Невалідний input має повертати явну помилку 4xx, а не порожній успішний результат.

### Етап 1. Просторова фільтрація

#### Будівлі

Для будівель у production-базі потрібно зберігати полігони footprint, а не лише центральну точку. Це усуває помилку великого комплексу: користувач може стояти біля задньої стіни, тоді як centroid знаходиться далеко від нього.

Рекомендована модель:

```text
landmark
  id
  type = BUILDING | SCULPTURE | MONUMENT | OTHER
  footprint geometry(Polygon/MultiPolygon, 4326) nullable
  location geometry(Point, 4326) nullable
  visibility_radius_m
```

Для скульптур і монументів достатньо точки та малого радіуса видимості, зазвичай 15–30 м. Для будівель можна використовувати footprint і додатковий buffer, якщо GPS має похибку.

Просторовий запит має бути еквівалентом:

```sql
SELECT *
FROM landmarks
WHERE ST_DWithin(
  COALESCE(footprint::geography, location::geography),
  ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
  :radiusMeters
);
```

На таблиці необхідний GiST index:

```sql
CREATE INDEX idx_landmarks_spatial
ON landmarks
USING GIST (location);
```

Для polygon-поля індекс має бути окремим. Якщо база зберігає geography-колонки, індекс і тип запиту мають бути узгоджені з ними.

Початковий radius для MVP: 100 м. Для невпевненого GPS його можна збільшити до `min(250 м, baseRadius + accuracy)`. Просторова фільтрація повинна зменшити повний каталог до приблизно 5–15 кандидатів.

### Етап 2. Детекція об’єкта та ROI cropping

До побудови embedding кадр проходить через легку object-detection модель:

- YOLOv8n або YOLO11n як початковий варіант;
- класи: `building`, `sculpture`, `statue`, `monument`;
- результат: bounding box, confidence і, за можливості, segmentation mask.

Потрібно:

1. відкинути detection нижче confidence threshold;
2. розширити bounding box на 5–15%, щоб зберегти контекст фасаду;
3. обрізати ROI;
4. зберегти mapping ROI до повного кадру;
5. не включати зайві області: небо, асфальт, людей, транспорт;
6. якщо детекція неуспішна, використати повний кадр лише як fallback із нижчим score.

Для будівель бажано залишати частину контексту навколо фасаду, оскільки однакові фрагменти стін можуть зустрічатися в різних об’єктах. Для статуй, навпаки, ROI має бути щільнішим.

### Етап 3. Векторний пошук

Класифікатор із фіксованим списком класів не є достатнім: каталог пам’яток буде розширюватися. Потрібна модель retrieval/metric learning, наприклад:

- DINOv2 як сильний baseline;
- CosPlace або MixVPR для геолокаційно-стійких ознак;
- інша модель із L2-нормалізованими embeddings, якщо latency та ліцензія прийнятні.

Для кожної пам’ятки у vector store зберігається 5–15 views:

- фронтальний фасад;
- лівий і правий кут;
- дальній план;
- тильна сторона;
- характерні деталі;
- окремі ракурси скульптури.

Payload кожного вектора:

```json
{
  "landmarkId": 3,
  "viewId": "landmark-3-front-02",
  "objectType": "building",
  "source": "curated",
  "imageUrl": "...",
  "embeddingModel": "dinov2-base-v1",
  "version": 1
}
```

Для MVP можна використати FAISS локально в AI-service. Для production і кількох інстансів краще Qdrant або Milvus. Vector search виконується тільки для просторових кандидатів, а не для всього каталогу.

Результат — top-K view matches, наприклад `K=20`, які потім агрегуються до рівня `landmarkId` через максимум або top-3 weighted average.

### Етап 4. Комбінований reranking

Фінальний score:

```text
Score = wv * Svisual + wg * Sgeo + wh * Sheading
```

Початкові ваги для MVP:

```text
wv = 0.60
wg = 0.30
wh = 0.10
```

Ваги мають бути конфігураційними й калібруватися на validation set.

#### Візуальна схожість

`Svisual` — cosine similarity між embedding ROI кадру та найкращим embedding view кандидата. Значення потрібно привести до `[0, 1]`, якщо vector store повертає cosine distance або інший scale.

#### Географічна відповідність

Для точки:

```text
Sgeo = clamp(1 - distanceMeters / R, 0, 1)
```

Для polygon відстань має рахуватися до footprint, а не до centroid. `R` — effective search radius.

У production бажано враховувати точність GPS:

```text
effectiveDistance = max(0, distanceMeters - gpsAccuracyMeters)
```

#### Відповідність heading

Спочатку обчислюється bearing від користувача до найближчої точки об’єкта. Кутова помилка:

```text
delta = abs(((heading - bearing + 180) % 360) - 180)
```

Один із варіантів score:

```text
Sheading = max(0, cos(delta in radians))
```

Через магнітні перешкоди heading має найменшу вагу. Якщо heading відсутній або його точність низька, компонент треба виключити й перенормувати інші ваги, а не трактувати його як нульову впевненість.

#### Пороги

Потрібні щонайменше три результати:

- `MATCHED` — score вище production threshold і достатній margin над другим кандидатом;
- `UNCERTAIN` — кандидат є, але score/margin недостатні;
- `NOT_FOUND` — немає просторових або візуальних кандидатів.

Необхідно зберігати не лише абсолютний score, а й `margin = top1 - top2`. Це зменшує кількість помилкових позитивних відповідностей для схожих фасадів.

## 6. Цільова архітектура сервісів

```text
React Native app
   |
   | GPS, heading, frame/ROI
   v
Spring Boot API
   |-- PostGIS: landmark metadata and geometry
   |-- AI inference service: detection, embeddings, reranking
   |-- Vector DB: multi-view embeddings
   |-- LLM provider: contextual guide answers
```

AI inference service краще виділити в окремий Python-сервіс, оскільки екосистема YOLO, PyTorch, ONNX Runtime і FAISS/Qdrant орієнтована на Python. Spring Boot залишається системним API та gateway для мобільного клієнта.

Для першого MVP допустимий синхронний endpoint. Для production довгий inference або генерацію відповіді LLM можна перевести на async job, але UI має отримувати стабільний `requestId` і статус.

Рекомендовані endpoints:

```http
GET  /api/landmarks/nearby
POST /api/recognition/match
POST /api/ai-guide/sessions
POST /api/ai-guide/sessions/{sessionId}/messages
GET  /api/landmarks/{id}
```

`POST /api/recognition/match` має підтримувати `multipart/form-data` або pre-uploaded image URL. У production краще не приймати довільні URL від клієнта без allowlist/сканування.

## 7. AI-гід і контекст пам’ятки

AI-гід не повинен відповідати лише на основі назви об’єкта. Backend має сформувати context packet:

```json
{
  "landmark": {
    "id": 3,
    "name": "Оперний Театр",
    "description": "...",
    "fullDescription": "...",
    "architectureStyle": "Неоренесанс",
    "buildYear": 1900
  },
  "recognition": {
    "confidence": 0.91,
    "distanceMeters": 46.3
  },
  "conversation": []
}
```

LLM повинен:

- відповідати мовою користувача;
- відрізняти підтверджені факти від припущень;
- не вигадувати деталі, яких немає в knowledge base;
- не показувати внутрішні prompts, embeddings або технічні scores;
- повертати зрозумілу відповідь при низькій впевненості розпізнавання;
- підтримувати контекст сесії, але мати обмеження довжини історії.

Поточний `AIGuideScreen` потребує заміни локального `setTimeout` на API call, loading state, retry, timeout і повідомлення про помилку. Повідомлення користувача не слід втрачати при тимчасовому мережевому збої.

## 8. Розширення моделі даних

Мінімальна production-схема:

```text
landmarks
  id
  name
  description
  full_description
  category
  object_type
  architecture_style
  build_year
  location Point(4326)
  footprint Polygon/MultiPolygon(4326)
  visibility_radius_m
  active

landmark_views
  id
  landmark_id
  image_url
  view_type
  quality_score
  embedding_model
  embedding_version
  vector_id

recognition_requests
  id
  created_at
  latitude
  longitude
  gps_accuracy_m
  heading
  result_landmark_id
  score
  model_version
  processing_ms
```

Векторні значення не обов’язково зберігати в PostgreSQL. PostgreSQL має бути джерелом правди для metadata, а Qdrant/Milvus/FAISS — джерелом векторного індексу. `landmark_views.vector_id` зв’язує ці системи.

Поточний `ddl-auto: update` підходить для локального MVP. Flyway/Liquibase не є
обов’язковими для цього етапу: схема підтримується через JPA/Hibernate, а специфічні
PostGIS GiST-індекси створюються idempotent SQL-операціями. Міграційний інструмент можна
розглянути пізніше лише для окремих staging/production-схем, якщо з’явиться потреба
відтворювати їх незалежно від Hibernate.

## 9. Продуктивність

Цільові показники MVP:

| Метрика | Ціль |
|---|---:|
| PostGIS candidate query | < 50 мс |
| детекція + ROI на сучасному телефоні | < 300 мс |
| vector search для 5–15 кандидатів | < 100 мс |
| повний recognition request без LLM | < 1 с у median |
| UI response після кадру | не блокувати основний потік |

Оптимізації:

- робити inference не на кожному camera frame, а з throttle/debounce;
- повторно використовувати результат, якщо GPS/heading/кадр майже не змінилися;
- кешувати nearby landmarks на короткий TTL;
- передавати стиснуті ROI замість повнорозмірного відео;
- використовувати quantized ONNX/TFLite/Core ML модель на пристрої, якщо якість прийнятна;
- обмежувати top-K і кількість view embeddings;
- логувати latency окремо для PostGIS, detector, embedding, vector search і reranking.

## 10. Приватність і безпека

- Камера та GPS повинні працювати лише після дозволу користувача.
- Кадри не зберігати довше, ніж потрібно для inference, якщо користувач явно не погодився на dataset collection.
- Не логувати сирі зображення, access tokens або повні координати без потреби.
- Обмежити розмір upload і перевіряти тип файлу за вмістом.
- Додати rate limit на recognition та AI-guide endpoints.
- Відокремити публічні landmark metadata від адміністративного завантаження training images.
- Версіонувати моделі та мати можливість відкотити невдалу модель.
- Для збору training data потрібні правила згоди, видалення даних і маркування ліцензій зображень.

## 11. Навчальні дані та оцінювання

Для кожного landmark потрібні:

- мінімум 5 якісних views для MVP;
- рекомендовано 10–15 views для різного освітлення, сезону та дистанції;
- негативні приклади схожих будівель;
- окремий validation/test split, який не містить майже ідентичних кадрів із training split.

Метрики:

- detector: precision, recall, mAP за класами;
- retrieval: Recall@1, Recall@5, mAP;
- final recognition: top-1 accuracy серед spatial candidates;
- rejection quality: false-positive rate для `NOT_FOUND`;
- calibration: precision при порогах `MATCHED`;
- latency: p50/p95;
- robustness: день/ніч, дощ, часткове перекриття, натовп, різні телефони.

Ключовий acceptance test: якщо користувач знаходиться в межах footprint, система не повинна відкидати будівлю лише тому, що centroid далі за базовий radius.

## 12. План реалізації

### Фаза 1 — стабілізація геоданих

1. Додати `objectType`, `footprint`, `visibilityRadiusM`.
2. Оновити Hibernate entity/schema через `ddl-auto: update`.
3. Додати GiST indexes idempotent SQL-операціями.
4. Замінити статичні координати frontend на GPS device location.
5. Розширити `/nearby`, щоб повертати `distanceMeters`, `bearingDegrees`, тип об’єкта та geometry-derived metadata.

### Фаза 2 — recognition service baseline

1. Створити Python inference service.
2. Додати detector з одним baseline model.
3. Додати ROI cropping.
4. Створити embedding pipeline.
5. Додати FAISS index із 5–15 views на пам’ятку.
6. Реалізувати top-K retrieval і комбінований reranking.
7. Повернути `MATCHED`, `UNCERTAIN`, `NOT_FOUND`.

### Фаза 3 — інтеграція з мобільним клієнтом

1. Передавати актуальні GPS, heading і кадр.
2. Замінити hardcoded `id === 3`.
3. Показувати candidate confidence і невпевнений стан.
4. Додати throttle, retry, timeout та offline-friendly cache.
5. Не блокувати camera preview під час inference.

### Фаза 4 — AI-гід

1. Додати backend session/message endpoints.
2. Підключити LLM через provider abstraction.
3. Формувати context packet із verified landmark data.
4. Додати streaming або typing state за потреби.
5. Додати moderation, rate limiting і observability.

### Фаза 5 — якість і production

1. Зібрати реальний validation dataset.
2. Калібрувати ваги та thresholds.
3. Перейти від FAISS до Qdrant/Milvus, якщо потрібне горизонтальне масштабування.
4. Додати model registry/versioning.
5. Налаштувати метрики, трасування та regression tests.

## 13. Критерії готовності MVP

MVP вважається готовим, якщо:

- nearby search працює з актуальним GPS і PostGIS spatial index;
- будівлі шукаються за footprint, а не лише centroid;
- detector формує ROI або коректно повертає невпевнений стан;
- vector search використовує multi-view embeddings;
- final score враховує visual, geo і heading компоненти;
- система не вигадує результат нижче threshold;
- AR UI відображає фактично розпізнаний landmark;
- AI-гід отримує дані з backend, а не локальну тестову відповідь;
- є логи latency, model version і request outcome без сирих приватних кадрів;
- існують тести для геопошуку, score calculation, thresholding і API error cases.

## 14. Важливі обмеження поточної реалізації

Поточний репозиторій є UI/backend MVP і ще не містить:

- polygon footprints;
- detector або segmentation model;
- embedding model;
- vector database/index;
- реального recognition endpoint;
- device GPS/compass integration для AR;
- production LLM integration;
- migrations, authentication, rate limiting і model monitoring.

Тому AI-розробнику не слід трактувати поточний `Landmark.location Point` або статичний AR `fetch` як завершену архітектуру. Це стартовий контракт, який потрібно розширити без втрати сумісності зі списком пам’яток і картою.
