import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import express from 'express';
import {
  initRealtimeServer,
  emitToUser,
  closeRealtimeServer,
} from '../src/modules/communication/services/realtime.service.js';
import { tokenService } from '../src/modules/auth/services/token.service.js';
import { UserRole } from '../src/types/index.js';

describe('RealtimeService Unit & Socket Integration Tests', () => {
  const userId = '6aa3b85ccc5d494004b0024e';
  let httpServer: ReturnType<typeof createServer>;
  let port: number;
  let validToken: string;

  beforeAll(async () => {
    const app = express();
    httpServer = createServer(app);
    initRealtimeServer(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });

    validToken = tokenService.generateAccessToken(userId, UserRole.STUDENT);
  });

  afterAll(async () => {
    await closeRealtimeServer();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it('should authenticate valid JWT socket client and join user room', async () => {
    const clientSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { token: validToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        clientSocket.disconnect();
        resolve();
      });
      clientSocket.on('connect_error', (err) => {
        reject(err);
      });
    });
  });

  it('should reject socket connection with invalid JWT', async () => {
    const invalidSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { token: 'invalid.token.here' },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      invalidSocket.on('connect_error', (err) => {
        expect(err.message).toBe('Authentication failed');
        invalidSocket.disconnect();
        resolve();
      });
    });
  });

  it('should receive realtime notification event when user is connected', async () => {
    const clientSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { token: validToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      clientSocket.on('connect', () => {
        const isEmitted = emitToUser(userId, 'notification:new', {
          title: 'Realtime Alert',
          body: 'Realtime Alert Body',
        });
        expect(isEmitted).toBe(true);
      });

      clientSocket.on('notification:new', (payload) => {
        expect(payload.title).toBe('Realtime Alert');
        clientSocket.disconnect();
        resolve();
      });

      clientSocket.on('connect_error', (err) => reject(err));
    });
  });
});
