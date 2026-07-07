/**
 * Tests for src/lib/redis.ts
 *
 * Verifies Redis client configuration and singleton pattern.
 */

// Mock ioredis
const mockRedisInstance = {
  on: jest.fn().mockReturnThis(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  quit: jest.fn(),
};

const mockRedis = jest.fn().mockImplementation(() => mockRedisInstance);

jest.mock('ioredis', () => ({
  __esModule: true,
  default: mockRedis,
}));

describe('redis client', () => {
  beforeEach(() => {
    jest.resetModules();
    mockRedis.mockClear();
    delete (globalThis as any).redis;
  });

  it('creates a Redis instance', () => {
    const { redis } = require('@/lib/redis');
    expect(redis).toBeDefined();
    expect(mockRedis).toHaveBeenCalledTimes(1);
  });

  it('passes the Redis URL to the constructor', () => {
    require('@/lib/redis');
    expect(mockRedis).toHaveBeenCalledWith(
      expect.stringContaining('redis://'),
      expect.any(Object)
    );
  });

  it('returns same instance on subsequent imports (singleton)', () => {
    const { redis: r1 } = require('@/lib/redis');
    const { redis: r2 } = require('@/lib/redis');
    expect(r1).toBe(r2);
    expect(mockRedis).toHaveBeenCalledTimes(1);
  });

  it('stores instance on globalThis in non-production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { redis } = require('@/lib/redis');
    expect((globalThis as any).redis).toBe(redis);

    process.env.NODE_ENV = originalEnv;
  });

  it('does NOT store on globalThis in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete (globalThis as any).redis;

    jest.resetModules();
    const { redis } = require('@/lib/redis');
    expect((globalThis as any).redis).toBeUndefined();
    expect(redis).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });
});