# Job Trainer AI — Personal Career Coach

## About
An AI-powered web application that helps job seekers build profiles, tailor CVs, prepare for interviews, and navigate the labor market — all through a persistent AI trainer that learns and remembers.


Project is published under [MIT Open Source License](LICENSE) 

## What It Does

1. **Captures professional data** through guided conversation
   - Basic details, work history, skills, education
   - AI asks probing questions to build a rich profile narrative
   - Memorizes details for future CV generation and applications
2. **Market analysis** — parses job postings, scores match, identifies skill gaps
3. **CV/cover letter tailoring** — generates role-specific documents with transparent gap handling
4. **Interview training** — mock interviews with scoring, feedback, and improvement suggestions
5. **Agent-based job capture** — browser extension captures job postings as the user browses (with permission)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Next.js SPA │  │  PWA (Mobile)│  │  Browser Extension       │  │
│  │  (Main App)  │  │  (Responsive)│  │  (Job Capture Agent)     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
└─────────┼──────────────────┼───────────────────────┼────────────────┘
          │                  │                       │
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                                    │
│  JWT/OAuth Auth │ WebSocket/SSE │ Rate Limiting │ Request Routing   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  PROFILE SERVICE│ │ DOCUMENT SERVICE│ │ TRAINING SERVICE│
│  • Intake wizard│ │ • CV generation │ │ • Mock interview│
│  • Skills mgmt  │ │ • Templates     │ │ • Checklists    │
│  • Work history │ │ • Versioning    │ │ • Scoring       │
│  • Preferences  │ │ • Export        │ │ • Session hist  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AI ORCHESTRATION LAYER                             │
│  ┌────────────────┐ ┌──────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Persona Builder│ │ Market Scout │ │ Pitch Writer│ │ Interview │ │
│  │ (Profile Q&A)  │ │ (Job Intel)  │ │ (CV/CL Gen) │ │ Coach     │ │
│  └───────┬────────┘ └──────┬───────┘ └──────┬──────┘ └─────┬─────┘ │
│          └──────────────────┴────────────────┴──────────────┘       │
│                              │                                       │
│                    ┌─────────▼─────────┐                            │
│                    │   LLM Gateway     │                            │
│                    │ • Context assembly│                            │
│                    │ • Memory mgmt     │                            │
│                    │ • Tool calling    │                            │
│                    │ • Streaming       │                            │
│                    └───────────────────┘                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │    pgvector     │ │  S3 + Metadata  │
│   (Relational)  │ │   (Embeddings)  │ │   (Documents)   │
│                 │ │                 │ │                   │
│ • Users/Auth    │ │ • Profile embeds│ │ • CV exports     │
│ • Profile data  │ │ • Job embeds    │ │ • Cover letters  │
│ • Skills        │ │ • Memory embeds │ │ • Job snapshots  │
│ • Work history  │ │ • Skill clusters│ │ • Templates      │
│ • Sessions      │ │                 │ │                   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind | SSR for public pages, SPA for app |
| State | Zustand + TanStack Query | Lightweight client state + server data caching |
| Backend | Next.js API routes (BFF) on SAE | Start monolithic, extract when needed |
| Database | ApsaraDB RDS PostgreSQL + pgvector | Relational + vector in one DB, managed |
| Auth | IDaaS (Alibaba Cloud) | OAuth/OIDC, Google/GitHub/LinkedIn, MFA |
| AI | DashScope — Qwen-Max / Qwen-Plus + text-embedding-v3 | Qwen models via OpenAI-compatible API |
| Streaming | SSE (Server-Sent Events) | Simpler than WebSocket, works with serverless |
| File Storage | OSS (Alibaba Cloud) | S3-compatible, CV exports, profile photos |
| Cache/Queue | ApsaraDB Redis (Tair) + BullMQ | Session cache, async job processing |
| CDN | Alibaba Cloud CDN | Edge caching, global delivery |
| Region | ap-southeast-1 (Singapore) | International users, GDPR-compatible |

## AI Memory Architecture

Four-layer memory system:

| Layer | Purpose | Storage |
|-------|---------|---------|
| **L1: Working Memory** | Current prompt context (profile slice, job, recent messages) | Assembled per-request |
| **L2: Semantic Memory** | Long-term knowledge (profile, jobs, skills as embeddings) | pgvector |
| **L3: Episodic Memory** | Conversation learnings, user corrections, preferences | pgvector + Postgres |
| **L4: Procedural Memory** | Agent system prompts, behaviors, prompt templates | Code/config |

## Key Features

### CV Tailoring Pipeline
1. **Parse JD** → Extract structured signals (skills, seniority, keywords)
2. **Retrieve profile** → Semantic search for 5-8 most relevant snippets
3. **Gap analysis** → Scored diff: matches vs gaps with strategies
4. **Generate & stream** → Section-by-section CV written token-by-token into editor

### Interview Coaching
- Behavioral, technical, situational, and culture-fit questions
- Scoring on relevance (0-10), specificity (0-10), communication (0-10)
- Concrete improvement suggestions with example answers

### Persistent AI Panel
- Always accessible side drawer across all screens
- Context-aware (knows which job/profile you're viewing)
- Suggested actions tied to current screen

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           # Landing, login, signup
│   ├── (app)/              # Authenticated screens
│   └── api/                # API routes (BFF)
├── features/               # Feature modules
│   ├── profile/            # Profile intake, skills, experience
│   ├── documents/          # CV editor, cover letter, templates
│   ├── market/             # Job search, match score, salary
│   ├── training/           # Mock interview, checklists
│   └── ai-panel/           # Persistent AI chat panel
├── components/ui/          # Shared primitives
└── lib/                    # Utilities, API client, auth, store
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- Next.js project setup with App Router + TypeScript + Tailwind
- Supabase auth (email + Google OAuth)
- PostgreSQL schema + Prisma ORM
- Profile intake wizard
- Dashboard shell with AI panel layout
- Basic AI chat

### Phase 2: AI Memory + Profile (Weeks 4-6)
- pgvector setup + embedding generation pipeline
- Semantic profile retrieval
- Conversation history with episodic memory
- Persona Builder agent
- Skills grid + experience timeline

### Phase 3: Market + Documents (Weeks 7-9)
- Job posting parser
- Match scoring algorithm
- Pitch Writer agent (CV tailoring)
- Split-pane CV editor with streaming
- Document export (PDF/DOCX)

### Phase 4: Training + Polish (Weeks 10-12)
- Interview Coach agent
- Mock interview UI
- Scoring + feedback system
- Application checklist generator
- Market Scout agent
- Mobile responsive polish

## Documentation

- [Frontend Architecture](FRONTEND.md) — Detailed UI specs, component architecture, screen flows
- [Project Deep Dive](project.md) — Persistence layer, AI memory, CV tailoring pipeline
- [Cloud Architecture](memory-bank/cloud.md) — Alibaba Cloud deployment, service mapping, cost estimates


