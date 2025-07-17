import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

// Create Supabase client for public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Redis configuration
const redisUrl = process.env.UPSTASH_REDIS_REST_URL!;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN!;

if (!redisUrl || !redisToken) {
  throw new Error('Missing Redis configuration');
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// Test database connections
export const testConnections = async () => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection failed:', error);
      return false;
    }

    // Test Redis connection
    await redis.ping();
    
    console.log('Database connections successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};