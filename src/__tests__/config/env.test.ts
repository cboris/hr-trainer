/**
 * Tests for src/config/env.ts
 *
 * These tests verify that environment variable validation works correctly:
 * - Required vars are enforced
 * - Defaults are applied for optional vars
 * - Invalid values are rejected
 */

// Reset modules before each test to get fresh env() calls
beforeEach(() => {
  jest.resetModules();
  // Clear the cached _env singleton
  jest.isolateModules(() => {
    // Set up minimum required env vars
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  });
});

describe('env()', () => {
  it('returns valid config with all required vars', () => {
    const { env } = require('@/config/env');
    const config = env();

    expect(config.DATABASE_URL).toBe('postgresql://test:test@localhost:5432/test');
    expect(config.REDIS_URL).toBe('redis://localhost:6379');
    expect(config.S3_BUCKET).toBe('job-trainer-dev');
    expect(config.DASHSCOPE_MODEL).toBe('qwen-plus');
  });

  it('applies defaults for optional vars', () => {
    const { env } = require('@/config/env');
    const config = env();

    expect(config.S3_ENDPOINT).toBe('http://localhost:9000');
    expect(config.S3_ACCESS_KEY).toBe('minioadmin');
    expect(config.S3_SECRET_KEY).toBe('minioadmin');
    expect(config.NEXTAUTH_SECRET).toBe('dev-secret-change-me');
    expect(config.DASHSCOPE_BASE_URL).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1');
    expect(config.DASHSCOPE_EMBEDDING_MODEL).toBe('text-embedding-v3');
  });

  it('throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;

    expect(() => {
      const { env } = require('@/config/env');
      env();
    }).toThrow('Invalid environment variables');
  });

  it('throws when DATABASE_URL is not a valid URL', () => {
    process.env.DATABASE_URL = 'not-a-url';

    expect(() => {
      const { env } = require('@/config/env');
      env();
    }).toThrow('Invalid environment variables');
  });

  it('accepts custom values when provided', () => {
    process.env.REDIS_URL = 'redis://custom:6380';
    process.env.S3_BUCKET = 'custom-bucket';
    process.env.DASHSCOPE_MODEL = 'qwen-max';

    const { env } = require('@/config/env');
    const config = env();

    expect(config.REDIS_URL).toBe('redis://custom:6380');
    expect(config.S3_BUCKET).toBe('custom-bucket');
    expect(config.DASHSCOPE_MODEL).toBe('qwen-max');
  });

  it('returns same instance on subsequent calls (singleton)', () => {
    const { env } = require('@/config/env');
    const first = env();
    const second = env();

    expect(first).toBe(second);
  });

  it('optional OAuth vars are undefined by default', () => {
    const { env } = require('@/config/env');
    const config = env();

    expect(config.GOOGLE_ID).toBeUndefined();
    expect(config.GOOGLE_SECRET).toBeUndefined();
    expect(config.GITHUB_ID).toBeUndefined();
    expect(config.GITHUB_SECRET).toBeUndefined();
  });
});