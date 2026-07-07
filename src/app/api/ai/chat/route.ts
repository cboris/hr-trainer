import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ai, AI_CONFIG } from '@/lib/ai';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

const CONTEXT_CACHE_TTL = 300; // 5 minutes
const MAX_CONTEXT_CHARS = 8000;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function buildContext(userId: string): Promise<string> {
  const cacheKey = `context:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      skills: true,
      experiences: true,
      trainingSessions: {
        orderBy: { startedAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!user) return '';

  const parts: string[] = [];

  if (user.profile) {
    parts.push(`## User Profile\n- Name: ${user.name}\n- Headline: ${user.profile.headline ?? 'N/A'}\n- Summary: ${user.profile.summary ?? 'N/A'}`);
  }

  if (user.skills.length > 0) {
    const skillList = user.skills.map((s: any) => s.name).join(', ');
    parts.push(`## Skills\n${skillList}`);
  }

  if (user.experiences.length > 0) {
    const expList = user.experiences.map((e: any) => `- ${e.title} at ${e.company}`).join('\n');
    parts.push(`## Experience\n${expList}`);
  }

  if (user.trainingSessions.length > 0) {
    const trainingList = user.trainingSessions.map((t: any) => `- ${t.type} (${t.status})`).join('\n');
    parts.push(`## Recent Training\n${trainingList}`);
  }

  const context = parts.join('\n\n').slice(0, MAX_CONTEXT_CHARS);
  await redis.set(cacheKey, context, 'EX', CONTEXT_CACHE_TTL);

  return context;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { message } = body as { message?: string };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user from DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Build context
    const context = await buildContext(user.id);

    const systemPrompt = `You are an AI career assistant for a job training platform called "Job Trainer AI". You help users with career advice, skill development, job search strategies, and training recommendations.

${context ? `Here is the user's context:\n${context}` : ''}

Be helpful, concise, and actionable. Reference the user's profile and skills when relevant.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ];

    const response = await ai.chat.completions.create({
      model: AI_CONFIG.model,
      messages,
      temperature: AI_CONFIG.temperature,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content ?? 'Sorry, I could not process that.';

    // Store conversation in Redis (last 20 messages per user)
    const conversationKey = `chat:${user.id}`;
    await redis.lpush(conversationKey, JSON.stringify({ role: 'user', content: message }));
    await redis.lpush(conversationKey, JSON.stringify({ role: 'assistant', content }));
    await redis.ltrim(conversationKey, 0, 19);

    return NextResponse.json({
      success: true,
      data: { content },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}