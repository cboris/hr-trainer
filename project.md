# Project Deep Dive — Job Trainer AI

## 1. Persistence Layer — Detailed Architecture

### 1.1 Database Strategy: Three-Store Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA STORES                               │
├──────────────────┬──────────────────┬───────────────────────────┤
│   PostgreSQL     │    pgvector      │    S3 + Metadata DB       │
│   (Relational)   │   (Embeddings)   │    (Documents)            │
├──────────────────┼──────────────────┼───────────────────────────┤
│ • Users/Auth     │ • Profile embed- │ • CV PDFs/DOCX            │
│ • Profile data   │   dings          │ • Cover letters           │
│ • Skills         │ • Job posting    │ • Job posting snapshots   │
│ • Work history   │   embeddings     │ • Interview transcripts   │
│ • Sessions       │ • Conversation   │ • Templates               │
│ • Preferences    │   memory         │ • Exported documents      │
│ • App settings   │ • Skill cluster  │                           │
│                  │   vectors        │                           │
└──────────────────┴──────────────────┴───────────────────────────┘
```

### 1.2 PostgreSQL Schema (Core Tables)

```sql
-- ===== USERS & AUTH =====
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255),
  avatar_url    TEXT,
  auth_provider VARCHAR(50) DEFAULT 'supabase',
  auth_ext_id   VARCHAR(255),
  plan          VARCHAR(20) DEFAULT 'free',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ===== PROFILE =====
CREATE TABLE profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  headline        VARCHAR(500),
  summary         TEXT,
  years_experience INTEGER,
  location        VARCHAR(255),
  location_type   VARCHAR(50),
  salary_min      INTEGER,
  salary_max      INTEGER,
  salary_currency VARCHAR(3) DEFAULT 'USD',
  linkedin_url    TEXT,
  portfolio_url   TEXT,
  github_url      TEXT,
  is_complete     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===== SKILLS =====
CREATE TABLE skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  category    VARCHAR(100),
  level       VARCHAR(20),
  years_used  DECIMAL(3,1),
  endorsed    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ===== WORK EXPERIENCE =====
CREATE TABLE experiences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  company       VARCHAR(255) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  start_date    DATE,
  end_date      DATE,
  is_current    BOOLEAN DEFAULT FALSE,
  description   TEXT,
  bullets       JSONB,
  achievements  JSONB,
  embedding_id  UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ===== EDUCATION =====
