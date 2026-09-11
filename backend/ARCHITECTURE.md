# Fretbox Backend Architecture — Phase B4 (Gate Pass & Security Domain)

## Architectural Overview

Fretbox backend follows a modular, layer-separated architecture designed for high scalability, testability, and clear domain boundaries across Academic, Operations, and Gate Pass/Security domains.

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
Controller Layer (`gatePass.controller.ts`, `gateEvent.controller.ts`, `hostel.controller.ts`, `complaint.controller.ts`, etc.)
    │
    ▼
Service Layer (`gatePass.service.ts`, `gateEvent.service.ts`, `hostel.service.ts`, etc.)
    │
    ▼
Mongoose Model Layer (`GatePass`, `GateEvent`, `Hostel`, `Room`, `Complaint`, `User`, etc.)
    │
    ▼
MongoDB Database (`fretbox` database on localhost:27017)
```

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
