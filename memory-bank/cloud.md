# Cloud Architecture — Job Trainer AI on Alibaba Cloud

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ALIBABA CLOUD ARCHITECTURE                         │
│                    Region: ap-southeast-1 (Singapore)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  CLIENT                                                              │
│  Next.js SPA → CDN (static assets) + SAE (SSR/API)                  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  SAE (Serverless App Engine)                                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │    │
│  │  │  Next.js SSR  │  │  API Routes  │  │  SSE Streaming   │  │    │
│  │  │  (public)     │  │  (BFF)       │  │  (AI responses)  │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
│  ┌───────────┬───────────────┼───────────────┬──────────────┐      │
│  │           │               │               │              │      │
│  ▼           ▼               ▼               ▼              ▼      │
│ ┌─────┐  ┌──────┐     ┌──────────┐   ┌──────────┐   ┌─────────┐  │
│ │IDaaS│  │ RDS  │     │  Redis   │   │   OSS    │   │DashScope│  │
│ │Auth │  │ PG + │     │ (Tair)   │   │ (Files)  │   │ (Qwen) │  │
│ │     │  │vector│     │ Cache +  │   │ CV/PDF/  │   │ Qwen-  │  │
│ │OAuth│  │      │     │ Queue    │   │ Templates│   │ Max/   │  │
│ │Social│  │pgvec │     │          │   │          │   │ Plus/  │  │
│ │MFA  │  │tor   │     │          │   │          │   │ Embed  │  │
│ └─────┘  └──────┘     └──────────┘   └──────────┘   └─────────┘  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  CDN (Static assets + OSS origin)                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ARMS (APM) + SLS (Logs) + Alerting                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Service Mapping

| Layer | Service | Alibaba Cloud Product | Purpose |
|-------|---------|----------------------|---------|
| **Compute** | Next.js SSR + API | **SAE** (Serverless App Engine) | Container hosting, auto-scaling, zero K8s ops |
| **Database** | PostgreSQL + pgvector | **ApsaraDB RDS for PostgreSQL** | Relational data + vector search via pgvector extension |
| **Auth** | OAuth / Social Login | **IDaaS** | Managed identity, Google/GitHub/LinkedIn OAuth, MFA |
| **Object Storage** | Files / Documents | **OSS** (Object Storage Service) | CV exports, templates, profile photos, imported docs |
| **Cache** | Session / Rate Limit | **ApsaraDB Redis (Tair)** | Session cache, rate limiting, BullMQ-compatible queue |
| **AI — LLM** | GPT-4o replacement | **DashScope — Qwen-Max** | CV tailoring, interview scoring, complex reasoning |
| **AI — LLM (light)** | GPT-4o-mini replacement | **DashScope — Qwen-Plus** | JD parsing, gap analysis, persona builder, market scout |
| **AI — Embeddings** | text-embedding-3-small | **DashScope — text-embedding-v3** | 1024 or 1536 dim embeddings for pgvector |
| **AI — Extraction** | Episodic memory | **DashScope — Qwen-Turbo** | High-volume lightweight extraction tasks |
| **CDN** | Static assets | **Alibaba Cloud CDN** | Edge caching, OSS origin, global delivery |
| **DNS** | Domain | **Alibaba Cloud DNS** | DNS management, health checks |
| **Load Balancer** | Traffic routing | **ALB** (Application Load Balancer) | HTTPS termination, health checks, routing to SAE |
| **Monitoring** | APM + Logs | **ARMS** + **SLS** (Log Service) | Distributed tracing, log aggregation, alerting |
| **CI/CD** | Deployment | **GitHub Actions** → **ACR** → **SAE** | Build Docker image, push to Container Registry, deploy |
| **Secrets** | Env vars / keys | **KMS** (Key Management Service) | API keys, DB credentials, encryption keys |

---

## 3. Region & Compliance

### Primary Region: ap-southeast-1 (Singapore)

| Factor | Detail |
|--------|--------|
| **Target users** | International (EU, US, Asia-Pacific) |
| **Latency** | ~150ms to EU, ~200ms to US East, ~30-80ms to SE Asia |
| **Data residency** | Singapore — GDPR-compatible, no China data residency requirements |
| **Language** | English-first platform; Singapore region is English-friendly |
| **Compliance** | SOC 2, ISO 27001, GDPR-ready via Alibaba Cloud compliance programs |

