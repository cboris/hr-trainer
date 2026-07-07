import OpenAI from 'openai';
import { env } from '@/config/env';

const globalForAI = globalThis as unknown as {
  ai: OpenAI | undefined;
};

export const ai = globalForAI.ai ?? new OpenAI({
  apiKey: env().DASHSCOPE_API_KEY,
  baseURL: env().DASHSCOPE_BASE_URL,
});

if (process.env.NODE_ENV !== 'production') {
  globalForAI.ai = ai;
}

export const AI_CONFIG = {
  model: env().DASHSCOPE_MODEL,
  embeddingModel: env().DASHSCOPE_EMBEDDING_MODEL,
  maxTokens: 4096,
  temperature: 0.7,
};