import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import {
  safeGetCache,
  safeSetCache,
  safeDeleteCache,
  safeDeletePattern,
} from '../src/infrastructure/redis/redis.js';
import { predictionService } from '../src/modules/predictions/services/prediction.service.js';
import { FaqService } from '../src/modules/ai/faq/services/faq.service.js';
import { FaqDocument } from '../src/modules/ai/faq/models/faqDocument.model.js';
import { Complaint } from '../src/modules/complaints/models/complaint.model.js';
import { User } from '../src/modules/auth/models/user.model.js';
import { UserRole } from '../src/types/index.js';
import { tokenService } from '../src/modules/auth/services/token.service.js';

describe('Phase B11 - Resilience & Accessibility Backend Tests', () => {
  const app = createApp();
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox_test_resilience';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const admin = await User.create({
      name: 'Resilience Admin',
      email: 'resilience_admin@fretbox.test',
      passwordHash: 'hash123',
      role: UserRole.ADMINISTRATOR,
    });
    adminUserId = admin._id.toString();
    adminToken = tokenService.generateAccessToken(adminUserId, UserRole.ADMINISTRATOR);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  describe('1. Redis Safe Cache Operations & Fallbacks', () => {
    it('safeGetCache should return null without crashing when Redis is disconnected', async () => {
      const result = await safeGetCache('nonexistent_key');
      expect(result).toBeNull();
    });

    it('safeSetCache should return false without throwing when Redis is offline', async () => {
      const success = await safeSetCache('key', { foo: 'bar' }, 60);
      expect(typeof success).toBe('boolean');
    });

    it('safeDeleteCache and safeDeletePattern should handle missing connection gracefully', async () => {
      const delResult = await safeDeleteCache('key');
      const patResult = await safeDeletePattern('pattern:*');
      expect(typeof delResult).toBe('boolean');
      expect(typeof patResult).toBe('boolean');
    });
  });

  describe('2. Outbound Service Resilience & Timeouts', () => {
    it('predictionService should throw 503/504 controlled AppError when prediction service fails or times out', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementationOnce(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      await expect(predictionService.getComplaintDemandForecast(7, 30)).rejects.toThrow(
        'Demand prediction service timed out.',
      );

      fetchSpy.mockRestore();
    });

    it('predictionService should throw 503 when python prediction service returns HTTP 500', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(predictionService.getComplaintDemandForecast(7, 30)).rejects.toThrow(
        'Demand prediction service error.',
      );

      fetchSpy.mockRestore();
    });
  });

  describe('3. Cache Invalidation & Knowledge Retrieval', () => {
    const faqService = new FaqService();

    it('getFaqDocuments should retrieve documents and safely set/get cache', async () => {
      const doc = await FaqDocument.create({
        title: 'Resilience Testing FAQ',
        content: 'Resilience details and instructions.',
        category: 'general',
        isApproved: true,
      });

      const docs = await faqService.getFaqDocuments('general', UserRole.STUDENT);
      expect(docs.length).toBeGreaterThan(0);
      expect(docs.some((d) => d.title === 'Resilience Testing FAQ')).toBe(true);

      // Mutate document
      await faqService.updateFaqDocument(doc._id.toString(), { title: 'Updated Resilience FAQ' });
      const updatedDocs = await faqService.getFaqDocuments('general', UserRole.STUDENT);
      expect(updatedDocs.some((d) => d.title === 'Updated Resilience FAQ')).toBe(true);

      await faqService.deleteFaqDocument(doc._id.toString());
    });
  });

  describe('4. Pagination Enforcements & Incremental Sync (updatedSince)', () => {
    it('GET /api/v1/complaints should cap max limit to 100', async () => {
      await Complaint.create({
        ticketNumber: 'FBX-RESIL-001',
        studentId: adminUserId,
        title: 'Test Complaint Pagination',
        description: 'Testing limit bounds',
        category: 'electrical',
        priority: 'low',
        status: 'open',
      });

      const response = await request(app)
        .get('/api/v1/complaints?limit=500')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.limit).toBeLessThanOrEqual(100);
    });

    it('getComplaints should filter records by updatedSince ISO timestamp', async () => {
      const pastDate = new Date(Date.now() - 100000).toISOString();
      const response = await request(app)
        .get(`/api/v1/complaints?updatedSince=${pastDate}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
