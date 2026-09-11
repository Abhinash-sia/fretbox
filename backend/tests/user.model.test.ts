import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../src/modules/auth/models/user.model.js';
import { UserRole } from '../src/types/index.js';

describe('User Mongoose Model', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_user' });
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
  });

  it('should successfully create and normalize a valid user', async () => {
    const userData = {
      name: 'Test Student',
      email: '  STUDENT@EXAMPLE.COM  ',
      passwordHash: '$2a$10$hashedpasswordstringsample',
      role: UserRole.STUDENT,
    };

    const user = await User.create(userData);

    expect(user._id).toBeDefined();
    expect(user.email).toBe('student@example.com'); // Lowercased and trimmed
    expect(user.role).toBe(UserRole.STUDENT);
    expect(user.isActive).toBe(true); // Default true
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  it('should exclude passwordHash when converting document to JSON', async () => {
    const user = await User.create({
      name: 'Secure User',
      email: 'secure@example.com',
      passwordHash: 'secret_hash_value',
      role: UserRole.FACULTY,
    });

    const json = user.toJSON();
    expect(json.passwordHash).toBeUndefined();
    expect(json.name).toBe('Secure User');

    const safeObj = user.toSafeObject();
    expect(safeObj.passwordHash).toBeUndefined();
    expect(safeObj._id).toBe(user._id.toString());
  });

  it('should fail validation when invalid role is provided', async () => {
    const invalidUserData = {
      name: 'Bad Role User',
      email: 'badrole@example.com',
      passwordHash: 'somehash',
      role: 'superhero' as unknown as UserRole,
    };

    await expect(User.create(invalidUserData)).rejects.toThrow();
  });

  it('should enforce unique email constraint', async () => {
    await User.create({
      name: 'User One',
      email: 'duplicate@example.com',
      passwordHash: 'hash1',
      role: UserRole.STUDENT,
    });

    await User.syncIndexes();

    await expect(
      User.create({
        name: 'User Two',
        email: 'duplicate@example.com',
        passwordHash: 'hash2',
        role: UserRole.WARDEN,
      }),
    ).rejects.toThrow();
  });
});
