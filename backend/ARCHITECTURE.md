# Fretbox Backend Architecture — Modular Monolith

## Architectural Overview

Fretbox backend follows a clean **Modular Monolith** architecture. Code is organized by business domain under `src/modules/` rather than by development milestone phases. Shared cross-cutting concerns (authentication, rate limiting, error handling, database connection, Redis, logging) are maintained under `src/infrastructure/`, `src/config/`, `src/middlewares/`, `src/types/`, and `src/utils/`.

### Directory Tree & Domain Structure

```
src/
├── modules/
│   ├── auth/                      # Authentication & Token Management
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── routes/
│   ├── academic/                  # Academic Programs, Courses & Attendance
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── schemas/
│   ├── hostel/                    # Hostels, Rooms, Allocations, Assets & Mess
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── schemas/
│   ├── complaints/                # Complaint Management & Assignment
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── routes/
│   ├── gate-pass/                 # Gate Passes & Security Scan Events
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── schemas/
│   ├── communication/             # Announcements, Notifications & Socket.IO
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── schemas/
│   ├── analytics/                 # Operational Intelligence Aggregation
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── schemas/
│   ├── ai/                        # AI Features
│   │   ├── complaint-classification/
│   │   │   ├── providers/
│   │   │   ├── services/
│   │   │   └── schemas/
│   │   └── faq/
│   │       ├── models/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── routes/
│   │       └── schemas/
│   ├── predictions/               # Demand Forecasting Engine
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── schemas/
│   ├── calendar/                  # Academic Calendar Events
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── schemas/
│   ├── payments/                  # Student Fees, Razorpay Orders & Webhooks
│   │   ├── models/
│   │   ├── providers/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── schemas/
│   └── health/                    # Health & Readiness Status
│       ├── controllers/
│       ├── services/
│       └── routes/
├── infrastructure/
│   ├── mongodb/                   # MongoDB connection management
│   └── redis/                     # Redis client connection management
├── config/                        # Shared environment & logger configuration
├── middlewares/                   # Auth, RBAC, Validation, Error, & Rate limiters
├── types/                         # Shared application interface types & enums
├── utils/                         # Standardized API response formatters
├── app.ts                         # Express Application factory
└── server.ts                      # Server entrypoint & graceful shutdown
```

### Request Flow Diagram

```
Client HTTP Request / Socket.IO Connection
    │
    ▼
Express Framework (`app.ts`) + Socket.IO Server (`realtime.service.ts`)
    │
    ▼
Global Middlewares (Helmet, CORS, Baseline & Auth Rate Limiters, Pino Logger)
    │
    ▼
Authentication Middleware (`authenticate` / Socket JWT Handshake) ──► 401 Unauthorized
    │
    ▼
RBAC Authorization Middleware (`authorize(...roles)`) ──► 403 Forbidden
    │
    ▼
Route Handler & Zod Validation Middleware (`validate`)
    │
    ▼
Domain Controller Layer (`src/modules/<domain>/controllers/`)
    │
    ▼
Domain Service Layer (`src/modules/<domain>/services/`)
    │
    ▼
Mongoose Model Layer (`src/modules/<domain>/models/`)
    │
    ▼
MongoDB Database (`fretbox` database on localhost:27017)
```

---

## Phase B5 Communication & Real-Time Domain Architecture

### 1. System Communication Flow & Data Model
```
                    ┌───────────────┐
                    │ Administrator │
                    └───────┬───────┘
                            │
                            ▼
                    Create Announcement (DRAFT)
                            │
                            ▼
                    Target Resolution (AudienceService)
                            │
                            ▼
                    Persistent Notifications (MongoDB)
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
          MongoDB                    Socket.IO
        (Source of Truth)        (Realtime Dispatch)
               │                         │
               │                         ▼
               │                  Connected Clients (user:<userId> room)
               │
               ▼
       Read / Action Tracking
               │
               ▼
       Analytics & Stats
```

### 2. Announcement Lifecycle
```
DRAFT ──► PUBLISHED ──► EXPIRED
  │           │
  ▼           ▼
CANCELLED  CANCELLED
```
- Only `PUBLISHED` announcements resolve audience targets and trigger notification generation.
- Re-publishing an already published announcement is an **idempotent no-op**.