### Future Expansion

| Region | When | Purpose |
|--------|------|---------|
| cn-hangzhou | If entering China market | China mainland users, ICP compliance |
| eu-central-1 (Frankfurt) | If EU data residency required | GDPR strict data locality |
| us-east-1 (Virginia) | If US latency becomes issue | US East coast users |

---

## 4. Compute: SAE (Serverless App Engine)

### Why SAE

- Zero Kubernetes overhead — no cluster management
- Auto-scaling based on CPU/memory/request metrics
- Pay-per-request billing (scale to zero possible)
- Native Docker container support
- Built-in health checks and rolling deployments
- Integrates with ALB, ACR, ARMS out of the box

### Container Configuration

```yaml
# SAE Application Config
application:
  name: job-trainer-api
  replicas:
    min: 1
    max: 10
  spec:
    cpu: 1000m       # 1 vCPU
    memory: 2048Mi   # 2GB RAM
  scaling:
    rules:
      - type: CPU
        target: 70%
      - type: Concurrency
        target: 100
  healthCheck:
    path: /api/health
    initialDelaySeconds: 30
    periodSeconds: 10
  env:
    - DATABASE_URL: (from KMS)
    - REDIS_URL: (from KMS)
    - DASHSCOPE_API_KEY: (from KMS)
    - IDAES_CLIENT_ID: (from KMS)
    - OSS_BUCKET: job-trainer-docs
    - NODE_ENV: production
```

### CI/CD Pipeline

```
GitHub Push → GitHub Actions → Docker Build → ACR Push → SAE Deploy
     │              │                │              │            │
     ▼              ▼                ▼              ▼            ▼
   main        .github/         Dockerfile     Container    Rolling
   branch     workflows/                       Registry    update to
              ci.yml                           (Singapore)  SAE
```

```yaml
# .github/workflows/deploy.yml (simplified)
name: Deploy to Alibaba Cloud
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build & Push to ACR
        run: |
          docker login --username=${{ secrets.ACR_USER }} --password=${{ secrets.ACR_PASSWORD }} registry.ap-southeast-1.aliyuncs.com
          docker build -t registry.ap-southeast-1.aliyuncs.com/job-trainer/app:${{ github.sha }} .
          docker push registry.ap-southeast-1.aliyuncs.com/job-trainer/app:${{ github.sha }}

      - name: Deploy to SAE
        run: |
          # Use Alibaba Cloud CLI or SAE API to trigger deployment
          aliyun sae UpdateApplicationConfig \
            --AppId ${{ secrets.SAE_APP_ID }} \
            --ImageUrl registry.ap-southeast-1.aliyuncs.com/job-trainer/app:${{ github.sha }}
```

---

## 5. Database: ApsaraDB RDS for PostgreSQL

### Why RDS PostgreSQL

- **pgvector extension supported natively** — no separate vector DB needed
- Managed backups, point-in-time recovery
- Read replicas for scaling read-heavy workloads
- Automatic patching and maintenance
- Compatible with Prisma / Drizzle ORM

### Instance Sizing

| Environment | Spec | Storage | Purpose |
|-------------|------|---------|---------|
| Development | 1 vCPU / 2GB | 20GB SSD | Dev/testing |
| Production | 2 vCPU / 4GB | 100GB ESSD | Primary workload |
| Read Replica | 2 vCPU / 4GB | 100GB ESSD | Read scaling (Phase 2+) |

### pgvector Setup

```sql
-- Enable pgvector on RDS
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';

-- All embedding tables and indexes as defined in project.md
-- (profile_embeddings, job_embeddings, memory_embeddings with HNSW indexes)
```

### Backup Strategy

| Type | Frequency | Retention |
|------|-----------|-----------|
| Automated snapshot | Daily | 7 days |
| Manual snapshot | Before migrations | 30 days |
| WAL archiving | Continuous | Point-in-time recovery |
| Cross-region backup | Weekly | 4 weeks (to cn-hangzhou for DR) |

