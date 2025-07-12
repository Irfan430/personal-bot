import mongoose from 'mongoose';
import { createClient } from 'redis';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

export class DatabaseManager {
  constructor() {
    this.mongoose = null;
    this.redis = null;
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  async initialize() {
    try {
      // Initialize MongoDB
      await this.connectMongoDB();
      
      // Initialize Redis if configured
      if (process.env.REDIS_URL) {
        await this.connectRedis();
      }
      
      this.isConnected = true;
      logger.database('Database manager initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize database manager:', error);
      throw error;
    }
  }

  async connectMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error('MongoDB URI not provided');
      }

      // MongoDB connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        retryWrites: true,
        w: 'majority'
      };

      this.mongoose = await mongoose.connect(mongoUri, options);
      
      // Set up connection event listeners
      mongoose.connection.on('connected', () => {
        logger.database('MongoDB connected successfully');
        this.connectionRetries = 0;
      });

      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
        this.handleConnectionError('MongoDB', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warning('MongoDB disconnected');
        this.isConnected = false;
        this.attemptReconnection('MongoDB');
      });

      mongoose.connection.on('reconnected', () => {
        logger.database('MongoDB reconnected');
        this.isConnected = true;
        this.connectionRetries = 0;
      });

      logger.database('MongoDB connection established');
      
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async connectRedis() {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      this.redis = createClient({
        url: redisUrl,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            logger.error('Redis connection attempts exceeded');
            return new Error('Redis connection attempts exceeded');
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.redis.on('connect', () => {
        logger.database('Redis connecting...');
      });

      this.redis.on('ready', () => {
        logger.database('Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
      });

      this.redis.on('end', () => {
        logger.warning('Redis connection ended');
      });

      this.redis.on('reconnecting', () => {
        logger.database('Redis reconnecting...');
      });

      await this.redis.connect();
      logger.database('Redis connection established');
      
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      // Redis is optional, so we don't throw here
      this.redis = null;
    }
  }

  async disconnect() {
    try {
      if (this.mongoose) {
        await mongoose.disconnect();
        logger.database('MongoDB disconnected');
      }
      
      if (this.redis) {
        await this.redis.disconnect();
        logger.database('Redis disconnected');
      }
      
      this.isConnected = false;
      logger.database('Database manager disconnected');
      
    } catch (error) {
      logger.error('Error disconnecting from databases:', error);
    }
  }

  async handleConnectionError(dbType, error) {
    logger.error(`${dbType} connection error:`, error);
    
    if (this.connectionRetries < this.maxRetries) {
      this.connectionRetries++;
      logger.database(`Attempting to reconnect to ${dbType} (attempt ${this.connectionRetries}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.attemptReconnection(dbType);
      }, this.retryDelay);
    } else {
      logger.error(`Max reconnection attempts reached for ${dbType}`);
    }
  }

  async attemptReconnection(dbType) {
    try {
      if (dbType === 'MongoDB') {
        await this.connectMongoDB();
      } else if (dbType === 'Redis') {
        await this.connectRedis();
      }
    } catch (error) {
      logger.error(`Failed to reconnect to ${dbType}:`, error);
    }
  }

  // MongoDB operations
  async findOne(collection, query) {
    try {
      return await mongoose.connection.db.collection(collection).findOne(query);
    } catch (error) {
      logger.error(`Error finding document in ${collection}:`, error);
      throw error;
    }
  }

  async findMany(collection, query, options = {}) {
    try {
      return await mongoose.connection.db.collection(collection).find(query, options).toArray();
    } catch (error) {
      logger.error(`Error finding documents in ${collection}:`, error);
      throw error;
    }
  }

  async insertOne(collection, document) {
    try {
      return await mongoose.connection.db.collection(collection).insertOne(document);
    } catch (error) {
      logger.error(`Error inserting document into ${collection}:`, error);
      throw error;
    }
  }

  async updateOne(collection, query, update) {
    try {
      return await mongoose.connection.db.collection(collection).updateOne(query, update);
    } catch (error) {
      logger.error(`Error updating document in ${collection}:`, error);
      throw error;
    }
  }

  async deleteOne(collection, query) {
    try {
      return await mongoose.connection.db.collection(collection).deleteOne(query);
    } catch (error) {
      logger.error(`Error deleting document from ${collection}:`, error);
      throw error;
    }
  }

  // Redis operations
  async cacheSet(key, value, expireSeconds = 3600) {
    if (!this.redis) {
      logger.warning('Redis not available, skipping cache set');
      return false;
    }
    
    try {
      const result = await this.redis.setEx(key, expireSeconds, JSON.stringify(value));
      return result === 'OK';
    } catch (error) {
      logger.error(`Error setting cache for key ${key}:`, error);
      return false;
    }
  }

  async cacheGet(key) {
    if (!this.redis) {
      logger.warning('Redis not available, skipping cache get');
      return null;
    }
    
    try {
      const result = await this.redis.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  async cacheDelete(key) {
    if (!this.redis) {
      logger.warning('Redis not available, skipping cache delete');
      return false;
    }
    
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}:`, error);
      return false;
    }
  }

  async cacheFlush() {
    if (!this.redis) {
      logger.warning('Redis not available, skipping cache flush');
      return false;
    }
    
    try {
      const result = await this.redis.flushDb();
      return result === 'OK';
    } catch (error) {
      logger.error('Error flushing cache:', error);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    const health = {
      mongodb: false,
      redis: false,
      overall: false
    };
    
    try {
      // Check MongoDB
      if (this.mongoose && mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().ping();
        health.mongodb = true;
      }
      
      // Check Redis
      if (this.redis) {
        const pong = await this.redis.ping();
        health.redis = pong === 'PONG';
      } else {
        health.redis = true; // Redis is optional
      }
      
      health.overall = health.mongodb && health.redis;
      
    } catch (error) {
      logger.error('Database health check failed:', error);
    }
    
    return health;
  }

  // Get database statistics
  async getStats() {
    const stats = {
      mongodb: null,
      redis: null
    };
    
    try {
      // MongoDB stats
      if (this.mongoose && mongoose.connection.readyState === 1) {
        const dbStats = await mongoose.connection.db.stats();
        stats.mongodb = {
          collections: dbStats.collections,
          objects: dbStats.objects,
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexes: dbStats.indexes
        };
      }
      
      // Redis stats
      if (this.redis) {
        const info = await this.redis.info();
        stats.redis = {
          connected: true,
          info: info
        };
      }
      
    } catch (error) {
      logger.error('Error getting database stats:', error);
    }
    
    return stats;
  }

  // Getter methods
  getMongoose() {
    return this.mongoose;
  }

  getRedis() {
    return this.redis;
  }

  isMongoConnected() {
    return this.mongoose && mongoose.connection.readyState === 1;
  }

  isRedisConnected() {
    return this.redis && this.redis.isReady;
  }

  isHealthy() {
    return this.isConnected && this.isMongoConnected();
  }
}

export default DatabaseManager;