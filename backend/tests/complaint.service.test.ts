import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { ComplaintService } from '../src/services/complaint.service.js';
import { Complaint } from '../src/models/complaint.model.js';
import { ComplaintAssignment } from '../src/models/complaintAssignment.model.js';
import { ComplaintAudit } from '../src/models/complaintAudit.model.js';
import { User } from '../src/models/user.model.js';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  UserRole,
} from '../src/types/index.js';

describe('ComplaintService Unit Tests', () => {
  const complaintService = new ComplaintService();

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_complaint_service' });
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
    await ComplaintAssignment.deleteMany({});
    await ComplaintAudit.deleteMany({});
    await User.deleteMany({});
  });

  it('should register a complaint with FBX ticket number and audit log', async () => {
    const student = await User.create({
      name: 'Alice Student',
      email: 'alice@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });

    const complaint = await complaintService.createComplaint({
      studentId: student._id.toString(),
      title: 'Broken Light Switch',
      description: 'The light switch near the door is sparkling',
      category: ComplaintCategory.ELECTRICAL,
      priority: ComplaintPriority.HIGH,
    });

    expect(complaint._id).toBeDefined();
    expect(complaint.ticketNumber).toMatch(/^FBX-\d{4}-[A-Z0-9]{6}$/);
    expect(complaint.status).toBe(ComplaintStatus.OPEN);

    const auditLogs = await ComplaintAudit.find({ complaintId: complaint._id });
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].action).toBe('created');
  });

  it('should assign, transition status to resolved, and compute metrics', async () => {
    const student = await User.create({
      name: 'Bob Student',
      email: 'bob@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });

    const staff = await User.create({
      name: 'Charlie Staff',
      email: 'charlie@test.com',
      passwordHash: 'hash',
      role: UserRole.STAFF,
    });

    const warden = await User.create({
      name: 'Dave Warden',
      email: 'dave@test.com',
      passwordHash: 'hash',
      role: UserRole.WARDEN,
    });

    const complaint = await complaintService.createComplaint({
      studentId: student._id.toString(),
      title: 'Leaking Pipe',
      description: 'Bathroom pipe is leaking continuously',
      category: ComplaintCategory.PLUMBING,
    });

    // Assign complaint
    const assigned = await complaintService.assignComplaint({
      complaintId: complaint._id.toString(),
      assignedToStaffId: staff._id.toString(),
      assignedByUserId: warden._id.toString(),
      notes: 'Please check on priority',
    });

    expect(assigned.status).toBe(ComplaintStatus.ASSIGNED);
    expect(assigned.assignedToStaffId?._id.toString()).toBe(staff._id.toString());

    // Transition to RESOLVED
    const resolved = await complaintService.updateComplaintStatus({
      complaintId: complaint._id.toString(),
      status: ComplaintStatus.RESOLVED,
      performedByUserId: staff._id.toString(),
      userRole: UserRole.STAFF,
      resolutionNotes: 'Replaced pipe seal',
    });

    expect(resolved.status).toBe(ComplaintStatus.RESOLVED);
    expect(resolved.resolvedAt).toBeDefined();
    expect(resolved.resolutionTimeMinutes).toBeGreaterThanOrEqual(0);

    // Compute Metrics
    const metrics = await complaintService.getComplaintMetrics();
    expect(metrics.total).toBe(1);
    expect(metrics.statusCounts.resolved).toBe(1);
    expect(metrics.resolutionMetrics.totalResolved).toBe(1);
  });
});
