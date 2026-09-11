import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { Complaint } from '../src/modules/complaints/models/complaint.model.js';
import { AttendanceRecord } from '../src/modules/academic/models/attendanceRecord.model.js';
import { AnalyticsService } from '../src/modules/analytics/services/analytics.service.js';
import {
  AttendanceStatus,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../src/types/index.js';

describe('AnalyticsService Unit Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_analytics_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await Complaint.deleteMany({});
    await AttendanceRecord.deleteMany({});
  });

  it('should categorize complaint ageing buckets correctly', async () => {
    const now = new Date();

    // 12 hours old (< 24h)
    const t12h = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    // 36 hours old (24-48h)
    const t36h = new Date(now.getTime() - 36 * 60 * 60 * 1000);
    // 60 hours old (48-72h)
    const t60h = new Date(now.getTime() - 60 * 60 * 60 * 1000);
    // 5 days old (3-7d)
    const t5d = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    // 10 days old (> 7d)
    const t10d = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    await Complaint.create([
      {
        ticketNumber: 'FBX-TEST-01',
        title: 'T1',
        description: 'D1',
        category: ComplaintCategory.PLUMBING,
        priority: ComplaintPriority.HIGH,
        status: ComplaintStatus.OPEN,
        createdAt: t12h,
      },
      {
        ticketNumber: 'FBX-TEST-02',
        title: 'T2',
        description: 'D2',
        category: ComplaintCategory.ELECTRICAL,
        priority: ComplaintPriority.MEDIUM,
        status: ComplaintStatus.IN_PROGRESS,
        createdAt: t36h,
      },
      {
        ticketNumber: 'FBX-TEST-03',
        title: 'T3',
        description: 'D3',
        category: ComplaintCategory.WATER,
        priority: ComplaintPriority.LOW,
        status: ComplaintStatus.ASSIGNED,
        createdAt: t60h,
      },
      {
        ticketNumber: 'FBX-TEST-04',
        title: 'T4',
        description: 'D4',
        category: ComplaintCategory.ROOM,
        priority: ComplaintPriority.URGENT,
        status: ComplaintStatus.REOPENED,
        createdAt: t5d,
      },
      {
        ticketNumber: 'FBX-TEST-05',
        title: 'T5',
        description: 'D5',
        category: ComplaintCategory.PLUMBING,
        priority: ComplaintPriority.HIGH,
        status: ComplaintStatus.OPEN,
        createdAt: t10d,
      },
    ]);

    const result = await AnalyticsService.getComplaintAnalytics({});

    expect(result.activeComplaints.count).toBe(5);
    expect(result.activeComplaints.ageingBuckets.under24h).toBe(1);
    expect(result.activeComplaints.ageingBuckets.between24and48h).toBe(1);
    expect(result.activeComplaints.ageingBuckets.between48and72h).toBe(1);
    expect(result.activeComplaints.ageingBuckets.between3and7d).toBe(1);
    expect(result.activeComplaints.ageingBuckets.over7d).toBe(1);
  });

  it('should calculate B2 attendance formula correctly (present + late) / total * 100', async () => {
    const studentId = new Types.ObjectId();
    const markedBy = new Types.ObjectId();

    // 10 total: 7 present, 1 late, 2 absent -> 80%
    await AttendanceRecord.create([
      {
        attendanceSessionId: new Types.ObjectId(),
        studentId,
        markedBy,
        status: AttendanceStatus.PRESENT,
      },
      {
        attendanceSessionId: new Types.ObjectId(),
        studentId,
        markedBy,
        status: AttendanceStatus.PRESENT,
      },
      {
        attendanceSessionId: new Types.ObjectId(),
        studentId,
        markedBy,
        status: AttendanceStatus.PRESENT,
      },
      {
        attendanceSessionId: new Types.ObjectId(),
        studentId,
        markedBy,
        status: AttendanceStatus.PRESENT,
      },
      {
        attendanceSessionId: new Types.ObjectId(),
        studentId,
        markedBy,
        status: AttendanceStatus.PRESENT,
      },
      {
        attendanceSessionId: new Types.ObjectId(),
        studentId,
        markedBy,
        status: AttendanceStatus.PRESENT,
      },
      {
        attendanceSessionId: new Types.ObjectId(),
        studentId,
        markedBy,
        status: AttendanceStatus.PRESENT,
      },
      {
        attendanceSessionId: new Types.ObjectId(),
        studentId,
        markedBy,
        status: AttendanceStatus.LATE,
      },
      {
        attendanceSessionId: new Types.ObjectId(),
        studentId,
        markedBy,
        status: AttendanceStatus.ABSENT,
      },
      {
        attendanceSessionId: new Types.ObjectId(),
        studentId,
        markedBy,
        status: AttendanceStatus.ABSENT,
      },
    ]);

    const lowAtt = await AnalyticsService.getLowAttendanceStudents({ threshold: 85 });
    expect(lowAtt.students.length).toBe(1);
    expect(lowAtt.students[0].attendancePercentage).toBe(80);
  });
});
