import mongoose from 'mongoose';
import { logger } from '../../config/logger.js';

let isConnected = false;

export const connectDB = async (mongodbUri: string): Promise<typeof mongoose> => {
  if (isConnected || mongoose.connection.readyState === 1) {
    logger.info('MongoDB already connected');
    return mongoose;
  }

  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info({ uri: mongodbUri }, 'MongoDB connection established successfully');
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });

  try {
    const db = await mongoose.connect(mongodbUri, {
      dbName: 'fretbox',
      autoIndex: true,
    });
    isConnected = true;
    return db;
  } catch (error) {
    isConnected = false;
    logger.error({ error, mongodbUri }, 'Failed to connect to MongoDB');
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      isConnected = false;
      logger.info('MongoDB connection closed gracefully');
    } catch (error) {
      logger.error({ error }, 'Error while disconnecting MongoDB');
      throw error;
    }
  }
};

export const getDBStatus = (): { isConnected: boolean; readyState: number } => {
  return {
    isConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
  };
};