### Connection Security

- SSL/TLS enforced for all connections
- VPC internal endpoints only (no public access)
- IP whitelist restricted to SAE security group
- Database credentials stored in KMS, injected as env vars

---

## 6. AI: DashScope / Qwen Models

### Model Selection Matrix

| Task | Model | Input Token Cost | Output Token Cost | Rationale |
|------|-------|-----------------|-------------------|-----------|
| CV section generation | **qwen-max** | ¥0.02/1K tokens | ¥0.06/1K tokens | Best quality for long-form writing |
| Interview scoring + feedback | **qwen-max** | ¥0.02/1K tokens | ¥0.06/1K tokens | Complex multi-dimensional reasoning |
| JD parsing (JSON extraction) | **qwen-plus** | ¥0.004/1K tokens | ¥0.012/1K tokens | Fast structured extraction |
| Gap analysis | **qwen-plus** | ¥0.004/1K tokens | ¥0.012/1K tokens | Comparison logic |
| Persona Builder (guided Q&A) | **qwen-plus** | ¥0.004/1K tokens | ¥0.012/1K tokens | Conversational, moderate complexity |
| Market Scout | **qwen-plus** | ¥0.004/1K tokens | ¥0.012/1K tokens | Analysis + data synthesis |
| Episodic memory extraction | **qwen-turbo** | ¥0.0003/1K tokens | ¥0.0006/1K tokens | High-volume lightweight extraction |
| Embeddings | **text-embedding-v3** | ¥0.0007/1K tokens | — | 1024 or 1536 dims, DashScope native |

### DashScope Integration

```typescript
// dashscope-client.ts
import OpenAI from 'openai';

// DashScope is OpenAI-compatible API
const dashscope = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

// Qwen-Max for complex tasks
async function generateCVSection(prompt: string): Promise<string> {
  const response = await dashscope.chat.completions.create({
    model: 'qwen-max',
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.pitch_writer },
      { role: 'user', content: prompt }
    ],
    stream: true,
    response_format: { type: 'text' },
  });

  // Stream tokens via SSE to client
  let fullContent = '';
  for await (const chunk of response) {
    const token = chunk.choices[0]?.delta?.content || '';
    fullContent += token;
    yieldToken(token); // SSE push to client
  }
  return fullContent;
}

// text-embedding-v3 for vector generation
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await dashscope.embeddings.create({
    model: 'text-embedding-v3',
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}
```

### Rate Limits & Quotas

| Model | RPM (Requests/min) | TPM (Tokens/min) |
|-------|--------------------|--------------------|
| qwen-max | 60 | 100,000 |
| qwen-plus | 120 | 200,000 |
| qwen-turbo | 200 | 500,000 |
| text-embedding-v3 | 200 | 1,000,000 |

*Note: Request quota increases via Alibaba Cloud console if needed.*

---

## 7. Auth: IDaaS

### Why IDaaS

- Managed OAuth 2.0 / OIDC provider — zero auth infrastructure
- Built-in social login: Google, GitHub, LinkedIn, Microsoft
- MFA support (TOTP, SMS)
- User directory with profile attributes
- Webhooks for user lifecycle events (create, update, delete)
- SSO capabilities for future enterprise features

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  IDaaS   │────▶│  Next.js │────▶│   RDS    │
│ (Browser)│     │ (OAuth)  │     │  API     │     │  (users) │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │ 1. Redirect    │                │                │
     │ to IDaaS login │                │                │
     │◀───────────────│                │                │
     │                │                │                │
     │ 2. User authenticates           │                │
     │ (Google/GitHub/email+password)  │                │
     │───────────────▶│                │                │
     │                │                │                │
     │ 3. IDaaS returns auth code      │                │
     │◀───────────────│                │                │
     │                │                │                │
     │ 4. Exchange code for token      │                │
     │───────────────▶│                │                │
     │                │                │                │
     │ 5. ID token + access token      │                │
     │◀───────────────│                │                │
     │                │                │                │
     │ 6. Send token to API            │                │
     │───────────────────────────────▶│                │
     │                │                │                │
     │                │   7. Verify    │                │
     │                │   JWT + sync   │                │
     │                │   user to DB   │                │
     │                │───────────────────────────────▶│
     │                │                │                │
     │ 8. Session cookie / JWT         │                │
     │◀──────────────────────────────│                │
