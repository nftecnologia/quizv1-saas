import { beforeAll, afterAll, afterEach } from '@jest/globals';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock Redis for tests
jest.mock('@/config/database', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
  },
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
  },
  testConnections: jest.fn().mockResolvedValue(true),
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Global test setup
beforeAll(async () => {
  // Setup test database or mock services
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test database or mock services
  console.log('Cleaning up test environment...');
});

afterEach(() => {
  // Clear mocks after each test
  jest.clearAllMocks();
});