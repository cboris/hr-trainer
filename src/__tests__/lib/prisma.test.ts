/**
 * Tests for src/lib/prisma.ts
 *
 * Verifies the Prisma client singleton pattern.
 */

// Mock @prisma/client
const mockPrismaClient = jest.fn().mockImplementation(() => ({
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  user: { findMany: jest.fn(), create: jest.fn() },
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: mockPrismaClient,
}));

describe('prisma', () => {
  beforeEach(() => {
    jest.resetModules();
    mockPrismaClient.mockClear();
    // Clean up globalThis
    delete (globalThis as any).prisma;
  });

  it('creates a PrismaClient instance', () => {
    const { prisma } = require('@/lib/prisma');
    expect(prisma).toBeDefined();
    expect(mockPrismaClient).toHaveBeenCalledTimes(1);
  });

  it('returns the same instance on subsequent imports (singleton)', () => {
    const { prisma: p1 } = require('@/lib/prisma');
    const { prisma: p2 } = require('@/lib/prisma');
    expect(p1).toBe(p2);
    // Constructor called only once
    expect(mockPrismaClient).toHaveBeenCalledTimes(1);
  });

  it('stores instance on globalThis in non-production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { prisma } = require('@/lib/prisma');
    expect((globalThis as any).prisma).toBe(prisma);

    process.env.NODE_ENV = originalEnv;
  });

  it('does NOT store on globalThis in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete (globalThis as any).prisma;

    jest.resetModules();
    const { prisma } = require('@/lib/prisma');
    expect((globalThis as any).prisma).toBeUndefined();
    expect(prisma).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });
});