# Fretbox Backend Architecture — Phase B2 (Academic + Attendance)

## Architectural Overview

Fretbox backend follows a modular, layer-separated architecture designed for high scalability, testability, and clear domain boundaries.

### Phase B2 Request Flow Diagram

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
Controller Layer (`academic.controller.ts`)
    │
    ▼
Service Layer (`academic.service.ts`, `attendance.service.ts`)
    │
    ▼
Mongoose Model Layer (`Department`, `Program`, `AcademicYear`, `Semester`, `Course`,
                      `ClassSection`, `FacultyAssignment`, `StudentEnrollment`,
                      `AttendanceSession`, `AttendanceRecord`, `AttendanceAudit`)
    │
    ▼
MongoDB Database (`fretbox` database on localhost:27017)
```

---

## Academic Domain Entity Relationships

```
Department
    │
    ▼
Program
    │
    ├──────────────► Course
    │
    ▼
Class Section
    │
    ├──────────────► Student Enrollment
    │
    └──────────────► Faculty Assignment
                         │
                         ▼
                  Attendance Session
                         │
                         ▼
                  Attendance Record ──► Attendance Audit
                         │
                         ▼
                 Attendance Summary & Low-Attendance Detection
```

---

## Attendance Calculation & Business Rules

### Official Attendance Calculation Formula

$$\text{attendancePercentage} = \frac{\text{present} + \text{late}}{\text{totalConductedSessions}} \times 100$$

- `present` = **attended**
- `late` = **attended**
- `absent` = **not attended**
- `excused` = **not attended** for the percentage calculation

> [!IMPORTANT]
> The backend calculates attendance dynamically from persisted attendance records using MongoDB aggregations. Percentage values are never accepted directly from client request payloads.

### Configurable Low-Attendance Threshold
- Centralized configuration in `src/config/academic.config.ts`.
- **Default Threshold**: `75.0%`.
- **Low Attendance Flag**: If `percentage < 75.0%`, `isLowAttendance` evaluates to `true`.

---

## Authorization Boundaries

- **Administrator**: Full CRUD access to academic master data (departments, programs, academic years, semesters, courses, sections, faculty assignments, student enrollments) and oversight of all attendance data.
- **Faculty**:
  - Can create attendance sessions ONLY for courses & class sections where they have an active `FacultyAssignment`.
  - Can mark attendance ONLY for students enrolled in that class section (`StudentEnrollment`).
  - Can correct attendance records for their assigned sessions with a mandatory reason log.
- **Student**:
  - Can view ONLY their own academic information and attendance summary.
  - Server-side self-ownership check (`req.user.id === studentId`). Accessing another student's attendance returns `403 Forbidden` (`ACADEMIC_FORBIDDEN`).
- **Unrelated Roles (Warden, Security, Staff)**: Denied access to academic management (`403 Forbidden`).

---

## Correction Workflow & Audit Trail

Attendance modification follows a strict non-destructive audit policy:
1. `AttendanceRecord` status is updated and `markedBy` is updated to the correcting user ID.
2. An immutable `AttendanceAudit` record is created storing:
   - `attendanceRecordId`
   - `studentId`
   - `attendanceSessionId`
   - `previousStatus`
   - `newStatus`
   - `changedBy`
   - `reason`
   - `changedAt`
3. Audit logs can be retrieved via `GET /api/v1/academic/attendance/records/:recordId/audit`.
