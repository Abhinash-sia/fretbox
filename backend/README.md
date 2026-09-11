# Fretbox Backend — Phase B2 (Academic + Attendance)

Unified Campus Operations Platform — Backend Foundation, Authentication, RBAC, Academic Master Data, and Attendance Management.

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

## Attendance Calculation Formula

$$\text{attendancePercentage} = \frac{\text{present} + \text{late}}{\text{totalConductedSessions}} \times 100$$

- **Attended**: `present`, `late`
- **Not Attended**: `absent`, `excused` (for percentage calculation)
- **Low Attendance Threshold**: Default `75.0%` (configurable in `src/config/academic.config.ts`).

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

# Seed demo users, academic master data, and sample attendance sessions/records
npm run seed

# Run unit and integration tests
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

## Seed Data (Development Accounts & Academic Data)

Run `npm run seed` to populate demo accounts, department, program, academic year, semester, courses, class section, faculty assignments, student enrollments, and 4 sample attendance sessions for CS301.

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

### Academic Master Data (`/api/v1/academic`)
- `POST /api/v1/academic/departments` - Create department (Admin)
- `GET /api/v1/academic/departments` - List departments
- `POST /api/v1/academic/programs` - Create program (Admin)
- `GET /api/v1/academic/programs` - List programs
- `POST /api/v1/academic/years` - Create academic year (Admin)
- `GET /api/v1/academic/years` - List academic years
- `POST /api/v1/academic/semesters` - Create semester (Admin)
- `GET /api/v1/academic/semesters` - List semesters
- `POST /api/v1/academic/courses` - Create course (Admin)
- `GET /api/v1/academic/courses` - List courses
- `POST /api/v1/academic/sections` - Create class section (Admin)
- `GET /api/v1/academic/sections` - List class sections
- `POST /api/v1/academic/assignments` - Assign faculty to course/section (Admin)
- `GET /api/v1/academic/assignments` - List faculty assignments
- `POST /api/v1/academic/enrollments` - Enroll student in section (Admin)
- `GET /api/v1/academic/enrollments` - List student enrollments

### Attendance Management (`/api/v1/academic/attendance`)
- `POST /api/v1/academic/attendance/sessions` - Create attendance session (Assigned Faculty / Admin)
- `POST /api/v1/academic/attendance/sessions/:sessionId/records` - Mark attendance for students (Assigned Faculty / Admin)
- `GET /api/v1/academic/attendance/student/:studentId` - View student attendance summary & low-attendance status (Student self-view / Faculty / Admin)
- `GET /api/v1/academic/attendance/student/:studentId/course/:courseId` - View student course attendance summary
- `GET /api/v1/academic/attendance/course/:courseId` - View course attendance overview (Faculty / Admin)
- `PATCH /api/v1/academic/attendance/records/:recordId` - Correct attendance record with reason (Assigned Faculty / Admin)
- `GET /api/v1/academic/attendance/records/:recordId/audit` - View attendance correction audit history
