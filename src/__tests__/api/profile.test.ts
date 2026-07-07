/**
 * Tests for src/app/api/profile/route.ts
 *
 * @jest-environment node
 */

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    profile: { upsert: jest.fn() },
    skill: { deleteMany: jest.fn(), createMany: jest.fn() },
  },
}));

import { GET, PUT } from '@/app/api/profile/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockUserFind = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>;
const mockProfileUpsert = prisma.profile.upsert as jest.MockedFunction<typeof prisma.profile.upsert>;
const mockSkillDeleteMany = prisma.skill.deleteMany as jest.MockedFunction<typeof prisma.skill.deleteMany>;
const mockSkillCreateMany = prisma.skill.createMany as jest.MockedFunction<typeof prisma.skill.createMany>;

function createRequest(method: string, body?: any) {
  return {
    json: body ? jest.fn().mockResolvedValue(body) : jest.fn(),
  } as any;
}

describe('GET /api/profile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);
    mockUserFind.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns profile data on success', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);
    mockUserFind.mockResolvedValue({
      id: 'u1',
      profile: { headline: 'Dev' },
      skills: [{ name: 'JS' }],
      experiences: [],
    } as any);

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.profile.headline).toBe('Dev');
  });

  it('returns 500 on error', async () => {
    mockGetServerSession.mockRejectedValue(new Error('fail'));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/profile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await PUT(createRequest('PUT', {}));
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);
    mockUserFind.mockResolvedValue(null);
    const res = await PUT(createRequest('PUT', { profile: { headline: 'Dev' } }));
    expect(res.status).toBe(404);
  });

  it('upserts profile and replaces skills', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);
    mockUserFind.mockResolvedValue({ id: 'u1' } as any);
    mockProfileUpsert.mockResolvedValue({} as any);
    mockSkillDeleteMany.mockResolvedValue({ count: 0 } as any);
    mockSkillCreateMany.mockResolvedValue({ count: 2 } as any);

    const res = await PUT(createRequest('PUT', {
      profile: { headline: 'Dev', summary: 'Hi', location: 'SF', yearsExperience: 5 },
      skills: [{ name: 'JS', level: 'EXPERT' }, { name: 'TS', level: 'ADVANCED' }],
    }));

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockProfileUpsert).toHaveBeenCalled();
    expect(mockSkillDeleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(mockSkillCreateMany).toHaveBeenCalledWith({
      data: [
        { userId: 'u1', name: 'JS', level: 'EXPERT' },
        { userId: 'u1', name: 'TS', level: 'ADVANCED' },
      ],
    });
  });

  it('skips profile upsert when no profile data', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@test.com' } } as any);
    mockUserFind.mockResolvedValue({ id: 'u1' } as any);

    const res = await PUT(createRequest('PUT', {}));
    expect(res.status).toBe(200);
    expect(mockProfileUpsert).not.toHaveBeenCalled();
  });

  it('returns 500 on error', async () => {
    mockGetServerSession.mockRejectedValue(new Error('fail'));
    const res = await PUT(createRequest('PUT', {}));
    expect(res.status).toBe(500);
  });
});