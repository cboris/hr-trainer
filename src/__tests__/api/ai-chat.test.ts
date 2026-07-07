/**
 * Tests for src/app/api/ai/chat/route.ts
 *
 * Verifies: auth check, input validation, context building, AI call, Redis caching.
 *
 * @jest-environment node
 */

// Mock all dependencies before importing
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/ai', () => ({
  ai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
  AI_CONFIG: {
    model: 'test-model',
    temperature: 0.7,
  },
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    lpush: jest.fn(),
    ltrim: jest.fn(),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { POST } from '@/app/api/ai/chat/route';
import { getServerSession } from 'next-auth';
import { ai, AI_CONFIG } from '@/lib/ai';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockAiCreate = ai.chat.completions.create as jest.MockedFunction<typeof ai.chat.completions.create>;
const mockRedisGet = redis.get as jest.MockedFunction<typeof redis.get>;
const mockRedisSet = redis.set as jest.MockedFunction<typeof redis.set>;
const mockRedisLpush = redis.lpush as jest.MockedFunction<typeof redis.lpush>;
const mockRedisLtrim = redis.ltrim as jest.MockedFunction<typeof redis.ltrim>;
const mockPrismaUserFind = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>;

function createRequest(body: any) {
  return new Request('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(createRequest({ message: 'Hello' }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when message is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);

    const res = await POST(createRequest({}));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Message is required');
  });

  it('returns 400 when message is not a string', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);

    const res = await POST(createRequest({ message: 123 }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Message is required');
  });

  it('returns 404 when user not found in DB', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);
    mockPrismaUserFind.mockResolvedValue(null);

    const res = await POST(createRequest({ message: 'Hello' }));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('returns AI response on success', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);
    mockPrismaUserFind.mockResolvedValue({ id: 'user-1', name: 'Test', email: 'test@test.com' } as any);
    mockRedisGet.mockResolvedValue(null);
    mockPrismaUserFind.mockResolvedValue({
      id: 'user-1',
      name: 'Test',
      email: 'test@test.com',
      profile: null,
      skills: [],
      experiences: [],
      trainings: [],
    } as any);
    mockAiCreate.mockResolvedValue({
      choices: [{ message: { content: 'Hello! How can I help?' } }],
    } as any);

    const res = await POST(createRequest({ message: 'Hello' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.content).toBe('Hello! How can I help?');
  });

  it('uses cached context when available', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);
    mockPrismaUserFind.mockResolvedValue({ id: 'user-1', name: 'Test', email: 'test@test.com' } as any);
    mockRedisGet.mockResolvedValue('## User Profile\n- Name: Test');
    mockAiCreate.mockResolvedValue({
      choices: [{ message: { content: 'Response' } }],
    } as any);

    await POST(createRequest({ message: 'Hello' }));

    // Should NOT query DB for profile/skills/etc when context is cached
    // (only the initial user lookup happens)
    expect(mockRedisGet).toHaveBeenCalledWith('context:user-1');
  });

  it('stores conversation in Redis', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);
    mockPrismaUserFind.mockResolvedValue({
      id: 'user-1',
      name: 'Test',
      email: 'test@test.com',
      profile: null,
      skills: [],
      experiences: [],
      trainings: [],
    } as any);
    mockRedisGet.mockResolvedValue(null);
    mockAiCreate.mockResolvedValue({
      choices: [{ message: { content: 'Response' } }],
    } as any);

    await POST(createRequest({ message: 'Hello' }));

    expect(mockRedisLpush).toHaveBeenCalledWith('chat:user-1', JSON.stringify({ role: 'user', content: 'Hello' }));
    expect(mockRedisLpush).toHaveBeenCalledWith('chat:user-1', JSON.stringify({ role: 'assistant', content: 'Response' }));
    expect(mockRedisLtrim).toHaveBeenCalledWith('chat:user-1', 0, 19);
  });

  it('returns fallback when AI returns no content', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);
    mockPrismaUserFind.mockResolvedValue({
      id: 'user-1',
      name: 'Test',
      email: 'test@test.com',
      profile: null,
      skills: [],
      experiences: [],
      trainings: [],
    } as any);
    mockRedisGet.mockResolvedValue(null);
    mockAiCreate.mockResolvedValue({
      choices: [{ message: {} }],
    } as any);

    const res = await POST(createRequest({ message: 'Hello' }));
    const data = await res.json();

    expect(data.data.content).toBe('Sorry, I could not process that.');
  });

  it('returns 500 on internal error', async () => {
    mockGetServerSession.mockRejectedValue(new Error('Session error'));

    const res = await POST(createRequest({ message: 'Hello' }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});