CREATE TABLE education (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  institution   VARCHAR(255),
  degree        VARCHAR(255),
  field         VARCHAR(255),
  start_year    INTEGER,
  end_year      INTEGER,
  gpa           DECIMAL(3,2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ===== CERTIFICATIONS =====
CREATE TABLE certifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(255),
  issuer        VARCHAR(255),
  issued_date   DATE,
  expiry_date   DATE,
  credential_id VARCHAR(255),
  url           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ===== JOBS =====
CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  external_id     VARCHAR(255),
  source          VARCHAR(100),
  source_url      TEXT,
  title           VARCHAR(255) NOT NULL,
  company         VARCHAR(255),
  location        VARCHAR(255),
  salary_range    VARCHAR(100),
  raw_description TEXT,
  parsed_skills   JSONB,
  seniority       VARCHAR(50),
  embedding_id    UUID,
  status          VARCHAR(30) DEFAULT 'saved',
  match_score     INTEGER,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===== DOCUMENTS =====
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id        UUID REFERENCES jobs(id),
  type          VARCHAR(30) NOT NULL,
  title         VARCHAR(255),
  content_json  JSONB,
  content_md    TEXT,
  content_html  TEXT,
  template_id   VARCHAR(100),
  version       INTEGER DEFAULT 1,
  is_active     BOOLEAN DEFAULT FALSE,
  s3_key        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TRAINING SESSIONS =====
CREATE TABLE training_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id        UUID REFERENCES jobs(id),
  type          VARCHAR(50) NOT NULL,
  status        VARCHAR(30) DEFAULT 'active',
  config        JSONB,
  score         INTEGER,
  feedback      TEXT,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- ===== INTERVIEW RESPONSES =====
CREATE TABLE interview_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  question_type VARCHAR(50),
  answer        TEXT,
  score         INTEGER,
  feedback      TEXT,
  improvements  JSONB,
  duration_sec  INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ===== CONVERSATIONS =====
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_type    VARCHAR(50),
  context_type  VARCHAR(50),
  context_id    UUID,
  title         VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ===== MESSAGES =====
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL,
  content         TEXT NOT NULL,
  tool_calls      JSONB,
  tool_results    JSONB,
  tokens_used     INTEGER,
  model           VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===== CHECKLISTS =====
CREATE TABLE checklists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id        UUID REFERENCES jobs(id),
  title         VARCHAR(255),
  items         JSONB NOT NULL,
  progress      INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_skills_user ON skills(user_id);
CREATE INDEX idx_experiences_user ON experiences(user_id);
CREATE INDEX idx_jobs_user ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(user_id, status);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_job ON documents(job_id);
CREATE INDEX idx_training_user ON training_sessions(user_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
```

### 1.3 Key Persistence Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary DB | ApsaraDB RDS for PostgreSQL | Managed PostgreSQL on Alibaba Cloud; JSONB gives flexibility for evolving schemas |
| Auth | IDaaS (Alibaba Cloud) | Managed OAuth/OIDC; Google/GitHub/LinkedIn social login; MFA |
| Vector search | pgvector extension (on RDS) | Avoids separate Pinecone/Weaviate; co-located with relational data |
| File storage | OSS (Alibaba Cloud Object Storage) | S3-compatible; CV exports, profile photos |
| Caching | ApsaraDB Redis (Tair) | Session cache, rate limiting, BullMQ-compatible queue |
| Migrations | Prisma or Drizzle ORM | Type-safe queries, auto-generated TypeScript types |
| JSONB usage | bullets, achievements, parsed_skills, config, items | Flexible schema for evolving data structures |

> See [memory-bank/cloud.md](memory-bank/cloud.md) for full Alibaba Cloud service mapping and architecture.

### 1.4 Data Flow: Profile → Embedding Pipeline

```
User Input (Intake Wizard)
        │
        ▼
┌─────────────────┐
│  VALIDATION &   │  ← Zod schemas on frontend + backend
│  NORMALIZATION  │  ← Skill name normalization (React.js = React = ReactJS)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POSTGRES WRITE │  ← profiles, skills, experiences tables
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  EMBEDDING GEN  │  ← OpenAI text-embedding-3-small (1536 dims)
│  (async queue)  │  ← BullMQ or pg-boss for job queue
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PGVECTOR WRITE │  ← Store embeddings with metadata
└─────────────────┘
```

### 1.5 Row Level Security (Supabase)

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Applied to all tables: skills, experiences, jobs, documents, etc.
CREATE POLICY "Users can view own skills"
  ON skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own skills"
  ON skills FOR ALL
  USING (auth.uid() = user_id);
```

---

## 2. AI Memory — Detailed Architecture

### 2.1 Memory Architecture Overview

The AI memory system has **four layers**, each serving a different purpose:

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI MEMORY LAYERS                              │
├──────────────────┬──────────────────┬───────────────────────────┤
│   L1: Working    │   L2: Semantic   │   L3: Episodic            │
│   Memory         │   Memory         │   Memory                  │
│   (Context Win)  │   (Vector Store) │   (Conversation History)  │
├──────────────────┼──────────────────┼───────────────────────────┤
│ Current prompt   │ Profile embed-   │ Past conversations        │
│ + active job     │ dings            │ User corrections          │
│ + recent msgs    │ Job embeddings   │ Preferences learned       │
│ + tool results   │ Skill clusters   │ Feedback patterns         │
│                  │                  │                           │
├──────────────────┴──────────────────┴───────────────────────────┤
│   L4: Procedural Memory (System Prompts + Agent Configs)        │
│   Fine-tuned behaviors, prompt templates, agent personalities   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 L1: Working Memory (Context Assembly)

This is what gets injected into every LLM call. It's the most critical piece — too little context and the AI is generic; too much and you burn tokens + get lost-in-the-middle problems.

**Context Assembly Pipeline:**

```typescript
// context-assembler.ts
interface ContextWindow {
  system_prompt: string;        // ~500 tokens — agent persona + instructions
  user_profile_slice: string;   // ~800 tokens — relevant profile snippets
  job_context?: string;         // ~600 tokens — job posting + parsed skills
  conversation_history: string; // ~1500 tokens — last N messages
  tool_results?: string;        // ~500 tokens — recent tool outputs
  user_preferences: string;     // ~200 tokens — tone, format preferences
}

// Total budget: ~4100 tokens context + ~4000 tokens response = 8K model
// For Qwen-Max: can expand to ~30K tokens context (32K window)

async function assembleContext(
  userId: string,
  agentType: AgentType,
  currentJobId?: string,
  conversationId?: string
): Promise<ContextWindow> {

  // 1. SYSTEM PROMPT — agent-specific personality + capabilities
  const system_prompt = getSystemPrompt(agentType);

  // 2. USER PROFILE SLICE — semantic retrieval
  const profileSlice = await semanticProfileRetrieval(
    userId,
    currentJobId ? await getJobEmbedding(currentJobId) : null,
    { max_snippets: 8, types: ['experience', 'skill', 'project'] }
  );

  // 3. JOB CONTEXT — if working on a specific role
  const jobContext = currentJobId
    ? await getJobContext(currentJobId)
    : undefined;

  // 4. CONVERSATION HISTORY — sliding window + summary
  const history = await getConversationHistory(
    conversationId,
    { max_messages: 10, include_summary: true }
  );

  // 5. USER PREFERENCES — learned over time
  const prefs = await getUserPreferences(userId);

  return {
    system_prompt,
    user_profile_slice: profileSlice,
    job_context: jobContext,
    conversation_history: history,
    user_preferences: prefs
  };
}
```

### 2.3 L2: Semantic Memory (pgvector)

Long-term knowledge store. Everything about the user gets embedded and stored for retrieval.

**pgvector Schema:**

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Profile content embeddings
CREATE TABLE profile_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL,
  source_id   UUID,
  content     TEXT NOT NULL,
  embedding   vector(1536) NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Job posting embeddings
CREATE TABLE job_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID REFERENCES jobs(id) ON DELETE CASCADE,
  content_type VARCHAR(50),
  content     TEXT NOT NULL,
  embedding   vector(1536) NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation memory embeddings (for long-term recall)
CREATE TABLE memory_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID,
  content_type  VARCHAR(50),
  content       TEXT NOT NULL,
  embedding     vector(1536) NOT NULL,
  importance    FLOAT DEFAULT 0.5,
  access_count  INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast similarity search
CREATE INDEX ON profile_embeddings
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX ON job_embeddings
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX ON memory_embeddings
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```

**Semantic Retrieval Function:**

```typescript
async function semanticProfileRetrieval(
  userId: string,
  queryEmbedding: number[] | null,
  options: { max_snippets: number; types: string[] }
): Promise<string> {

  if (!queryEmbedding) {
    // No specific job — return most recent/important profile items
    const results = await sql`
      SELECT content FROM profile_embeddings
      WHERE user_id = ${userId}
        AND content_type = ANY(${options.types})
      ORDER BY created_at DESC
      LIMIT ${options.max_snippets}
    `;
    return results.map(r => r.content).join('\n---\n');
  }

  // Semantic search — find profile items most relevant to the query
  const results = await sql`
    SELECT content, 1 - (embedding <=> ${queryEmbedding}::vector) as similarity
    FROM profile_embeddings
    WHERE user_id = ${userId}
      AND content_type = ANY(${options.types})
      AND 1 - (embedding <=> ${queryEmbedding}::vector) > 0.7
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${options.max_snippets}
  `;

  return results.map(r => r.content).join('\n---\n');
}
```

### 2.4 L3: Episodic Memory (Conversation Learning Extraction)

Not just storing messages — storing *what happened* and *what was learned*.

```typescript
// After each conversation, extract and store episodic memories
async function extractEpisodicMemory(
  conversationId: string,
  messages: Message[]
): Promise<void> {

  // Use LLM to extract important learnings from the conversation
  const extraction = await llm.call({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: `Extract key learnings from this conversation. For each learning:
        - type: preference | correction | insight | goal
        - content: the specific learning
        - importance: 0.0-1.0
        Return JSON array.`
    }, {
      role: 'user',
      content: messages.map(m => `${m.role}: ${m.content}`).join('\n')
    }]
  });

  const learnings = JSON.parse(extraction);

  // Embed and store each learning
  for (const learning of learnings) {
    const embedding = await embed(learning.content);
    await sql`
      INSERT INTO memory_embeddings
        (user_id, conversation_id, content_type, content, embedding, importance)
      VALUES
        (${userId}, ${conversationId}, ${learning.type}, ${learning.content},
         ${embedding}, ${learning.importance})
    `;
  }
}
```

### 2.5 L4: Procedural Memory (Agent System Prompts)

Each agent has a carefully crafted system prompt that defines its behavior:

```typescript
const AGENT_PROMPTS = {
  persona_builder: `You are a career profile builder. Your job is to help the user
    articulate their professional story. You ask probing questions about their
    experience, achievements, and goals. You never accept vague answers — you
    push for specifics with metrics. You summarize what you've learned after
    each exchange and confirm accuracy.

    CURRENT PROFILE STATE:
    {profile_summary}

    AREAS STILL TO EXPLORE:
    {missing_sections}`,

  pitch_writer: `You are a CV and cover letter specialist. You tailor documents
    by matching the user's profile to job requirements. You never fabricate
    experience. When there are gaps, you flag them explicitly and suggest
    strategies: reframe adjacent skills, acknowledge + show learning path,
    or omit if irrelevant. You show your reasoning.

    JOB REQUIREMENTS:
    {job_parsed}

    MATCHING PROFILE SNIPPETS:
    {profile_retrieval}

    GAP ANALYSIS:
    {gap_diff}`,

  interview_coach: `You are a mock interviewer. You adapt your questioning style
    to the role and seniority. After each answer, you score on: relevance (0-10),
    specificity (0-10), communication (0-10). You provide concrete improvement
    suggestions with example answers.

    INTERVIEW CONTEXT:
    {job_context}
    {company_culture}
    {previous_answers_summary}`,

  market_scout: `You are a labor market analyst. You provide data-driven insights
    about roles, companies, and market conditions. You cite sources. You compare
    the user's profile against market requirements and identify trends.

    USER PROFILE SUMMARY:
    {profile_summary}

    MARKET DATA:
    {market_context}`
};
```

### 2.6 Memory Lifecycle & Maintenance

```
┌─────────────────────────────────────────────────────────────┐
│                 MEMORY LIFECYCLE                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  CREATE        User adds experience, has conversation        │
│     │                                                         │
│     ▼                                                         │
│  EMBED         Async job generates embeddings (BullMQ)       │
│     │                                                         │
│     ▼                                                         │
│  STORE         Write to pgvector with metadata               │
│     │                                                         │
│     ▼                                                         │
│  RETRIEVE      Semantic search on each AI call               │
│     │                                                         │
│     ▼                                                         │
│  DECAY         importance *= 0.95 per week of no access      │
│     │                                                         │
│     ▼                                                         │
│  CONSOLIDATE   Monthly: merge similar memories, prune low    │
│                importance items, re-embed updated content    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. CV Tailoring Pipeline — Deep Dive

### 3.1 The Four-Stage Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Stage 1    │    │  Stage 2    │    │  Stage 3    │    │  Stage 4    │
│  Parse JD   │───▶│  Retrieve   │───▶│  Gap        │───▶│  Generate   │
│             │    │  Profile    │    │  Analysis   │    │  & Stream   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Stage 1 — Parse the JD:**
The agent strips the job description down to structured signals: required skills, preferred skills, seniority cues, company values language, and role-specific keywords. Done with a targeted LLM call using a strict extraction prompt, outputting JSON.

```typescript
interface ParsedJD {
  required_skills: { name: string; importance: number }[];
  preferred_skills: { name: string; importance: number }[];
  seniority_signals: string[];
  company_values: string[];
  role_keywords: string[];
  years_experience_required?: number;
  education_required?: string;
}

async function parseJobDescription(jd: string): Promise<ParsedJD> {
  const result = await llm.call({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [{
      role: 'system',
      content: `Extract structured signals from this job description.
        Output JSON with: required_skills, preferred_skills, seniority_signals,
        company_values, role_keywords, years_experience_required, education_required.`
    }, {
      role: 'user',
      content: jd
    }]
  });
  return JSON.parse(result);
}
```

**Stage 2 — Retrieve Profile Snippets:**
Rather than dumping the user's entire profile into the prompt, the agent runs a semantic search against the vector store — finding the 5-8 most relevant experience bullets, projects, and skills for this specific role.

```typescript
async function retrieveRelevantProfile(
  userId: string,
  parsedJD: ParsedJD
): Promise<ProfileSnippet[]> {
  // Embed the key requirements as a query
  const queryText = [
    ...parsedJD.required_skills.map(s => s.name),
    ...parsedJD.role_keywords
  ].join(', ');

  const queryEmbedding = await embed(queryText);

  // Semantic search across profile embeddings
  const snippets = await sql`
    SELECT content, content_type, source_id, metadata,
           1 - (embedding <=> ${queryEmbedding}::vector) as similarity
    FROM profile_embeddings
    WHERE user_id = ${userId}
      AND content_type IN ('experience_bullet', 'skill', 'project', 'summary')
      AND 1 - (embedding <=> ${queryEmbedding}::vector) > 0.65
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 8
  `;

  return snippets;
}
```

**Stage 3 — Gap Analysis:**
The agent compares extracted JD signals against retrieved profile snippets and produces a scored diff.

```typescript
interface GapAnalysis {
  strong_matches: { skill: string; evidence: string; confidence: number }[];
  partial_matches: { skill: string; adjacent_skill: string; strategy: string }[];
  gaps: { skill: string; strategy: GapStrategy }[];
}

type GapStrategy =
  | { type: 'reframe'; message: string }        // Strategy A: adjacent skill
  | { type: 'acknowledge'; learning_path: string } // Strategy C: show growth
  | { type: 'omit'; reason: string };            // Skip if irrelevant

async function analyzeGaps(
  parsedJD: ParsedJD,
  profileSnippets: ProfileSnippet[]
): Promise<GapAnalysis> {
  const result = await llm.call({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [{
      role: 'system',
      content: `Compare job requirements against the candidate's profile.
        For each required skill, classify as: strong_match, partial_match, or gap.
        For gaps, suggest a strategy:
        - 'reframe': find adjacent skill that covers it
        - 'acknowledge': suggest learning path
        - 'omit': not relevant enough to mention
        Never fabricate experience.`
    }, {
      role: 'user',
      content: `JOB REQUIREMENTS: ${JSON.stringify(parsedJD)}
        CANDIDATE PROFILE: ${JSON.stringify(profileSnippets)}`
    }]
  });
  return JSON.parse(result);
}
```

**Stage 4 — Generate & Stream:**
The tailored CV is written section by section — summary first (rewritten to mirror the company's language), then experience bullets reordered and rephrased. Output streams token-by-token into the editor.

```typescript
async function generateTailoredCV(
  parsedJD: ParsedJD,
  profile: Profile,
  gapAnalysis: GapAnalysis,
  onToken: (token: string) => void
): Promise<void> {
  const sections = ['summary', 'experience', 'skills', 'education'];

  for (const section of sections) {
    const sectionPrompt = buildSectionPrompt(section, parsedJD, profile, gapAnalysis);

    await llm.stream({
      model: 'gpt-4o',
      messages: sectionPrompt,
      onToken: (token) => {
        onToken(token);
        // Also persist partial content for recovery
      }
    });

    onToken('\n\n---\n\n');  // Section separator
  }
}
```

### 3.2 Gap Handling Strategies

| Strategy | When to Use | Example |
|----------|-------------|---------|
| **A: Reframe** | Adjacent skill covers the gap implicitly | JD asks "motion design" → profile has "interaction specs with easing curves, Smart Animate prototypes" |
| **B: Amplify** | Skill exists but is buried | JD asks "stakeholder management" → profile has "worked with eng, design, PM" without labelling it |
| **C: Acknowledge + Growth** | Real gap, but user has learning signals | JD asks "Figma plugins" → user has a side project 70% done |
| **D: Omit** | Gap is irrelevant to the role | JD mentions "3D rendering" for a product design role |

### 3.3 Match Scoring Algorithm

```typescript
function calculateMatchScore(
  parsedJD: ParsedJD,
  profileSnippets: ProfileSnippet[],
  gapAnalysis: GapAnalysis
): number {
  const totalWeight = parsedJD.required_skills.reduce((sum, s) => sum + s.importance, 0);

  let matchedWeight = 0;
  for (const match of gapAnalysis.strong_matches) {
    const skill = parsedJD.required_skills.find(s => s.name === match.skill);
    if (skill) matchedWeight += skill.importance * match.confidence;
  }
  for (const partial of gapAnalysis.partial_matches) {
    const skill = parsedJD.required_skills.find(s => s.name === partial.skill);
    if (skill) matchedWeight += skill.importance * 0.5;  // partial credit
  }

  return Math.round((matchedWeight / totalWeight) * 100);
}
```

---

## 4. Interview Coaching System

### 4.1 Question Generation

```typescript
const QUESTION_TYPES = {
  behavioral: {
    prompt: `Generate a behavioral interview question for a {role} at {company}.
      Focus on: {competency}. Use STAR format expectation.`,
    scoring: { relevance: 0.3, specificity: 0.4, communication: 0.3 }
  },
  technical: {
    prompt: `Generate a technical question for a {role} about {skill_area}.
      Expect a {seniority}-level answer with concrete examples.`,
    scoring: { relevance: 0.3, specificity: 0.4, communication: 0.3 }
  },
  situational: {
    prompt: `Present a realistic scenario a {role} at {company} might face involving {situation}.
      Ask how they would handle it.`,
    scoring: { relevance: 0.3, specificity: 0.3, communication: 0.4 }
  },
  culture: {
    prompt: `Generate a culture-fit question based on {company}'s values: {values}.
      The question should reveal if the candidate aligns with these values.`,
    scoring: { relevance: 0.4, specificity: 0.3, communication: 0.3 }
  }
};
```

### 4.2 Answer Scoring

```typescript
interface AnswerScore {
  relevance: number;      // 0-10: How directly does the answer address the question?
  specificity: number;    // 0-10: Does it include concrete examples with metrics?
  communication: number;  // 0-10: Is it well-structured, concise, compelling?
  overall: number;        // weighted average
  feedback: string;       // specific improvement suggestions
  example_answer: string; // model answer for comparison
}

async function scoreAnswer(
  question: InterviewQuestion,
  answer: string,
  jobContext: JobContext,
  userProfile: Profile
): Promise<AnswerScore> {
  const result = await llm.call({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [{
      role: 'system',
      content: `Score this interview answer on three dimensions (0-10 each):
        - relevance: Does it directly address the question?
        - specificity: Does it include concrete examples with metrics?
        - communication: Is it well-structured and compelling?
        Provide specific feedback and a model answer for comparison.`
    }, {
      role: 'user',
      content: `QUESTION: ${question.text}
        JOB CONTEXT: ${jobContext.summary}
        CANDIDATE PROFILE: ${userProfile.summary}
        ANSWER: ${answer}`
    }]
  });
  return JSON.parse(result);
}
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- [ ] Next.js project setup with App Router + TypeScript + Tailwind
- [ ] Supabase auth (email + Google OAuth)
- [ ] PostgreSQL schema + Prisma ORM setup
- [ ] Profile intake wizard (basic form flow)
- [ ] Dashboard shell with AI panel layout
- [ ] Basic AI chat (no memory, just context-free chat)

### Phase 2: AI Memory + Profile (Weeks 4-6)
- [ ] pgvector setup + embedding generation pipeline
- [ ] Semantic profile retrieval
- [ ] Conversation history with episodic memory extraction
- [ ] Persona Builder agent (guided profile Q&A)
- [ ] Skills grid with AI-assisted level detection
- [ ] Experience timeline editor

### Phase 3: Market + Documents (Weeks 7-9)
- [ ] Job posting parser (LLM-based extraction)
- [ ] Match scoring algorithm
- [ ] Pitch Writer agent (CV tailoring pipeline)
- [ ] Split-pane CV editor with streaming
- [ ] Cover letter builder
- [ ] Document export (PDF/DOCX)

### Phase 4: Training + Polish (Weeks 10-12)
- [ ] Interview Coach agent
- [ ] Mock interview UI with recording
- [ ] Scoring + feedback system
- [ ] Application checklist generator
- [ ] Market Scout agent (basic)
- [ ] Mobile responsive polish
- [ ] Performance optimization

---

## 6. Key Technical Decisions Summary

| Area | Decision | Why |
|------|----------|-----|
| Framework | Next.js 14+ App Router | SSR for public, SPA for app, great DX |
| Backend | Next.js API routes (BFF) on SAE | Start simple, extract when needed |
| Database | ApsaraDB RDS PostgreSQL + pgvector | One DB for relational + vectors, managed on Alibaba Cloud |
| Auth | IDaaS (Alibaba Cloud) | Managed OAuth/OIDC, social login, MFA |
| AI | DashScope — Qwen-Max / Qwen-Plus + text-embedding-v3 | Qwen models via OpenAI-compatible API, cost-effective |
| Streaming | SSE (not WebSocket) | Simpler, works with serverless, sufficient for AI |
| State | Zustand + TanStack Query | Lightweight, no boilerplate, great for this use case |
| Styling | Tailwind CSS | Rapid development, consistent design system |
| Queue | BullMQ on ApsaraDB Redis (Tair) | Async embedding generation, document processing |
| ORM | Prisma or Drizzle | Type-safe queries, auto-generated TypeScript types |
| Cloud | Alibaba Cloud (ap-southeast-1) | International users, GDPR-compatible, full service stack |
