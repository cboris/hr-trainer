# System Patterns — Job Trainer AI

## Web App Frontend Layer

The frontend is where users spend all their time, so it deserves real depth. Here's how it's broken down across structure, screens, and component architecture.

**Technology stack**: Next.js 14+ (App Router) — SSR for public-facing pages (landing, login), client-side SPA behavior for the authenticated app. TypeScript throughout. Tailwind for styling. Zustand for lightweight client state. TanStack Query for all server data. Deployed on Alibaba Cloud SAE with CDN.

### Implemented UI Components (Current State)

```
src/
  app/
    layout.tsx                    ← Root layout: Inter font, metadata, Providers wrapper
    globals.css                   ← Global styles + Tailwind design tokens
    (app)/                        ← Route group for authenticated pages (shared sidebar layout)
      dashboard/page.tsx          ← Server component: welcome, profile completion banner,
                                    stats grid (skills/training/profile), recent training,
                                    quick actions. Uses getServerSession + Prisma.
      profile/page.tsx            ← Client component: 2-step wizard (basic info → skills).
                                    Fetches/saves via /api/profile. Progress bar.
    api/
      ai/chat/route.ts            ← POST endpoint: streams AI responses via DashScope
      profile/route.ts            ← GET/PUT: profile + skills CRUD
      auth/[...nextauth]/route.ts ← NextAuth configuration
  components/
    providers.tsx                 ← Client providers: SessionProvider + QueryClientProvider
    sidebar.tsx                   ← Navigation sidebar: Dashboard, Profile, Jobs, Documents,
                                    Training links. Active route highlighting via usePathname.
                                    Shows user name from session.
    ai-panel.tsx                  ← AI chat panel: message list, textarea input, streaming
                                    responses from /api/ai/chat. Auto-scroll, loading states.
  lib/
    ai.ts                         ← OpenAI singleton (DashScope), AI_CONFIG (model, temp, tokens)
    prisma.ts                     ← Prisma client singleton
    redis.ts                      ← Redis client singleton
    s3.ts                         ← S3/OSS client singleton
  config/
    env.ts                        ← Centralized env var access (validated)
```

### Key Screens and Their Roles (Planned vs Implemented)

```
IMPLEMENTED
├── /dashboard → Server-rendered overview: profile completeness, stats,
│                recent training sessions, quick action cards
├── /profile   → 2-step client wizard: basic info (headline, location,
│                experience, summary) → skills (add/remove with levels)
├── AI Panel   → Persistent chat component, fetches /api/ai/chat
├── Sidebar    → Navigation with 5 items, active state, user display
└── Providers  → SessionProvider + QueryClientProvider wrapping

PLANNED (not yet implemented)
PUBLIC SCREENS
├── / → Landing page (value prop, CTA, social proof)
├── /login → IDaaS OAuth (Google, GitHub, LinkedIn)
├── /signup → Registration with plan selection
└── /pricing → Feature comparison

AUTHENTICATED SCREENS
├── /jobs (market) → Job search, detail, match score, salary benchmarks
├── /documents → CV editor, cover letter builder, template gallery
├── /training → Mock interview, checklist, session history, skill drills
└── /settings → Account, preferences, integrations
```

### Core UX Design Decisions

**The AI panel is ambient, not modal.** Rather than a popup that hijacks the screen, the AI trainer lives in a persistent right-side panel (collapsible on mobile). It's always context-aware — when you're on the job detail screen, it already knows which job you're looking at. This avoids the friction of re-explaining context every time.

**Match scoring drives the UX.** The skill gap bars on the job detail are the core value proposition made visual — the user should immediately see what they have and what's missing. The AI actions below are directly tied to those gaps ("how to close skill gaps"), which makes the AI feel purposeful rather than generic.

### Component Architecture — Current vs Planned

```
CURRENT (flat structure)
src/
  components/
    providers.tsx       ← Auth + query providers
    sidebar.tsx         ← Main navigation
    ai-panel.tsx        ← AI chat interface
  app/(app)/
    dashboard/page.tsx  ← Dashboard (server component)
    profile/page.tsx    ← Profile wizard (client component)

PLANNED (feature-based structure)
src/
  features/
    profile/        ← ProfileCard, SkillsGrid, IntakeWizard, ExperienceTimeline
    documents/      ← CVEditor, CoverLetterBuilder, TemplateGallery, StreamingDocument
    market/         ← JobCard, JobDetail, MatchScore, SalaryBenchmark, SkillGapAnalysis
    training/       ← MockInterview, ChecklistView, SessionHistory, ScoreBreakdown
    ai-panel/       ← ChatPanel, SuggestedActions, StreamingMessage, ContextIndicator
  components/
    ui/             ← Button, Card, Badge, ProgressBar, CircularProgress (shared primitives)
  lib/
    api/            ← React Query hooks (useProfile, useJobs, useSession), SSE client
    auth/           ← useAuth, IDaaS OAuth client, session management
    store/          ← Zustand stores (useAppStore, useAIStore)
    streaming/      ← SSE connection manager, useStreamingMessage hook
```

