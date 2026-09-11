# Fretbox Backend Architecture — Phase B3 (Operations Domain)

## Architectural Overview

Fretbox backend follows a modular, layer-separated architecture designed for high scalability, testability, and clear domain boundaries across Academic and Operations domains.

### Request Flow Diagram

```
Client HTTP Request
    │
    ▼
Express Framework (`app.ts`)
    │
    ▼
Global Middlewares (Helmet, CORS, Baseline & Auth Rate Limiters, Pino Logger)
    │
    ▼
Authentication Middleware (`authenticate`) ──► 401 Unauthorized
    │
    ▼
RBAC Authorization Middleware (`authorize(...roles)`) ──► 403 Forbidden
    │
    ▼
Route Handler & Zod Validation Middleware (`validate`)
    │
    ▼
Controller Layer (`hostel.controller.ts`, `facility.controller.ts`, `complaint.controller.ts`, `mess.controller.ts`)
    │
    ▼
Service Layer (`hostel.service.ts`, `facility.service.ts`, `complaint.service.ts`, `mess.service.ts`)
    │
    ▼
Mongoose Model Layer (`Hostel`, `HostelBlock`, `Room`, `StudentRoomAllocation`,
                      `FacilityAsset`, `Complaint`, `ComplaintAssignment`, `ComplaintAudit`,
                      `MessMenu`, `MessFeedback`)
    │
    ▼
MongoDB Database (`fretbox` database on localhost:27017)
```

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

- **Administrator**: Full system access across academic and campus operations domains.
- **Warden**: Full management over hostels, blocks, room allocations, complaint assignments, and mess menus.
- **Staff**: Asset maintenance updates, complaint status resolution, and facility inspection.
- **Student**: Room allocation viewing (`/allocations/my`), complaint registration/self-management, mess menu viewing, and mess feedback submission.