```

### User Sync Strategy

```typescript
// After OAuth callback, sync user to our DB
async function syncUserFromIDaaS(idaaSUser: IDaaSUser): Promise<User> {
  return await db.user.upsert({
    where: { auth_ext_id: idaasUser.sub },
    update: {
      name: idaasUser.name,
      email: idaasUser.email,
      avatar_url: idaasUser.picture,
      updated_at: new Date(),
    },
    create: {
      auth_ext_id: idaasUser.sub,
      auth_provider: 'idaas',
      email: idaasUser.email,
      name: idaasUser.name,
      avatar_url: idaasUser.picture,
      plan: 'free',
    },
  });
}
```

### IDaaS Configuration

| Setting | Value |
|---------|-------|
| Protocol | OAuth 2.0 + OIDC |
| Social Providers | Google, GitHub, LinkedIn |
| MFA | Optional TOTP |
| Session | JWT (15min access) + refresh token (7d) |
| Webhook | User created/updated → sync to RDS |
| Branding | Custom login page with Job Trainer AI branding |

---

## 8. Storage: OSS (Object Storage Service)

### Bucket Structure

```
oss://job-trainer-docs/
├── users/{user_id}/
│   ├── profile-photo.jpg
│   └── imports/
│       ├── resume-v1.pdf
│       └── resume-v2.docx
├── documents/{user_id}/
│   ├── cv/{job_id}/
│   │   ├── v1/content.json
│   │   ├── v1/export.pdf
│   │   └── v1/export.docx
│   └── cover-letter/{job_id}/
│       ├── v1/content.json
│       └── v1/export.pdf
├── templates/
│   ├── cv/modern.json
│   ├── cv/classic.json
│   └── cover-letter/professional.json
└── exports/{user_id}/{timestamp}/
    └── full-profile-export.json