### 3. Notification Idempotency Strategy
Database-level uniqueness is enforced to prevent duplicate notifications:
```typescript
notificationSchema.index(
  { recipientId: 1, announcementId: 1, type: 1 },
  { unique: true, partialFilterExpression: { announcementId: { $type: 'objectId' } } }
);
```
Bulk creation executes with `{ ordered: false }` to gracefully handle duplicate key collisions.

### 4. Realtime Socket.IO & Offline Semantics
- **Socket Authentication**: Authenticated using verified JWT access tokens passed in handshakes. Attaches `{ id, role }` identity to socket.
- **User & Role Rooms**: Socket joins `user:<userId>` and `role:<role>`.
- **Durable Source of Truth**: MongoDB is authoritative. If a user is offline, notifications remain persisted with `deliveryStatus: 'pending'`. When reconnecting, clients retrieve unread notifications via REST API (`GET /api/v1/communication/notifications?unreadOnly=true`).

---

## Phase B4 Gate Pass & Security Domain Architecture

### 1. Gate Pass Lifecycle & State Model
```
Student Request (PENDING) ──► Warden Approval ──► Token Generated (APPROVED) ──► Security Scan Verification (USED)
       │                              │
       ▼                              ▼
  Student Cancel (CANCELLED)   Warden Reject (REJECTED)
```

#### Pass Status Transitions
- `PENDING` ──► `APPROVED` (by Warden/Admin), `REJECTED` (by Warden/Admin), or `CANCELLED` (by Student owner)
- `APPROVED` ──► `USED` (consumed upon valid Security scan), `EXPIRED` (if past expected return time without scan)

### 2. Cryptographic Token & Hash Architecture
```
Warden Approves Pass
     │
     ▼
Generate 32-byte Hex Token (`crypto.randomBytes(32).toString('hex')`)
     │
     ├──────────► SHA-256 Hashing (`crypto.createHash('sha256').update(rawToken).digest('hex')`)
     │                │
     │                ▼
     │            Stored as `tokenHash` in MongoDB (`select: false`)
     │
     ▼
Raw Token returned ONCE to Warden/Student API client
(Never persisted or logged)
```

### 3. Atomic Concurrency Protection Against Double-Scanning
To prevent race conditions where a QR token is scanned simultaneously at two different security posts:
```typescript
const consumedPass = await GatePass.findOneAndUpdate(
  {
    _id: pass._id,
    status: GatePassStatus.APPROVED,
    usedAt: { $exists: false },
  },
  {
    $set: {
      status: GatePassStatus.USED,
      usedAt: now,
    },
  },
  { new: true }
);

if (!consumedPass) {
  throw new ConflictError('Gate pass has already been used or modified', 'GATE_SCAN_CONFLICT');
}
```
If two requests execute concurrently for the same approved pass:
- **Request 1**: Matches `{ status: 'approved' }`, atomically updates status to `'used'`, returns `200 OK` with pass details and records a `GateEvent` audit log (`exit` / `entry`).
- **Request 2**: Fails to match the conditional update query because `status` is no longer `'approved'`. Returns `409 Conflict` (`GATE_SCAN_CONFLICT`).

### 4. Gate Event Audit Logging
Every successful gate pass scan automatically emits an immutable `GateEvent` record capturing:
- `gatePassId`: Reference to the consumed `GatePass`.
- `studentId`: Student user ID associated with the pass.
- `securityUserId`: Security staff ID executing the scan.
- `eventType`: `exit` or `entry` (inferred from timestamps).
- `gateId`: Campus gate identifier (e.g. `MAIN_GATE_NORTH`).
- `scannedAt`: ISO Timestamp of scan execution.

---

## Phase B3 Operations Domain Architecture

### 1. Hostel & Room Allocation System
```
Hostel ──► HostelBlock ──► Room ──► StudentRoomAllocation ◄── Student User
```
- **Capacity Rules**: Room capacity constraints are strictly enforced server-side. Occupied count increments upon active allocation and decrements upon vacate. Room status automatically switches between `AVAILABLE` and `FULL`.
- **Double Allocation Prevention**: Students can have at most one `ACTIVE` room allocation at any time.

### 2. Facility Asset Management
```
FacilityAsset (assetTag / assetCode) ──► Hostel / Block / Room / Common
```
- Assets represent campus equipment and infrastructure. Location types (`hostel`, `block`, `room`, `common`) link assets to dynamic campus physical locations.

