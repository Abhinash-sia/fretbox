import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MessService } from '../src/services/mess.service.js';
import { MessMenu } from '../src/models/messMenu.model.js';
import { MessFeedback } from '../src/models/messFeedback.model.js';
import { User } from '../src/models/user.model.js';
import { MealType, UserRole, ConflictError } from '../src/types/index.js';

describe('MessService Unit Tests', () => {
  const messService = new MessService();

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_mess_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await MessMenu.deleteMany({});
    await MessFeedback.deleteMany({});
    await User.deleteMany({});
  });

  it('should create menu and handle student feedback submission & summary', async () => {
    const warden = await User.create({
      name: 'Warden Smith',
      email: 'warden@test.com',
      passwordHash: 'hash',
      role: UserRole.WARDEN,
    });

    const student1 = await User.create({
      name: 'Student One',
      email: 'student1@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });

    const student2 = await User.create({
      name: 'Student Two',
      email: 'student2@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });

    const menuDate = new Date();

    const menu = await messService.createMenu({
      date: menuDate,
      mealType: MealType.LUNCH,
      items: ['Paneer Butter Masala', 'Jeera Rice', 'Roti', 'Gulab Jamun'],
      description: 'Special North Indian Lunch',
      createdByUserId: warden._id.toString(),
    });

    expect(menu._id).toBeDefined();

    // Prevent duplicate menu for same date and mealType
    await expect(
      messService.createMenu({
        date: menuDate,
        mealType: MealType.LUNCH,
        items: ['Rajma Chawal'],
        createdByUserId: warden._id.toString(),
      }),
    ).rejects.toThrow(ConflictError);

    // Students submit feedback
    await messService.submitFeedback({
      menuId: menu._id.toString(),
      studentId: student1._id.toString(),
      rating: 5,
      comments: 'Delicious paneer!',
    });

    await messService.submitFeedback({
      menuId: menu._id.toString(),
      studentId: student2._id.toString(),
      rating: 3,
      comments: 'Roti was a bit cold',
    });

    // Summary calculation
    const summary = await messService.getFeedbackSummary(menu._id.toString());
    expect(summary.totalFeedbackCount).toBe(2);
    expect(summary.averageRating).toBe(4.0);
    expect(summary.ratingDistribution[5]).toBe(1);
    expect(summary.ratingDistribution[3]).toBe(1);
  });
});