### Streaming Architecture

The streaming hook is worth building carefully from the start. AI responses stream token-by-token, so you need a `useStreamingMessage` hook that handles the SSE connection, accumulates the text, and handles errors and reconnects gracefully.

```typescript
// SSE Connection Manager
class SSEConnection {
  private abortController: AbortController;

  async connect(endpoint: string, body: any, handlers: {
    onToken: (token: string) => void;
    onToolCall?: (tool: ToolCall) => void;
    onDone?: () => void;
    onError?: (err: Error) => void;
  }) {
    this.abortController = new AbortController();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: this.abortController.signal,
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') { handlers.onDone?.(); return; }
        const parsed = JSON.parse(data);
        if (parsed.type === 'token') handlers.onToken(parsed.content);
        else if (parsed.type === 'tool_call') handlers.onToolCall?.(parsed);
      }
    }
    handlers.onDone?.();
  }

  disconnect() { this.abortController.abort(); }
}
```

### State Management Strategy

```typescript
// Zustand: UI state (lightweight, no boilerplate)
interface AppState {
  aiPanelOpen: boolean;
  aiPanelContext: { type: string; id: string } | null;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
}

// Zustand: AI panel state (separate for performance — updates frequently with streaming)
interface AIState {
  messages: Message[];
  isStreaming: boolean;
  currentAgent: AgentType | null;
  suggestedActions: SuggestedAction[];
}

// TanStack Query: Server state (caching, refetching, optimistic updates)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000, retry: 2 }
  }
});
```

### Mobile Strategy

Build as a responsive SPA first:

| Screen | Desktop | Mobile |
|--------|---------|--------|
| Dashboard | Full grid layout | Stacked cards |
| Profile | Side-by-side edit + preview | Single column edit |
| Job Detail | Two-column (info + match) | Stacked with tabs |
| CV Editor | Split-pane (analysis + editor) | Read-only with "edit on desktop" |
| AI Panel | Right-side drawer (384px) | Bottom sheet (full width) |
| Interview | Full question + answer area | Conversational chat layout |

The AI chat and interview coaching flows work naturally on mobile (conversational). The CV editor and market analysis need horizontal space, so on mobile those collapse to read-only views.

---

## AI Orchestration Layer

The LLM gateway handles context assembly (what slice of the user's profile to inject), memory management, tool calling, and streaming. All AI calls go through DashScope (Alibaba Cloud) using Qwen models — OpenAI-compatible API.

### Four Specialized Sub-Agents

| Agent | Purpose | Key Capability |
|-------|---------|----------------|
| **Persona Builder** | Conversational Q&A to build user's profile narrative | Probing questions, metric extraction |
| **Market Scout** | Pulls job board data, salary benchmarks, company intel | JD parsing, market analysis |
| **Pitch Writer** | Takes job posting + user profile → tailored CV/cover letter | Semantic matching, gap analysis |
| **Interview Coach** | Roleplays as interviewer, scores answers, gives feedback | Question generation, answer scoring |

### Context Assembly (Working Memory)

```typescript
interface ContextWindow {
  system_prompt: string;        // ~500 tokens — agent persona + instructions
  user_profile_slice: string;   // ~800 tokens — relevant profile snippets
  job_context?: string;         // ~600 tokens — job posting + parsed skills
  conversation_history: string; // ~1500 tokens — last N messages
  tool_results?: string;        // ~500 tokens — recent tool outputs
  user_preferences: string;     // ~200 tokens — tone, format preferences
}
```

---

## Data Layer Patterns

### Three-Store Model

| Store | Technology | Purpose |
|-------|-----------|---------|
| Relational DB | ApsaraDB RDS PostgreSQL | Users, profiles, skills, work history, sessions, preferences |
| Vector Store | pgvector (on RDS) | Profile embeddings, job embeddings, conversation memory |
| Document Store | OSS + metadata | CVs, cover letters, job posting snapshots, templates |
| Cache/Queue | ApsaraDB Redis (Tair) | Session cache, BullMQ job queue |

### Embedding Pipeline

```
User Input → Validation & Normalization → Postgres Write → Embedding Generation (async) → pgvector Write
```

### Memory Lifecycle

```
CREATE → EMBED → STORE → RETRIEVE → DECAY → CONSOLIDATE
```

- **CREATE**: User adds experience, has conversation
- **EMBED**: Async job generates embeddings (BullMQ on Tair, DashScope text-embedding-v3)
- **STORE**: Write to pgvector on RDS with metadata
- **RETRIEVE**: Semantic search on each AI call
- **DECAY**: importance *= 0.95 per week of no access
- **CONSOLIDATE**: Monthly merge of similar memories, prune low-importance items