### 3. Complaint Management & Ticket Lifecycle
```
Complaint Registration (FBX-YYYY-XXXXXX)
    │
    ▼
Assign Staff (ComplaintAssignment + Audit Log)
    │
    ▼
In Progress / Resolution (ComplaintAudit)
    │
    ▼
Resolved (Resolution Time Calculation) ──► Closed or Reopened
```

#### Status Transition Rules
- `OPEN` ──► `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`
- `ASSIGNED` ──► `IN_PROGRESS`, `RESOLVED`
- `IN_PROGRESS` ──► `RESOLVED`
- `RESOLVED` ──► `CLOSED`, `REOPENED`
- `CLOSED` ──► `REOPENED`

#### Resolution Time Formula
$$\text{resolutionTimeMinutes} = \text{round}\left( \frac{\text{resolvedAt} - \text{createdAt}}{1000 \times 60} \right)$$

#### Recurring Issue Detection
Aggregates maintenance complaint frequencies grouped by location (`hostelId`, `blockId`, `roomId`) or asset over configurable thresholds (default $\ge 3$) to identify facility bottlenecks.

### 4. Mess Management & Student Feedback
```
MessMenu (Hostel/Date/MealType) ──► MessFeedback (Student Rating 1-5 + Comments)
                                        │
                                        ▼
                            Mess Feedback Summary & Analytics
```
- Allows wardens to post daily/weekly meal menus.
- Enables students to rate meals (1-5 stars) with comments, aggregating average ratings and rating distributions.

---

## Attendance Calculation & Business Rules (Phase B2 Foundation)

### Attendance Calculation Formula
$$\text{attendancePercentage} = \frac{\text{present} + \text{late}}{\text{totalConductedSessions}} \times 100$$

- `present` = **attended**
- `late` = **attended**
- `absent` = **not attended**
- `excused` = **not attended** for percentage calculation

---

## Authorization Boundaries (RBAC)

- **Administrator**: Full system access across academic, campus operations, and security gate pass domains.
- **Warden**: Gate pass approval/rejection, hostels, blocks, room allocations, complaint assignments, and mess menus.
- **Security**: Gate pass scan verification and gate audit log viewing.
- **Staff**: Asset maintenance updates, complaint status resolution, and facility inspection.
- **Student**: Gate pass application & cancellation, room allocation viewing (`/allocations/my`), complaint registration/self-management, mess menu viewing, and mess feedback submission.

---

## Phase B8 — Campus FAQ & RAG Architecture

### 1. Grounded RAG Query Lifecycle
```
User Query (POST /api/v1/faq/query)
        │
        ▼
Validation (Zod faqQuerySchema)
        │
        ▼
FaqService.queryFaq()
        │
        ▼
FaqService.retrieveRelevantDocuments()
 ├── 1. MongoDB $text Search Index (title, content, tags)
 ├── 2. Regex Keyword Fallback ($or / $and keywords)
 └── 3. Role & Approval Scoping (isApproved: true, targetRoles)
        │
        ▼
Grounding Check (If documents == [], return ungrounded fallback answer)
        │
        ▼
GeminiProvider.answerFaqWithRag()
 ├── Is GEMINI_API_KEY configured?
 │     ├── YES ──► Prompt Gemini 2.5 Flash with structured JSON output schema (responseSchema)
 │     └── NO  ──► Deterministic Fallback using top retrieved document content
        │
        ▼
Validation & Formatting (Verify output, format response with sources & confidence score)
```

### 2. FAQ Knowledge Base Management (CRUD)
- **FaqDocument Model**: MongoDB collection storing approved campus knowledge (`title`, `content`, `category`, `tags`, `isApproved`, `targetRoles`).
- **Text Search Index**: Compound text index `{ title: 'text', content: 'text', tags: 'text' }` for fast keyword and semantic retrieval.
- **Access Control**:
  - `POST /api/v1/faq/documents` & `PATCH /api/v1/faq/documents/:id`: Restrictable to `ADMINISTRATOR` and `WARDEN`.
  - `GET /api/v1/faq/query`: Open to authenticated users (`STUDENT`, `FACULTY`, `STAFF`, `WARDEN`, `ADMINISTRATOR`) with automatic role-based document scoping.

