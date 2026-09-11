import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { HostelService } from '../src/services/hostel.service.js';
import { Hostel } from '../src/models/hostel.model.js';
import { HostelBlock } from '../src/models/hostelBlock.model.js';
import { Room } from '../src/models/room.model.js';
import { StudentRoomAllocation } from '../src/models/studentRoomAllocation.model.js';
import { User } from '../src/models/user.model.js';
import {
  HostelCategory,
  RoomStatus,
  AllocationStatus,
  UserRole,
  ConflictError,
} from '../src/types/index.js';

describe('HostelService Unit Tests', () => {
  const hostelService = new HostelService();

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_hostel_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await Hostel.deleteMany({});
    await HostelBlock.deleteMany({});
    await Room.deleteMany({});
    await StudentRoomAllocation.deleteMany({});
    await User.deleteMany({});
  });

  it('should create hostel and prevent duplicate code', async () => {
    const hostel = await hostelService.createHostel({
      name: 'Boys Hostel 1',
      code: 'BH1',
      category: HostelCategory.BOYS,
      capacity: 50,
    });
    expect(hostel._id).toBeDefined();
    expect(hostel.code).toBe('BH1');

    await expect(
      hostelService.createHostel({
        name: 'Duplicate Hostel',
        code: 'BH1',
        category: HostelCategory.BOYS,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('should create block and room, then allocate & vacate student', async () => {
    const hostel = await hostelService.createHostel({
      name: 'Girls Hostel 1',
      code: 'GH1',
      category: HostelCategory.GIRLS,
      capacity: 100,
    });

    const block = await hostelService.createBlock({
      hostelId: hostel._id.toString(),
      name: 'Block A',
      code: 'A',
      floors: 2,
    });

    const room = await hostelService.createRoom({
      blockId: block._id.toString(),
      roomNumber: '101',
      floorNumber: 1,
      capacity: 1,
    });

    const student = await User.create({
      name: 'Test Student',
      email: 'student@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });

    const admin = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      passwordHash: 'hash',
      role: UserRole.ADMINISTRATOR,
    });

    // Allocate room
    const alloc = await hostelService.allocateRoom({
      studentId: student._id.toString(),
      roomId: room._id.toString(),
      allocatedByUserId: admin._id.toString(),
      remarks: 'Allocated for term',
    });

    expect(alloc._id).toBeDefined();
    expect(alloc.status).toBe(AllocationStatus.ACTIVE);

    const updatedRoom = await Room.findById(room._id);
    expect(updatedRoom?.occupiedCount).toBe(1);
    expect(updatedRoom?.status).toBe(RoomStatus.FULL);

    // Double allocation check
    await expect(
      hostelService.allocateRoom({
        studentId: student._id.toString(),
        roomId: room._id.toString(),
        allocatedByUserId: admin._id.toString(),
      }),
    ).rejects.toThrow(ConflictError);

    // Vacate room
    const vacatedAlloc = await hostelService.vacateRoom(
      alloc._id.toString(),
      admin._id.toString(),
      'End of term',
    );
    expect(vacatedAlloc.status).toBe(AllocationStatus.VACATED);

    const roomAfterVacate = await Room.findById(room._id);
    expect(roomAfterVacate?.occupiedCount).toBe(0);
    expect(roomAfterVacate?.status).toBe(RoomStatus.AVAILABLE);
  });
});
