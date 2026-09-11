# Fretbox Backend — Phase B3 (Operations Domain)

Unified Campus Operations Platform — Backend Foundation, Authentication, RBAC, Academic Master Data, Attendance, Hostels, Facilities, Complaints, and Mess Management.

## Tech Stack

- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose (`fretbox` database)
- **Cache / Store**: Redis (`ioredis` foundation)
- **Password Hashing**: `bcryptjs`
- **Tokens**: `jsonwebtoken` (JWT Access & Refresh tokens with SHA-256 session revocation)
- **Validation**: Zod
- **Logging**: Pino & `pino-http`
- **Security**: Helmet, CORS, Baseline & Auth Rate Limiters (`express-rate-limit`)
- **Testing**: Vitest & Supertest
- **Code Quality**: ESLint, Prettier

---

## Canonical User Roles

1. `student`
2. `faculty`
3. `security`
4. `warden`
5. `staff`
6. `administrator`

---

## Operations Domain Overview (Phase B3)

Phase B3 introduces campus physical and operational management:

1. **Hostel & Room Allocation System**: Hostels, blocks, rooms, occupied count tracking, auto status management (`AVAILABLE` / `FULL`), and single-active-allocation enforcement per student.
2. **Facility Asset Management**: Infrastructure asset tracking with unique asset tags/codes, category classification, condition logging, and location association.
3. **Complaint & Ticket Lifecycle**: Non-guessable ticket number generation (`FBX-YYYY-XXXXXX`), staff assignment, audit history logging, resolution time calculation (in minutes), metrics analytics (status, priority, ageing brackets), and recurring hotspot detection.
4. **Mess Management & Student Feedback**: Daily/weekly meal menu publishing and 1-5 star student meal feedback submission with rating distribution analytics.

---

## Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Environment Variables:
- `MONGODB_URI=mongodb://localhost:27017/fretbox`
- `REDIS_URL=redis://localhost:6379`
- `PORT=3000`
- `NODE_ENV=development`
- `CORS_ORIGIN=*`
- `JWT_ACCESS_SECRET=dev_access_secret_fretbox_2026_super_secure_key_123_change_in_production`
- `JWT_REFRESH_SECRET=dev_refresh_secret_fretbox_2026_super_secure_key_456_change_in_production`
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=7d`

---

## Commands

```bash
# Install dependencies
npm install

# Run in development mode with live reloading
npm run dev

# Seed demo users, academic data, hostels, rooms, allocations, assets, complaints, mess menus & feedback
npm run seed

# Run unit and integration tests (63 tests across 18 suites passing)
npm test

# Check linting
npm run lint

# Format code
npm run format

# Build TypeScript to dist/
npm run build

# Start production build
npm run start
```

---

## Seed Data (Development Accounts)

Run `npm run seed` to populate demo accounts, academic data, hostels, blocks, rooms, room allocations, facility assets, complaints with audit logs, mess menus, and student feedback.

| Role | Email | Password |
| :--- | :--- | :--- |
| `student` | `student@fretbox.demo` | `Password123!` |
| `student` | `student2@fretbox.demo` | `Password123!` |
| `faculty` | `faculty@fretbox.demo` | `Password123!` |
| `security` | `security@fretbox.demo` | `Password123!` |
| `warden` | `warden@fretbox.demo` | `Password123!` |
| `staff` | `staff@fretbox.demo` | `Password123!` |
| `administrator` | `admin@fretbox.demo` | `Password123!` |

---

## API Endpoints

### Health & Auth
- `GET /api/v1/health` - Liveness status
- `GET /api/v1/health/readiness` - Dependency readiness status
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login → returns `{ accessToken, refreshToken, user }`
- `POST /api/v1/auth/refresh` - Exchange refresh token for new access token
- `POST /api/v1/auth/logout` - Revoke refresh token session
- `GET /api/v1/auth/me` - Authenticated user profile

### Academic Master Data & Attendance (`/api/v1/academic`)
- Department, Program, Academic Year, Semester, Course, Section, Enrollment, Session, and Attendance Endpoints.

### Hostels & Room Allocation (`/api/v1/hostels`)
- `POST /api/v1/hostels` - Create hostel (Admin, Warden)
- `GET /api/v1/hostels` - List hostels
- `GET /api/v1/hostels/:id` - Get hostel details
- `PATCH /api/v1/hostels/:id` - Update hostel (Admin, Warden)
- `POST /api/v1/hostels/blocks` - Create hostel block (Admin, Warden)
- `GET /api/v1/hostels/:hostelId/blocks` - List blocks by hostel
- `POST /api/v1/hostels/rooms` - Create room (Admin, Warden)
- `GET /api/v1/hostels/rooms/all` - List rooms
- `POST /api/v1/hostels/allocations` - Allocate room to student (Admin, Warden)
- `PATCH /api/v1/hostels/allocations/:id/vacate` - Vacate room allocation (Admin, Warden)
- `GET /api/v1/hostels/allocations/my` - Get current student room allocation (Student)
- `GET /api/v1/hostels/allocations` - List allocations (Admin, Warden, Staff)

### Facility Assets (`/api/v1/facilities`)
- `POST /api/v1/facilities` - Create asset (Admin, Warden, Staff)
- `GET /api/v1/facilities` - List assets with search & filters
- `GET /api/v1/facilities/:id` - Get asset details
- `PATCH /api/v1/facilities/:id` - Update asset (Admin, Warden, Staff)
- `DELETE /api/v1/facilities/:id` - Delete asset (Admin, Warden)

### Maintenance Complaints (`/api/v1/complaints`)
- `POST /api/v1/complaints` - Register complaint (All roles)
- `GET /api/v1/complaints` - List complaints (Student scoped to own; Staff/Warden/Admin filter all)
- `GET /api/v1/complaints/metrics` - Complaint analytics & resolution metrics (Admin, Warden, Staff)
- `GET /api/v1/complaints/recurring` - Recurring issue hotspot detection (Admin, Warden, Staff)
- `GET /api/v1/complaints/:id` - Get complaint details & audit trail
- `PATCH /api/v1/complaints/:id/assign` - Assign complaint to staff (Admin, Warden)
- `PATCH /api/v1/complaints/:id/status` - Update status (Self-ownership & role enforced)

### Mess Management (`/api/v1/mess`)
- `POST /api/v1/mess/menus` - Create meal menu (Admin, Warden)
- `GET /api/v1/mess/menus` - List meal menus
- `GET /api/v1/mess/menus/:id` - Get menu details
- `PATCH /api/v1/mess/menus/:id` - Update meal menu (Admin, Warden)
- `DELETE /api/v1/mess/menus/:id` - Delete meal menu (Admin, Warden)
- `POST /api/v1/mess/menus/:id/feedback` - Submit meal rating & review (Student)
- `GET /api/v1/mess/menus/:id/feedback/summary` - Get meal feedback summary & rating distribution
- `GET /api/v1/mess/menus/:id/feedback` - List meal feedback reviews (Admin, Warden, Staff)
