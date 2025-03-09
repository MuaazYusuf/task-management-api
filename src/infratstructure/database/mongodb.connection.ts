import mongoose from 'mongoose';
import { env } from '../../config/env';

export class MongoDBConnection {
  private static instance: MongoDBConnection;

  private constructor() { }

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }

    return MongoDBConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      // Set mongoose options
      mongoose.set('strictQuery', true);
      mongoose.set('allowDiskUse', true);

      // Connect to MongoDB
      await mongoose.connect(env.MONGODB_URI);

      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Failed to disconnect from MongoDB:', error);
      throw error;
    }
  }
}