```

### Lifecycle Policies

| Path | Storage Class | Transition | Expiry |
|------|--------------|------------|--------|
| `users/*/imports/*` | Standard → IA | 30 days | 180 days |
| `documents/*/cv/*/export.*` | Standard | — | Keep forever |
| `documents/*/cv/*/content.json` | Standard | — | Keep forever |
| `exports/*` | Standard → IA | 7 days | 90 days |

### CDN Integration

```
Client → CDN Edge → OSS Origin
         (cached)    (origin)

Cache rules:
- /templates/* → Cache 24h, public
- /documents/*/export.* → Cache 1h, signed URL required
- /users/*/profile-photo → Cache 1h, public
```

### Signed URLs for Private Content

```typescript
// Generate signed URL for private document access
async function getDocumentUrl(userId: string, docKey: string): Promise<string> {
  const url = oss.signatureAuth.signUrl(
    `documents/${userId}/${docKey}`,
    3600, // 1 hour expiry
    'GET'
  );
  return url;
}
```

---

## 9. Cache & Queue: Redis (Tair)

### Why Tair

- Alibaba Cloud's enhanced Redis — compatible with Redis protocol
- BullMQ works out of the box (for job queues)
- Multiple architecture options: standard, cluster, read-write splitting
- Built-in persistence (AOF + RDB)

### Usage Patterns

| Use Case | Key Pattern | TTL | Notes |
|----------|-------------|-----|-------|
| Session cache | `session:{userId}` | 24h | JWT verification cache |
| Rate limiting | `ratelimit:{userId}:{endpoint}` | 1min | Sliding window counter |
| SSE connection state | `sse:{connectionId}` | 30min | Track active streaming connections |
| Embedding cache | `embed:{hash(text)}` | 7d | Avoid re-embedding identical text |
| Job queue (BullMQ) | `bull:embeddings`, `bull:exports` | — | Async job processing |
| AI response cache | `ai:{hash(prompt)}` | 24h | Cache identical AI requests |

### Instance Sizing

| Environment | Spec | Purpose |
|-------------|------|---------|
| Development | 1GB Standard | Dev/testing |
| Production | 2GB Standard | Cache + queue combined |
| Production (scaled) | 4GB Cluster | If queue volume grows significantly |

---

## 10. Networking & Security

### VPC Design

```
VPC: 10.0.0.0/8 (ap-southeast-1)
│
├── Public Subnet: 10.0.1.0/24
│   ├── ALB (Application Load Balancer)
│   ├── NAT Gateway (outbound internet for private subnet)
│   └── CDN edge integration
│
├── Private Subnet: 10.0.2.0/24
│   ├── SAE containers (Next.js app)
│   └── Redis (Tair) instance
│
├── Data Subnet: 10.0.3.0/24
│   ├── RDS PostgreSQL (primary)
│   ├── RDS PostgreSQL (read replica)
│   └── OSS VPC endpoint (private access)
│
└── Security Groups
    ├── sg-alb: Inbound 443 from internet → ALB
    ├── sg-web: Inbound from sg-alb → SAE (port 3000)
    ├── sg-app: SAE → RDS (5432), Redis (6379)
    ├── sg-db:  Inbound from sg-app only → RDS
    └── sg-redis: Inbound from sg-app only → Redis
```

### Security Layers

| Layer | Service | Purpose |
|-------|---------|---------|
| **Edge** | CDN + WAF | DDoS protection, bot detection, rate limiting |
| **Network** | VPC + Security Groups | Network isolation, port-level access control |
| **Transport** | SSL/TLS (ALB) | HTTPS everywhere, TLS 1.3 |
| **Application** | IDaaS + JWT | Authentication, authorization |
| **Data** | RLS + KMS | Row-level security in DB, encryption at rest |
| **Audit** | ActionTrail | API call logging, compliance auditing |

### SSL/TLS

- ALB terminates TLS with Alibaba Cloud managed certificates
- Backend communication within VPC uses internal endpoints (no TLS needed)
- RDS connections enforce SSL
- OSS uses HTTPS-only bucket policy

---

## 11. Monitoring & Observability

### Stack

| Component | Service | Purpose |
|-----------|---------|---------|
| **APM** | ARMS (Application Real-Time Monitoring) | Distributed tracing, service map, dependency analysis |
| **Logs** | SLS (Simple Log Service) | Centralized log aggregation, search, analysis |
| **Metrics** | ARMS + CloudMonitor | CPU, memory, request rate, error rate, latency |
| **Alerting** | CloudMonitor | Threshold-based alerts → DingTalk / email / SMS |
| **Uptime** | CloudMonitor Synthetic | Synthetic monitoring for critical endpoints |

### Key Alerts

| Alert | Threshold | Channel |
|-------|-----------|---------|
| High error rate | > 1% 5xx responses in 5min | DingTalk + email |
| High latency | p95 > 2s for 5min | DingTalk |
| SAE scaling | Max replicas reached | DingTalk |
| RDS CPU | > 80% for 10min | Email |
| RDS connections | > 80% max connections | DingTalk |
| Redis memory | > 80% used memory | Email |
| DashScope errors | > 5 failures in 1min | DingTalk |
| Queue depth | > 1000 pending jobs | Email |

### Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Job Trainer AI — Operations Dashboard                       │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Requests/s  │  Error Rate  │  p95 Latency │  Active Users  │
│    125       │    0.3%      │    450ms     │     42         │
├──────────────┴──────────────┴──────────────┴────────────────┤
│  SAE: 3/10 instances  │  RDS: 35% CPU  │  Redis: 1.2GB/2GB │
├─────────────────────────────────────────────────────────────┤
│  DashScope: 45 RPM    │  Queue: 12 jobs │  OSS: 2.3GB used │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. CI/CD Pipeline

### Flow

```
Developer pushes to main
        │
        ▼
GitHub Actions workflow triggered
        │
        ├── 1. Lint + Type Check (tsc, eslint)
        ├── 2. Unit Tests (vitest)
        ├── 3. Build Next.js (next build)
        ├── 4. Docker Build (multi-stage)
        ├── 5. Push to ACR (Alibaba Container Registry)
        └── 6. Deploy to SAE (rolling update)
                │
                ▼
        SAE pulls new image from ACR
        SAE performs rolling deployment
        Health check passes → traffic shifted
```

### Dockerfile

```dockerfile
# Multi-stage build
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

---

## 13. Cost Estimation (Monthly)

### Development / MVP Phase

| Service | Spec | ~Cost (USD/mo) |
|---------|------|----------------|
| SAE | 1 vCPU / 2GB, 1 instance | $30-50 |
| RDS PostgreSQL | 1 vCPU / 2GB, 50GB | $40-70 |
| Redis (Tair) | 1GB Standard | $15-25 |
| OSS | 10GB + requests | $2-5 |
| DashScope (Qwen) | ~10K requests/day | $30-80 |
| CDN | 20GB bandwidth | $3-8 |
| IDaaS | Basic tier | $0-30 |
| ARMS + SLS | Basic | $5-15 |
| KMS | Basic | $1-3 |
| **Total** | | **~$130-290/mo** |

### Production Phase

| Service | Spec | ~Cost (USD/mo) |
|---------|------|----------------|
| SAE | 2 vCPU / 4GB, 2-5 instances avg | $60-150 |
| RDS PostgreSQL | 2 vCPU / 4GB, 100GB + read replica | $120-220 |
| Redis (Tair) | 2GB Standard | $30-50 |
| OSS | 50GB + requests | $5-15 |
| DashScope (Qwen) | ~50K requests/day mixed | $100-300 |
| CDN | 100GB bandwidth | $10-20 |
| IDaaS | Standard tier | $30-50 |
| ARMS + SLS | Standard | $15-35 |
| KMS | Standard | $3-5 |
| ALB | Basic | $10-20 |
| **Total** | | **~$380-870/mo** |

---

## 14. Migration Path

### Phase 0: Preparation (Week 1)

- [ ] Create Alibaba Cloud account
- [ ] Set up VPC + subnets + security groups in ap-southeast-1
- [ ] Provision RDS PostgreSQL with pgvector
- [ ] Set up OSS bucket with lifecycle policies
- [ ] Configure IDaaS application (OAuth, social providers)
- [ ] Set up DashScope API access + API keys
- [ ] Provision Redis (Tair) instance
- [ ] Set up ACR (Container Registry)

### Phase 1: Database Migration (Week 2)

- [ ] Export schema from Supabase → apply to RDS PostgreSQL
- [ ] Run Prisma migrations against RDS
- [ ] Migrate data: Supabase → RDS (pg_dump / pg_restore or ETL script)
- [ ] Re-generate embeddings using DashScope text-embedding-v3
- [ ] Verify data integrity + vector search accuracy

### Phase 2: Auth Migration (Week 2-3)

- [ ] Configure IDaaS with social providers
- [ ] Implement IDaaS OAuth flow in Next.js
- [ ] Build user sync webhook (IDaaS → RDS users table)
- [ ] Test login/signup with Google, GitHub, LinkedIn
- [ ] Migrate existing Supabase users (map auth_ext_id)

### Phase 3: AI Migration (Week 3)

- [ ] Replace OpenAI SDK calls with DashScope-compatible client
- [ ] Update model references: gpt-4o → qwen-max, gpt-4o-mini → qwen-plus
- [ ] Update embedding model: text-embedding-3-small → text-embedding-v3
- [ ] Test CV tailoring pipeline with Qwen models
- [ ] Test interview scoring with Qwen models
- [ ] Tune prompts for Qwen (output format may differ slightly)

### Phase 4: Infrastructure Migration (Week 3-4)

- [ ] Dockerize Next.js application
- [ ] Set up GitHub Actions CI/CD pipeline
- [ ] Deploy to SAE
- [ ] Configure ALB + SSL
- [ ] Set up CDN with OSS origin
- [ ] Configure ARMS + SLS monitoring
- [ ] Set up alerting rules

### Phase 5: Cutover (Week 4)

- [ ] DNS switch to Alibaba Cloud
- [ ] Monitor for 48 hours
- [ ] Decommission Supabase project
- [ ] Decommission OpenAI API keys
- [ ] Document final architecture

---

## 15. Infrastructure as Code

### Terraform Module Structure

```
infra/
├── main.tf              # Provider config + module calls
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── modules/
│   ├── vpc/             # VPC, subnets, security groups
│   │   ├── main.tf
│   │   └── variables.tf
│   ├── rds/             # RDS PostgreSQL + pgvector
│   │   ├── main.tf
│   │   └── variables.tf
│   ├── redis/           # Tair Redis instance
│   │   ├── main.tf
│   │   └── variables.tf
│   ├── oss/             # OSS buckets + lifecycle
│   │   ├── main.tf
│   │   └── variables.tf
│   ├── sae/             # SAE application
│   │   ├── main.tf
│   │   └── variables.tf
│   ├── idaas/           # IDaaS application config
│   │   ├── main.tf
│   │   └── variables.tf
│   ├── cdn/             # CDN + DNS
│   │   ├── main.tf
│   │   └── variables.tf
│   └── monitoring/      # ARMS + SLS + alerts
│       ├── main.tf
│       └── variables.tf
├── environments/
│   ├── dev.tfvars
│   └── prod.tfvars
└── README.md
```

### Key Terraform Resources

```hcl
# RDS PostgreSQL with pgvector
resource "alicloud_db_instance" "main" {
  engine               = "PostgreSQL"
  engine_version       = "16.0"
  instance_type        = "pg.n2.small.1"  # 2 vCPU, 4GB
  instance_storage     = 100
  db_instance_storage_type = "cloud_essd"
  instance_name        = "job-trainer-db"
  vswitch_id           = var.data_subnet_id
  security_ips         = [var.sae_subnet_cidr]
  ssl_action           = "Require"
  
  # Enable pgvector
  # (applied via SQL after instance creation)
}

# SAE Application
resource "alicloud_sae_application" "app" {
  app_name          = "job-trainer-api"
  namespace_id      = var.sae_namespace
  package_type      = "Image"
  image_url         = "${var.acr_registry}/job-trainer/app:latest"
  cpu               = 1000
  memory            = 2048
  replicas          = 2
  vswitch_id        = var.private_subnet_id
  
  # Environment variables from KMS
  envs = jsonencode([
    { name: "DATABASE_URL", value: var.database_url },
    { name: "REDIS_URL", value: var.redis_url },
    { name: "DASHSCOPE_API_KEY", value: var.dashscope_key },
  ])
}

# OSS Bucket
resource "alicloud_oss_bucket" "documents" {
  bucket = "job-trainer-docs"
  acl    = "private"
  
  lifecycle_rule {
    id      = "archive-imports"
    prefix  = "users/*/imports/"
    enabled = true
    transitions {
      days          = 30
      storage_class = "IA"
    }
    expiration {
      days = 180
    }
  }
}
```

---

## 16. Summary: Key Differences from Original Stack

| Aspect | Original (Supabase + OpenAI) | Alibaba Cloud |
|--------|------------------------------|---------------|
| Auth | Supabase Auth (Postgres-wrapped) | IDaaS (managed OAuth/OIDC) |
| Database | Supabase PostgreSQL | ApsaraDB RDS PostgreSQL |
| Vector search | pgvector (Supabase) | pgvector (RDS) — same extension |
| AI models | OpenAI GPT-4o / mini / turbo | Qwen-Max / Plus / Turbo via DashScope |
| Embeddings | OpenAI text-embedding-3-small | DashScope text-embedding-v3 |
| File storage | Supabase Storage (S3-compat) | OSS (S3-compat) |
| Compute | Vercel / self-hosted | SAE (serverless containers) |
| Cache/Queue | pg-boss or BullMQ on Redis | BullMQ on Tair Redis |
| CDN | Vercel Edge | Alibaba Cloud CDN |
| Monitoring | Vercel Analytics + Sentry | ARMS + SLS |
| CI/CD | Vercel Git integration | GitHub Actions → ACR → SAE |
| Region | US (Vercel default) | ap-southeast-1 (Singapore) |
| Cost | ~$50-200/mo (Vercel + Supabase + OpenAI) | ~$130-870/mo (Alibaba Cloud) |