---

## Phase B9 — Demand Prediction & Forecasting Architecture

### 1. Data & Prediction Flow
```
MongoDB Complaint History (`createdAt` timestamps)
        │
        ▼
Node.js Express Gateway (`GET /api/v1/admin/predictions/complaints`)
  ├── 1. RBAC Check (Role: ADMINISTRATOR only)
  ├── 2. Query Validation (Zod predictionQuerySchema)
  └── 3. Aggregation Pipeline (Daily complaint totals for history window)
        │
        ▼
PredictionService (`src/services/prediction.service.ts`)
        │ HTTP POST /predict (Payload: { horizonDays, historyDays, records })
        ▼
Python AI Microservice (`ai-service/app/main.py`)
  ├── 1. Continuous Time Series Generation (Zero-filling missing date gaps)
  ├── 2. Feature Engineering (day_of_week, day_of_month, month, is_weekend, lag_1, lag_7, rolling_mean_7, rolling_mean_14)
  ├── 3. Chronological Train/Test Split (80% Train, 20% Test)
  ├── 4. Baseline Evaluation (7-day Seasonal Naive Forecast)
  ├── 5. ML Model Training & Evaluation (RandomForestRegressor, random_state=42)
  ├── 6. Model Selection (Choose RandomForestRegressor if MAE <= Baseline MAE)
  └── 7. Iterative Multi-step Forecast & Metric Output
        │
        ▼
Node Response Validation (Zod pythonPredictionResponseSchema)
        │
        ▼
Admin JSON API Output ({ status, forecast, model, baseline, selectedModel })
```

### 2. Safeguards & Resilience
- **No Data Leakage**: Lags and rolling statistics are calculated strictly using past observations.
- **Data Minimum Check**: Requires $\ge 30$ continuous daily observations (`status: "insufficient_data"` if sparse).
- **Graceful Unavailability Fallback**: Returns `503 PREDICTION_SERVICE_UNAVAILABLE` without crashing Node backend if Python service is offline or times out (5000ms).

---

## Phase B11 — Accessibility & Resilience Architecture

### 1. Request Timeout & Outbound Resiliency
- **Global Request Timeout**: `requestTimeoutMiddleware` enforces a bounded request execution window (`REQUEST_TIMEOUT_MS=10000` default). If the server fails to complete a request within the deadline, it yields a standardized `408 REQUEST_TIMEOUT` error without crashing.
- **Outbound HTTP Service Timeouts**: External/downstream requests (such as Python prediction or AI endpoints) use `AbortController` signal timeouts (`PREDICTION_SERVICE_TIMEOUT_MS=5000`) and map execution errors to controlled `503 SERVICE_UNAVAILABLE` or `504 SERVICE_TIMEOUT` status codes.

### 2. Redis Degradation & Cache-Aside
- **Safe Redis Infrastructure Wrappers**: `safeGetCache`, `safeSetCache`, `safeDeleteCache`, and `safeDeletePattern` wrap Redis operations. If Redis is disconnected, unreachable, or throwing errors, operations return `null` / `false` and log warnings while DB operations continue.
- **Cache-Aside Pattern**: Read-heavy knowledge base (`GET /api/v1/ai/faq/documents`) checks Redis cache before querying MongoDB. On document creation/update/deletion, cache patterns (`faq:docs:*`) are invalidated.
- **Health vs Readiness Semantics**:
  - `GET /api/v1/health`: Checks process liveness (`status: 'ok'`, uptime, timestamp).
  - `GET /api/v1/health/readiness`: Checks MongoDB (critical requirement). If MongoDB is disconnected, returns `503 Unhealthy`. If Redis is offline while MongoDB is healthy, status reports `degraded` with HTTP 200, allowing core application operations to continue.

### 3. Query Resilience & Payload Compression
- **Pagination Safeguards**: All list queries enforce an upper limit bound `Math.min(limit, 100)` to prevent unbounded document retrieval.
- **Incremental Sync Support**: Read queries (such as `/api/v1/complaints`) support `updatedSince=<ISO_DATE>` query filters for lightweight delta sync by offline-aware clients.
- **Response Compression**: Express `compression()` middleware compresses JSON responses above threshold sizes.
