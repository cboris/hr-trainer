# Local Development Setup — Job Trainer AI

## Goal

Run the full Job Trainer AI stack locally with minimal friction, using services that mirror the Alibaba Cloud production architecture from `cloud.md`. Swapping local → production should be **env var changes only**.

---

## Architecture: Local vs Cloud Mapping

| Production (Alibaba Cloud) | Local Dev | Rationale |
|---|---|---|
| ApsaraDB RDS PostgreSQL + pgvector | **Docker: `pgvector/pgvector:pg16`** | Same extension, same SQL — zero code changes |
| ApsaraDB Redis (Tair) | **Docker: `redis:7-alpine`** | Redis-compatible, BullMQ works identically |
| OSS (Object Storage) | **Docker: `minio/minio`** | S3-compatible API; OSS is also S3-compatible — same SDK code |
| DashScope (Qwen-Max/Plus) | **DashScope API directly** | Use the real API with a dev key; no local LLM needed for fast cycles |
| IDaaS (OAuth/OIDC) | **NextAuth.js** | Local-friendly auth with Google/GitHub providers; swap to IDaaS SDK for prod |
| SAE (Serverless containers) | **`next dev`** | Standard Next.js dev server |
| KMS (Secrets) | **`.env.local`** | File-based env vars, gitignored |

---

## Docker Compose — The Core

One `docker-compose.yml` spins up all infrastructure:

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: jobtrainer
      POSTGRES_PASSWORD: jobtrainer_dev
      POSTGRES_DB: jobtrainer_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/init.sql:/docker-entrypoint-initdb.d/init.sql  # enables pgvector + creates extensions

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data

  minio:
    image: minio/minio
    ports:
      - '9000:9000'   # API
      - '9001:9001'   # Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  redisdata:
  miniodata:
```

**Startup**: `docker compose up -d` → all three services running in ~5 seconds.

---

## Auth Strategy: NextAuth.js → IDaaS later

For local dev, NextAuth.js gives us working OAuth in minutes:

```typescript
// lib/auth/options.ts
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions = {
  providers: [
    GoogleProvider({ clientId: env.GOOGLE_ID, clientSecret: env.GOOGLE_SECRET }),
    GitHubProvider({ clientId: env.GITHUB_ID, clientSecret: env.GITHUB_SECRET }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Sync user to our DB (same pattern as IDaaS webhook in cloud.md)
      await syncUserFromProvider(user, account);
      return true;
    },
  },
};
```

**Why this works**: The `syncUserFromProvider` function is identical to the IDaaS user sync in `cloud.md §7`. For production, we swap the NextAuth providers for IDaaS OIDC — the DB sync logic stays the same.

---

## AI Strategy: DashScope API in dev

No reason to mock the AI layer. Use DashScope directly with a dev API key:

```typescript
// lib/ai/client.ts
import OpenAI from 'openai';

export const ai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});
```

Same client in dev and prod. The only difference is the API key value in `.env.local`.

**Fallback for offline dev**: If DashScope is unavailable, we can add an Ollama fallback with `qwen2.5:7b` for basic testing — but for a hackathon, the real API is faster and better.

---

## File Storage: MinIO → OSS later

MinIO is S3-compatible. OSS is S3-compatible. Same `@aws-sdk/client-s3` code works for both:

```typescript
// lib/storage/client.ts
import { S3Client } from '@aws-sdk/client-s3';

export const storage = new S3Client({
  region: 'us-east-1',           // ignored by MinIO
  endpoint: process.env.S3_ENDPOINT,  // http://localhost:9000 locally
  forcePathStyle: true,          // required for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});
```

| Env | `S3_ENDPOINT` | Bucket |
|-----|---------------|--------|
| Local | `http://localhost:9000` | `job-trainer-dev` |
| Prod | `https://oss-ap-southeast-1.aliyuncs.com` | `job-trainer-docs` |

---

## Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://jobtrainer:jobtrainer_dev@localhost:5432/jobtrainer_dev
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=job-trainer-dev

# Auth (NextAuth local)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-me
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# AI
DASHSCOPE_API_KEY=sk-your-dashscope-key
```

---

## Project Structure (what we create)

```
hackathon/
├── docker-compose.yml          # PostgreSQL + Redis + MinIO
├── docker/
│   └── init.sql                # CREATE EXTENSION vector; + seed data
├── .env.local                  # (gitignored)
├── .env.example                # Template for env vars
├── prisma/
│   ├── schema.prisma           # Full schema from project.md §1.2
│   └── seed.ts                 # Seed data for dev
├── src/
│   ├── app/                    # Next.js App Router
│   ├── features/               # Feature modules (per FRONTEND.md)
│   ├── lib/
│   │   ├── ai/client.ts        # DashScope client
│   │   ├── auth/               # NextAuth config
│   │   ├── db/                 # Prisma client
│   │   ├── storage/            # S3-compatible client (MinIO/OSS)
│   │   ├── store/              # Zustand stores
│   │   └── api/                # SSE client, fetch wrapper
│   └── services/               # Service layer (per .clinerules)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## Fast Cycle Workflow

```
1. docker compose up -d          # Start infra (5s)
2. pnpm prisma migrate dev       # Apply schema changes
3. pnpm prisma db seed           # Seed dev data
4. pnpm dev                      # Start Next.js on :3000
5. Open http://localhost:3000    # MinIO console at :9001
```

**Iteration loop**: Edit code → hot reload → test. Schema change → `prisma migrate dev` → instant.

---

## What's NOT in local dev (and why)

| Production Service | Local Equivalent | Why Skip |
|---|---|---|
| CDN | Next.js static serving | No need for edge caching locally |
| ARMS + SLS (monitoring) | Console logs + React DevTools | Overkill for prototyping |
| ALB | Next.js dev server | Direct connection, no load balancing needed |
| KMS | `.env.local` | File-based is fine for dev |
| IDaaS | NextAuth.js | Same user sync pattern, simpler setup |
| ACR + SAE | `next dev` | No containerization needed locally |

---

## Implementation Order

1. **Scaffold**: `npx create-next-app@latest` with App Router + TypeScript + Tailwind
2. **Docker**: Create `docker-compose.yml` + `init.sql`
3. **Prisma**: Set up schema from `project.md §1.2`, run first migration
4. **Auth**: NextAuth.js with Google + GitHub providers
5. **AI client**: DashScope OpenAI-compatible client
6. **Storage**: MinIO/S3 client with bucket init
7. **Shell**: App layout with sidebar + AI panel drawer
8. **First screen**: Dashboard with profile completeness card
9. **Profile intake**: Wizard flow (basic form, no AI yet)
10. **AI chat**: SSE streaming in the AI panel

---

## References

- Cloud architecture: [memory-bank/cloud.md](cloud.md)
- Database schema: [project.md §1.2](../project.md)
- Frontend structure: [FRONTEND.md](../FRONTEND.md)
- Tech stack: [memory-bank/techContext.md](techContext.md)