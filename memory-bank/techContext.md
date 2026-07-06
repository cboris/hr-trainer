# Tech Context — Job Trainer AI

## Technology Stack Decisions

### Frontend

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | Next.js 14+ (App Router) | SSR for public pages, SPA for authenticated app, great DX |
| Language | TypeScript (strict) | Type safety across entire stack |
| Styling | Tailwind CSS | Rapid development, consistent design system |
| Client State | Zustand | Lightweight, no boilerplate, separate stores for UI vs AI |
| Server State | TanStack Query (React Query) | Caching, refetching, optimistic updates |
| Forms | React Hook Form + Zod | Validation on frontend + backend |
| Streaming | Custom SSE hook | Token-by-token AI response rendering |
| Icons | Lucide React | Consistent, tree-shakeable |

### Backend

| Concern | Choice | Rationale |
|---------|--------|-----------|
| API | Next.js API routes (BFF pattern) | Start monolithic, extract to FastAPI when needed |
| Auth | IDaaS (Alibaba Cloud) | Managed OAuth/OIDC, Google/GitHub/LinkedIn social login, MFA |
| ORM | Prisma or Drizzle | Type-safe queries, auto-generated TypeScript types |
| Queue | BullMQ on Redis (Tair) | Async embedding generation, document processing |
| Validation | Zod | Shared schemas between frontend and backend |

### Database

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Primary DB | ApsaraDB RDS for PostgreSQL | Managed PostgreSQL on Alibaba Cloud, JSONB for flexible schemas |
| Vector Search | pgvector extension (on RDS) | Avoids separate vector DB; co-located with relational data |
| File Storage | OSS (Alibaba Cloud Object Storage) | S3-compatible, CV exports, profile photos, imported documents |
| Caching | ApsaraDB Redis (Tair) | Session cache, rate limiting, BullMQ-compatible queue |
| Migrations | Prisma Migrate or Drizzle Kit | Version-controlled schema changes |

### AI/ML

| Concern | Choice | Rationale |
|---------|--------|-----------|
| LLM (complex) | Qwen-Max via DashScope | Best Qwen quality for CV tailoring, interview scoring |
| LLM (light) | Qwen-Plus via DashScope | Cost-effective for JD parsing, gap analysis, persona builder |
| LLM (extraction) | Qwen-Turbo via DashScope | High-volume episodic memory extraction |
| Embeddings | DashScope text-embedding-v3 (1536 dims) | Alibaba Cloud native, fits pgvector |
| Streaming | SSE (Server-Sent Events) | Simpler than WebSocket, works with serverless |
| Context Window | ~4K tokens input + ~4K output | Expandable with Qwen-Max's 32K context |
| Response Format | JSON mode for structured output | Reliable parsing for JD extraction, scoring |

