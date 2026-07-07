import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // S3-compatible storage
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('job-trainer-dev'),

  // NextAuth
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().default('dev-secret-change-me'),
  GOOGLE_ID: z.string().optional(),
  GOOGLE_SECRET: z.string().optional(),
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),

  // AI (DashScope — OpenAI-compatible API)
  DASHSCOPE_API_KEY: z.string().default(''),
  DASHSCOPE_BASE_URL: z.string().default('https://dashscope.aliyuncs.com/compatible-mode/v1'),
  DASHSCOPE_MODEL: z.string().default('qwen-plus'),
  DASHSCOPE_EMBEDDING_MODEL: z.string().default('text-embedding-v3'),
});

function getEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables. Check server logs.');
  }

  return parsed.data;
}

// Lazy singleton — only validates once
let _env: z.infer<typeof envSchema> | null = null;

export function env() {
  if (!_env) {
    _env = getEnv();
  }
  return _env;
}

export type Env = z.infer<typeof envSchema>;