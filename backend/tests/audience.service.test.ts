import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { User } from '../src/models/user.model.js';
import { Hostel } from '../src/models/hostel.model.js';
import { StudentRoomAllocation } from '../src/models/studentRoomAllocation.model.js';
import { AudienceService } from '../src/services/audience.service.js';
import { AuthUserContext, HostelCategory, UserRole } from '../src/types/index.js';

describe('AudienceService Unit Tests', () => {
  const adminUser: AuthUserContext = {
    id: new Types.ObjectId().toString(),
    email: 'admin@test.com',
    role: UserRole.ADMINISTRATOR,
  };

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_audience_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Hostel.deleteMany({});
    await StudentRoomAllocation.deleteMany({});
  });

  it('should resolve all users when target.all is true', async () => {
    await User.create([
      { name: 'S1', email: 's1@test.com', passwordHash: 'hash', role: UserRole.STUDENT },
      { name: 'W1', email: 'w1@test.com', passwordHash: 'hash', role: UserRole.WARDEN },
    ]);

    const recipients = await AudienceService.resolveRecipients({ all: true }, adminUser);
    expect(recipients.length).toBe(2);
  });

  it('should resolve recipients targeted by role', async () => {
    await User.create([
      { name: 'S1', email: 's1@test.com', passwordHash: 'hash', role: UserRole.STUDENT },
      { name: 'S2', email: 's2@test.com', passwordHash: 'hash', role: UserRole.STUDENT },
      { name: 'F1', email: 'f1@test.com', passwordHash: 'hash', role: UserRole.FACULTY },
    ]);

    const studentRecipients = await AudienceService.resolveRecipients(
      { roles: [UserRole.STUDENT] },
      adminUser,
    );
    expect(studentRecipients.length).toBe(2);
  });

  it('should resolve recipients targeted by hostel allocation', async () => {
    const hostel = await Hostel.create({
      name: 'Hostel A',
      code: 'HA',
      category: HostelCategory.BOYS,
    });

    const s1 = await User.create({
      name: 'S1',
      email: 's1@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });
    await User.create({
      name: 'S2',
      email: 's2@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });

    await StudentRoomAllocation.create({
      studentId: s1._id,
      hostelId: hostel._id,
      blockId: new Types.ObjectId(),
      roomId: new Types.ObjectId(),
      allocatedBy: adminUser.id,
    });

    const hostelRecipients = await AudienceService.resolveRecipients(
      { hostels: [hostel._id.toString()] },
      adminUser,
    );

    expect(hostelRecipients.length).toBe(1);
    expect(hostelRecipients[0].toString()).toBe(s1._id.toString());
  });
});