### Cloud Infrastructure (Alibaba Cloud)

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Region | ap-southeast-1 (Singapore) | International users, GDPR-compatible |
| Compute | SAE (Serverless App Engine) | Zero K8s ops, auto-scaling, pay-per-request |
| CDN | Alibaba Cloud CDN | Edge caching, OSS origin, global delivery |
| Load Balancer | ALB (Application Load Balancer) | HTTPS termination, health checks |
| Monitoring | ARMS + SLS | APM tracing, log aggregation, alerting |
| CI/CD | GitHub Actions → ACR → SAE | Docker build, push to Container Registry, deploy |
| Secrets | KMS (Key Management Service) | API keys, DB credentials, encryption keys |

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT: Next.js SPA + PWA + Browser Extension                  │
├─────────────────────────────────────────────────────────────────┤
│  ALIBABA CLOUD CDN (static assets + edge caching)               │
├─────────────────────────────────────────────────────────────────┤
│  API GATEWAY: Next.js API Routes on SAE (BFF)                   │
│  IDaaS Auth │ SSE Streaming │ Rate Limiting │ Routing           │
├─────────────────────────────────────────────────────────────────┤
│  CORE SERVICES (monolith → microservices when needed)           │
│  Profile Service │ Document Service │ Training Service          │
├─────────────────────────────────────────────────────────────────┤
│  AI ORCHESTRATION LAYER                                         │
│  Persona Builder │ Market Scout │ Pitch Writer │ Interview Coach│
│  ─────────────── DashScope LLM Gateway (Qwen) ──────────────── │
│  Context Assembly │ Memory Management │ Tool Calling │ Streaming│
├─────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                     │
│  RDS PostgreSQL (relational) │ pgvector (embeddings)            │
│  OSS (files) │ Redis/Tair (cache + queue)                       │
└─────────────────────────────────────────────────────────────────┘
```

> See [cloud.md](./cloud.md) for full Alibaba Cloud architecture details.

## AI Memory Architecture

Four-layer memory system:

| Layer | Purpose | Storage | Token Budget |
|-------|---------|---------|--------------|
| L1: Working Memory | Current prompt context | Assembled per-request | ~4K tokens |
| L2: Semantic Memory | Long-term knowledge (embeddings) | pgvector | N/A (retrieved) |
| L3: Episodic Memory | Conversation learnings, corrections | pgvector + Postgres | N/A (retrieved) |
| L4: Procedural Memory | Agent system prompts, behaviors | Code/config | ~500 tokens |

### Memory Lifecycle

```
CREATE → EMBED → STORE → RETRIEVE → DECAY → CONSOLIDATE
```

## Key Design Patterns

### CV Tailoring Pipeline (4 stages)

1. **Parse JD** → Extract structured signals (skills, seniority, keywords) via LLM
2. **Retrieve Profile** → Semantic search for 5-8 most relevant snippets via pgvector
3. **Gap Analysis** → Scored diff: matches vs gaps with strategies (reframe/amplify/acknowledge/omit)
4. **Generate & Stream** → Section-by-section CV written token-by-token into editor

### Gap Handling Strategies

| Strategy | When to Use |
|----------|-------------|
| Reframe | Adjacent skill covers the gap implicitly |
| Amplify | Skill exists but is buried in profile |
| Acknowledge + Growth | Real gap, but user has learning signals |
| Omit | Gap is irrelevant to the role |

### Interview Scoring

Three dimensions (0-10 each):
- **Relevance** (30%): Does the answer directly address the question?
- **Specificity** (40%): Does it include concrete examples with metrics?
- **Communication** (30%): Is it well-structured, concise, compelling?

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- Next.js project setup with App Router + TypeScript + Tailwind
- Supabase auth (email + Google OAuth)
- PostgreSQL schema + Prisma ORM setup
- Profile intake wizard (basic form flow)
- Dashboard shell with AI panel layout
- Basic AI chat (no memory, just context-free chat)

### Phase 2: AI Memory + Profile (Weeks 4-6)
- pgvector setup + embedding generation pipeline
- Semantic profile retrieval
- Conversation history with episodic memory extraction
- Persona Builder agent (guided profile Q&A)
- Skills grid with AI-assisted level detection
- Experience timeline editor

### Phase 3: Market + Documents (Weeks 7-9)
- Job posting parser (LLM-based extraction)
- Match scoring algorithm
- Pitch Writer agent (CV tailoring pipeline)
- Split-pane CV editor with streaming
- Cover letter builder
- Document export (PDF/DOCX)

### Phase 4: Training + Polish (Weeks 10-12)
- Interview Coach agent
- Mock interview UI with recording
- Scoring + feedback system
- Application checklist generator
- Market Scout agent (basic)
- Mobile responsive polish
- Performance optimization

## Suggested First Version Stack

For fastest path to working prototype on Alibaba Cloud:

```
Frontend:   Next.js 14 + TypeScript + Tailwind + Zustand + TanStack Query
Backend:    Next.js API routes (BFF pattern) on SAE
Database:   ApsaraDB RDS PostgreSQL + pgvector
Auth:       IDaaS (Google + GitHub + LinkedIn OAuth)
AI:         DashScope — Qwen-Max / Qwen-Plus + text-embedding-v3
Streaming:  SSE (Server-Sent Events)
Files:      OSS (S3-compatible)
Cache/Queue: ApsaraDB Redis (Tair) + BullMQ
CDN:        Alibaba Cloud CDN
Region:     ap-southeast-1 (Singapore)
```

This stack leverages Alibaba Cloud's managed services to minimize ops overhead while supporting all core features. DashScope's OpenAI-compatible API makes migration straightforward. The browser extension can start as a simple bookmarklet that sends a URL to the Market Scout agent.
