import { redis } from '@/config/database';
import logger from '@/utils/logger';

export class RedisService {
  // Basic operations
  static async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        await redis.setex(key, ttl, stringValue);
      } else {
        await redis.set(key, stringValue);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  static async get(key: string): Promise<any> {
    try {
      const value = await redis.get(key);
      
      if (!value) return null;
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value as string);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis get error:', error);
      throw error;
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
      throw error;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      throw error;
    }
  }

  static async expire(key: string, ttl: number): Promise<void> {
    try {
      await redis.expire(key, ttl);
    } catch (error) {
      logger.error('Redis expire error:', error);
      throw error;
    }
  }

  static async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error('Redis ttl error:', error);
      throw error;
    }
  }

  // List operations
  static async lpush(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await redis.lpush(key, stringValue);
    } catch (error) {
      logger.error('Redis lpush error:', error);
      throw error;
    }
  }

  static async rpush(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await redis.rpush(key, stringValue);
    } catch (error) {
      logger.error('Redis rpush error:', error);
      throw error;
    }
  }

  static async lpop(key: string): Promise<any> {
    try {
      const value = await redis.lpop(key);
      
      if (!value) return null;
      
      try {
        return JSON.parse(value as string);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis lpop error:', error);
      throw error;
    }
  }

  static async lrange(key: string, start: number, stop: number): Promise<any[]> {
    try {
      const values = await redis.lrange(key, start, stop);
      
      return values.map(value => {
        try {
          return JSON.parse(value as string);
        } catch {
          return value;
        }
      });
    } catch (error) {
      logger.error('Redis lrange error:', error);
      throw error;
    }
  }

  // Set operations
  static async sadd(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await redis.sadd(key, stringValue);
    } catch (error) {
      logger.error('Redis sadd error:', error);
      throw error;
    }
  }

  static async srem(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await redis.srem(key, stringValue);
    } catch (error) {
      logger.error('Redis srem error:', error);
      throw error;
    }
  }

  static async smembers(key: string): Promise<any[]> {
    try {
      const values = await redis.smembers(key);
      
      return values.map(value => {
        try {
          return JSON.parse(value as string);
        } catch {
          return value;
        }
      });
    } catch (error) {
      logger.error('Redis smembers error:', error);
      throw error;
    }
  }

  // Hash operations
  static async hset(key: string, field: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await redis.hset(key, { [field]: stringValue });
    } catch (error) {
      logger.error('Redis hset error:', error);
      throw error;
    }
  }

  static async hget(key: string, field: string): Promise<any> {
    try {
      const value = await redis.hget(key, field);
      
      if (!value) return null;
      
      try {
        return JSON.parse(value as string);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis hget error:', error);
      throw error;
    }
  }

  static async hgetall(key: string): Promise<Record<string, any>> {
    try {
      const hash = await redis.hgetall(key);
      
      const result: Record<string, any> = {};
      
      if (hash) {
        for (const [field, value] of Object.entries(hash)) {
          try {
            result[field] = JSON.parse(value as string);
          } catch {
            result[field] = value;
          }
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Redis hgetall error:', error);
      throw error;
    }
  }

  static async hdel(key: string, field: string): Promise<void> {
    try {
      await redis.hdel(key, field);
    } catch (error) {
      logger.error('Redis hdel error:', error);
      throw error;
    }
  }

  // Increment operations
  static async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key);
    } catch (error) {
      logger.error('Redis incr error:', error);
      throw error;
    }
  }

  static async decr(key: string): Promise<number> {
    try {
      return await redis.decr(key);
    } catch (error) {
      logger.error('Redis decr error:', error);
      throw error;
    }
  }

  // Caching helpers
  static async cache(key: string, ttl: number, fetchFunction: () => Promise<any>): Promise<any> {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached) {
        return cached;
      }

      // Fetch fresh data
      const data = await fetchFunction();
      
      // Cache the result
      await this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      logger.error('Redis cache error:', error);
      throw error;
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Redis invalidate pattern error:', error);
      throw error;
    }
  }
}