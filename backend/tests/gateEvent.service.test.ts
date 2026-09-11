import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { GateEventService } from '../src/services/gateEvent.service.js';
import { GateEvent } from '../src/models/gateEvent.model.js';
import { GatePass } from '../src/models/gatePass.model.js';
import { User } from '../src/models/user.model.js';
import { GatePassStatus, GateEventType, UserRole } from '../src/types/index.js';

describe('GateEventService Unit Tests', () => {
  const gateEventService = new GateEventService();

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_gateevent_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await GatePass.deleteMany({});
    await GateEvent.deleteMany({});
    await User.deleteMany({});
  });

  it('should list and retrieve gate events', async () => {
    const student = await User.create({
      name: 'Eve Student',
      email: 'eve@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });

    const security = await User.create({
      name: 'Guard Bob',
      email: 'guard@test.com',
      passwordHash: 'hash',
      role: UserRole.SECURITY,
    });

    const pass = await GatePass.create({
      passNumber: 'FBX-GP-2026-TEST01',
      studentId: student._id,
      reason: 'Home Visit',
      destination: 'Home',
      outDateTime: new Date(),
      expectedReturnDateTime: new Date(Date.now() + 3600000),
      status: GatePassStatus.USED,
    });

    const event = await GateEvent.create({
      gatePassId: pass._id,
      studentId: student._id,
      securityUserId: security._id,
      eventType: GateEventType.EXIT,
      gateId: 'north-gate',
    });

    const listResult = await gateEventService.getGateEvents({ gateId: 'north-gate' });
    expect(listResult.total).toBe(1);
    expect(listResult.gateEvents[0]._id.toString()).toBe(event._id.toString());

    const singleEvent = await gateEventService.getGateEventById(event._id.toString());
    expect(singleEvent._id.toString()).toBe(event._id.toString());
  });
});
