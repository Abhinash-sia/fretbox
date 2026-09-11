import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AuthUserContext, JWTPayload, UserRole } from '../types/index.js';

interface AuthenticatedSocket extends Socket {
  data: {
    user: AuthUserContext;
  };
}

let io: SocketIOServer | null = null;

export const initRealtimeServer = (httpServer: HttpServer): SocketIOServer => {
  const env = getEnv();

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
      methods: ['GET', 'POST'],
    },
  });

  // JWT Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const authHeader =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token;

      if (!authHeader || typeof authHeader !== 'string') {
        return next(new Error('Authentication token missing'));
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as JWTPayload;

      if (!decoded || !decoded.sub || !decoded.role) {
        return next(new Error('Invalid token payload'));
      }

      (socket as AuthenticatedSocket).data = {
        user: {
          id: decoded.sub,
          email: '', // Derived identity
          role: decoded.role as UserRole,
        },
      };

      next();
    } catch (error) {
      logger.debug({ error }, 'Socket authentication failed');
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const user = authSocket.data.user;

    const userRoom = `user:${user.id}`;
    const roleRoom = `role:${user.role}`;

    authSocket.join(userRoom);
    authSocket.join(roleRoom);

    logger.debug(
      { userId: user.id, role: user.role, socketId: socket.id },
      'Socket client connected',
    );

    socket.on('disconnect', (reason) => {
      logger.debug({ userId: user.id, socketId: socket.id, reason }, 'Socket client disconnected');
    });
  });

  logger.info('Socket.IO Realtime service initialized successfully');
  return io;
};

export const getIO = (): SocketIOServer | null => io;

export const emitToUser = (userId: string, event: string, payload: unknown): boolean => {
  if (!io) return false;
  const room = `user:${userId}`;
  const roomSockets = io.sockets.adapter.rooms.get(room);
  const isConnected = !!roomSockets && roomSockets.size > 0;

  io.to(room).emit(event, payload);
  return isConnected;
};

export const emitToRole = (role: UserRole, event: string, payload: unknown): void => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, payload);
};

export const closeRealtimeServer = async (): Promise<void> => {
  if (io) {
    await new Promise<void>((resolve) => {
      io!.close(() => {
        io = null;
        resolve();
      });
    });
  }
};
