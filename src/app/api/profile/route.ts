import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        skills: true,
        experiences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: user.profile,
        skills: user.skills,
        experiences: user.experiences,
      },
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

interface SkillInput {
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

interface ProfileInput {
  headline?: string;
  summary?: string;
  location?: string;
  yearsExperience?: number;
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { profile, skills } = body as { profile?: ProfileInput; skills?: SkillInput[] };

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Upsert profile
    if (profile) {
      await prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          headline: profile.headline ?? '',
          summary: profile.summary ?? '',
          location: profile.location,
          yearsExperience: profile.yearsExperience ?? 0,
        },
        update: {
          headline: profile.headline,
          summary: profile.summary,
          location: profile.location,
          yearsExperience: profile.yearsExperience,
        },
      });
    }

    // Replace skills (delete all, then create new)
    if (skills && Array.isArray(skills)) {
      await prisma.skill.deleteMany({ where: { userId: user.id } });
      if (skills.length > 0) {
        await prisma.skill.createMany({
          data: skills.map((s) => ({
            userId: user.id,
            name: s.name,
            level: s.level,
          })),
        });
      }
    }

    return NextResponse.json({ success: true, data: { updated: true } });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}