# Frontend Architecture — Job Trainer AI

## Technology Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | Next.js 14+ (App Router) | SSR for public pages, SPA for authenticated app |
| Language | TypeScript (strict) | Type safety across the entire stack |
| Styling | Tailwind CSS | Rapid development, consistent design system |
| Client State | Zustand | Lightweight, no boilerplate, separate stores for UI vs AI |
| Server State | TanStack Query (React Query) | Caching, refetching, optimistic updates |
| Forms | React Hook Form + Zod | Validation on frontend + backend |
| Streaming | Custom SSE hook | Token-by-token AI response rendering |
| Icons | Lucide React | Consistent, tree-shakeable icon set |
| Animations | Framer Motion (optional) | Subtle transitions for panel open/close |

## Screen Architecture

### Screen Map

```
PUBLIC SCREENS
├── / → Landing page (value prop, CTA, social proof)
├── /login → Email + OAuth (Google, GitHub)
├── /signup → Registration with plan selection
└── /pricing → Feature comparison

AUTHENTICATED SCREENS (persistent AI panel on right side)
├── /dashboard → Overview: profile completeness, recent jobs,
│                  upcoming interviews, quick actions
├── /profile
│   ├── /profile/overview → Profile card, headline, summary
│   ├── /profile/experience → Work history timeline editor
│   ├── /profile/skills → Skills grid with levels
│   ├── /profile/education → Education + certifications
│   └── /profile/intake → Guided wizard (first-time setup)
├── /market
│   ├── /market/search → Job search with filters
│   ├── /market/jobs/[id] → Job detail + match score
│   └── /market/salary → Salary benchmarks
├── /documents
│   ├── /documents/cv → CV editor (split-pane with AI)
│   ├── /documents/cover-letter → Cover letter builder
│   └── /documents/templates → Template gallery
├── /training
│   ├── /training/interview → Mock interview session
│   ├── /training/checklist → Application checklist
│   ├── /training/history → Past sessions + scores
│   └── /training/skills → Skill drill exercises
└── /settings → Account, preferences, integrations

PERSISTENT OVERLAY
└── AI Panel (right side drawer, always accessible)
    ├── Context-aware suggestions
    ├── Free-form chat
    ├── Streaming responses
    └── Action buttons (tailor CV, start interview, etc.)
```

### Navigation Flow

```
                    ┌──────────┐
                    │ Landing  │
                    └────┬─────┘
                         │ login/signup
                         ▼
                    ┌──────────┐
                    │Dashboard │◄──────────────────────────┐
                    └────┬─────┘                           │
                         │                                 │
          ┌──────────────┼──────────────┐                  │
          ▼              ▼              ▼                  │
    ┌──────────┐  ┌──────────┐  ┌──────────┐              │
    │ Profile  │  │  Market  │  │Documents │              │
    └────┬─────┘  └────┬─────┘  └────┬─────┘              │
         │              │              │                   │
         │         ┌────┴────┐    ┌────┴────┐              │
         │         ▼         ▼    ▼         ▼              │
         │   ┌────────┐ ┌────────┐ ┌────────┐              │
         │   │Job List│ │Job Det │ │CV Edit │              │
         │   └────────┘ └───┬────┘ └───┬────┘              │
         │                  │          │                    │
         │                  ▼          ▼                    │
         │            ┌──────────────────────┐              │
         │            │   AI Panel (always   │──────────────┘
         │            │   accessible)        │
         │            └──────────────────────┘
         │
    ┌────┴─────┐
    │ Training │
    └──────────┘
```

## Component Architecture (Feature-Based)

```
src/
├── app/                          ← Next.js App Router
│   ├── (public)/                 ← Public route group (no auth)
│   │   ├── page.tsx              ← Landing page
│   │   ├── layout.tsx            ← Public layout (nav, footer)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   ├── (app)/                    ← Authenticated route group
│   │   ├── layout.tsx            ← App shell + AI panel + sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── profile/
│   │   │   ├── page.tsx          ← Profile overview
│   │   │   ├── experience/page.tsx
│   │   │   ├── skills/page.tsx
│   │   │   ├── education/page.tsx
│   │   │   └── intake/page.tsx   ← Guided wizard
│   │   ├── market/
│   │   │   ├── page.tsx          ← Job search
│   │   │   └── [id]/page.tsx     ← Job detail
│   │   ├── documents/
│   │   │   ├── cv/page.tsx       ← Split-pane CV editor
│   │   │   ├── cover-letter/page.tsx
│   │   │   └── templates/page.tsx
│   │   ├── training/
│   │   │   ├── interview/page.tsx
│   │   │   ├── checklist/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── skills/page.tsx
│   │   └── settings/page.tsx
│   │
│   └── api/                      ← API routes (BFF pattern)
│       ├── profile/route.ts
│       ├── jobs/route.ts
│       ├── documents/route.ts
│       ├── training/route.ts
│       └── ai/
│           ├── chat/route.ts     ← SSE streaming endpoint
│           └── tailor-cv/route.ts
│
├── features/                     ← Feature modules (core organization)
│   │
│   ├── profile/
│   │   ├── components/
│   │   │   ├── ProfileCard.tsx         ← Summary card with avatar, headline
│   │   │   ├── SkillsGrid.tsx          ← Skill tags with level indicators
│   │   │   ├── ExperienceTimeline.tsx  ← Vertical timeline of work history
│   │   │   ├── IntakeWizard.tsx        ← Multi-step guided profile setup
│   │   │   ├── ProfileCompleteness.tsx ← Progress bar showing profile fill %
│   │   │   └── EducationList.tsx
│   │   ├── hooks/
│   │   │   ├── useProfile.ts           ← TanStack Query hook
│   │   │   ├── useIntakeFlow.ts        ← Wizard state machine
│   │   │   └── useSkills.ts
│   │   └── types.ts
│   │
│   ├── documents/
│   │   ├── components/
│   │   │   ├── CVEditor.tsx            ← Split-pane: analysis | editor
│   │   │   ├── CoverLetterBuilder.tsx
│   │   │   ├── TemplateGallery.tsx     ← Visual template picker
│   │   │   ├── DocumentPreview.tsx     ← PDF-like preview
│   │   │   ├── StreamingDocument.tsx   ← Token-by-token document render
│   │   │   ├── ExportButton.tsx        ← PDF/DOCX export
│   │   │   └── SectionEditor.tsx       ← Edit individual CV sections
│   │   ├── hooks/
│   │   │   ├── useDocument.ts
│   │   │   ├── useTailorCV.ts          ← CV tailoring pipeline hook
│   │   │   └── useExport.ts
│   │   └── types.ts
│   │
│   ├── market/
│   │   ├── components/
│   │   │   ├── JobCard.tsx             ← Compact job listing card
│   │   │   ├── JobDetail.tsx           ← Full job view with analysis
│   │   │   ├── MatchScore.tsx          ← Circular score + gap bars
│   │   │   ├── SkillGapAnalysis.tsx    ← Required vs possessed skills
│   │   │   ├── SalaryBenchmark.tsx     ← Salary range visualization
│   │   │   ├── JobSearchFilters.tsx    ← Filter sidebar
│   │   │   └── CompanyInfo.tsx         ← Company intel panel
│   │   ├── hooks/
│   │   │   ├── useJobs.ts
│   │   │   ├── useMatchScore.ts
│   │   │   └── useSalaryData.ts
│   │   └── types.ts
│   │
│   ├── training/
│   │   ├── components/
│   │   │   ├── MockInterview.tsx       ← Interview session container
│   │   │   ├── QuestionCard.tsx        ← Question display + timer
│   │   │   ├── AnswerRecorder.tsx      ← Text + voice input
│   │   │   ├── ScoreBreakdown.tsx      ← Relevance/Specificity/Communication
│   │   │   ├── ChecklistView.tsx       ← Interactive checklist
│   │   │   ├── SessionHistory.tsx      ← Past sessions list
│   │   │   └── ImprovementTips.tsx     ← AI-generated tips
│   │   ├── hooks/
│   │   │   ├── useInterviewSession.ts
│   │   │   ├── useChecklist.ts
│   │   │   └── useScoring.ts
│   │   └── types.ts
│   │
│   └── ai-panel/
│       ├── components/
│       │   ├── AIPanel.tsx             ← Persistent drawer container
│       │   ├── ChatMessage.tsx         ← Single message bubble
│       │   ├── StreamingMessage.tsx    ← Token-by-token message render
│       │   ├── SuggestedActions.tsx    ← Context-aware action buttons
│       │   ├── ContextIndicator.tsx    ← "Analyzing: Senior PM at Figma"
│       │   ├── PanelToggle.tsx         ← Open/close button
│       │   └── ChatInput.tsx           ← Input with send/stop
│       ├── hooks/
│       │   ├── useChat.ts              ← Chat state + send logic
│       │   ├── useStreamingMessage.ts  ← SSE connection + token accumulation
│       │   └── useAIContext.ts         ← Current context for AI
│       └── types.ts
│
├── components/                   ← Shared UI primitives
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── ProgressBar.tsx
│       ├── CircularProgress.tsx
│       ├── Avatar.tsx
│       ├── Modal.tsx
│       ├── Drawer.tsx
│       ├── Skeleton.tsx
│       ├── Toast.tsx
│       ├── Tooltip.tsx
│       └── Separator.tsx
│
├── lib/                          ← Utilities & infrastructure
│   ├── api/
│   │   ├── client.ts             ← Fetch wrapper with auth headers
│   │   └── sse.ts                ← SSE connection manager
│   ├── auth/
│   │   ├── useAuth.ts            ← Auth hook (Supabase)
│   │   └── supabase.ts           ← Supabase client
│   ├── store/
│   │   ├── useAppStore.ts        ← Zustand: UI state (theme, sidebar, etc.)
│   │   └── useAIStore.ts         ← Zustand: AI panel state (messages, streaming)
│   └── utils/
│       ├── format.ts             ← Date, number, currency formatters
│       ├── constants.ts          ← App-wide constants
│       └── validators.ts         ← Zod schemas
│
└── styles/
    └── globals.css               ← Tailwind imports + custom styles
```

## Key UI Patterns

### 1. Persistent AI Panel (Core UX Pattern)

The AI panel is ambient, not modal. It lives in a persistent right-side drawer (collapsible on mobile) and is always context-aware — when you're on the job detail screen, it already knows which job you're looking at.

```typescript
// features/ai-panel/components/AIPanel.tsx
'use client';

export function AIPanel() {
  const { isOpen, context, messages, isStreaming } = useAIStore();
  const { sendMessage, stopStreaming } = useChat();

  return (
    <Drawer open={isOpen} side="right" className="w-96 border-l">
      <DrawerHeader>
        <ContextIndicator />
        {/* Shows: "Viewing: Senior Product Designer at Figma" */}
      </DrawerHeader>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg =>
          msg.isStreaming ? (
            <StreamingMessage key={msg.id} content={msg.content} />
          ) : (
            <ChatMessage key={msg.id} message={msg} />
          )
        )}
      </div>

      <SuggestedActions />
      {/* Context-aware: "Tailor CV" / "Mock Interview" / "Analyze Gaps" */}

      <div className="border-t p-4">
        {isStreaming ? (
          <Button onClick={stopStreaming} variant="outline" className="w-full">
            Stop Generating
          </Button>
        ) : (
          <ChatInput onSend={sendMessage} placeholder="Ask about this role..." />
        )}
      </div>
    </Drawer>
  );
}
```

### 2. Match Score Visualization

The skill gap bars on the job detail screen are the core value proposition made visual.

```typescript
// features/market/components/MatchScore.tsx
export function MatchScore({ score, gaps, strengths }: MatchScoreProps) {
  return (
    <div className="space-y-6">
      {/* Overall circular score */}
      <div className="flex justify-center">
        <CircularProgress value={score} size={120} strokeWidth={8}>
          <span className="text-3xl font-bold">{score}%</span>
          <span className="text-sm text-muted-foreground">Match</span>
        </CircularProgress>
      </div>

      {/* Strong matches */}
      <div>
        <h4 className="text-sm font-medium text-green-600 mb-2">
          ✓ Strong Matches
        </h4>
        <div className="flex flex-wrap gap-2">
          {strengths.map(s => (
            <Badge key={s.skill} variant="success" className="text-sm">
              {s.skill} — {s.level}
            </Badge>
          ))}
        </div>
      </div>

      {/* Gaps with AI actions */}
      <div>
        <h4 className="text-sm font-medium text-amber-600 mb-2">
          △ Skill Gaps
        </h4>
        <div className="space-y-2">
          {gaps.map(gap => (
            <div key={gap.skill} className="flex items-center gap-3">
              <ProgressBar
                value={gap.proficiency}
                className="flex-1 h-2"
                variant="warning"
              />
              <span className="text-sm w-24">{gap.skill}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  sendMessage(`How do I address my gap in ${gap.skill}?`)
                }
              >
                Ask AI
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 3. Split-Pane CV Editor with AI Streaming

```typescript
// features/documents/components/CVEditor.tsx
export function CVEditor({ documentId, jobId }: Props) {
  const { document, updateDocument } = useDocument(documentId);
  const { tailoredContent, isStreaming, progress } = useTailorCV(jobId);

  return (
    <div className="grid grid-cols-2 gap-0 h-[calc(100vh-4rem)]">
      {/* Left: Analysis panel */}
      <div className="border-r overflow-y-auto p-6 space-y-6">
        <MatchScore score={document.matchScore} {...document.analysis} />
        <SkillGapAnalysis jobId={jobId} />
        <AIAgentReasoning steps={tailoredContent?.steps} />
        {/* Shows: "Strategy A: Reframed motion design as interaction specs" */}
      </div>

      {/* Right: CV Editor */}
      <div className="flex flex-col">
        <div className="flex-1 overflow-y-auto p-8">
          {isStreaming ? (
            <StreamingDocument
              content={tailoredContent?.markdown}
              progress={progress}
            />
          ) : (
            <RichTextEditor
              content={document.content_md}
              onChange={updateDocument}
            />
          )}
        </div>
        <div className="border-t p-4 flex gap-2">
          <ExportButton format="pdf" />
          <ExportButton format="docx" />
          <Button variant="outline" onClick={() => regenerateSection()}>
            Regenerate Section
          </Button>
          <Button variant="outline" onClick={() => undoLastChange()}>
            Undo
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 4. Profile Intake Wizard

```typescript
// features/profile/components/IntakeWizard.tsx
const WIZARD_STEPS = [
  { id: 'basics', title: 'Basic Info', fields: ['name', 'email', 'location'] },
  { id: 'headline', title: 'Headline', aiAssisted: true },
  { id: 'summary', title: 'Professional Summary', aiAssisted: true },
  { id: 'experience', title: 'Work Experience' },
  { id: 'skills', title: 'Skills', aiAssisted: true },
  { id: 'education', title: 'Education' },
  { id: 'goals', title: 'Job Goals', aiAssisted: true },
  { id: 'review', title: 'Review & Confirm' },
];

export function IntakeWizard() {
  const [step, setStep] = useState(0);
  const { data: profile } = useProfile();

  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {WIZARD_STEPS.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'h-2 flex-1 rounded-full',
              i <= step ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Current step */}
      <Card>
        <CardHeader>
          <CardTitle>{WIZARD_STEPS[step].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {WIZARD_STEPS[step].aiAssisted && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              💡 AI is here to help — ask for suggestions or let it draft for you
            </div>
          )}
          <StepForm step={WIZARD_STEPS[step]} profile={profile} />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button onClick={() => setStep(s => s + 1)}>
            {step === WIZARD_STEPS.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### 5. Mock Interview Session

```typescript
// features/training/components/MockInterview.tsx
export function MockInterview({ sessionId }: Props) {
  const { session, currentQuestion, submitAnswer } = useInterviewSession(sessionId);
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {session.currentQuestion + 1} of {session.totalQuestions}</span>
        <span>Session score: {session.score}%</span>
      </div>

      {/* Question */}
      <QuestionCard
        question={currentQuestion}
        type={currentQuestion.type}
        timeLimit={currentQuestion.timeLimit}
      />

      {/* Answer input */}
      <Card>
        <CardContent className="pt-6">
          <Textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="min-h-[200px] resize-none"
          />
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setIsRecording(!isRecording)}
            >
              {isRecording ? '⏹ Stop Recording' : '🎤 Record Voice'}
            </Button>
            <Button onClick={() => submitAnswer(answer)} disabled={!answer}>
              Submit Answer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback (shown after submission) */}
      {session.lastFeedback && (
        <ScoreBreakdown feedback={session.lastFeedback} />
      )}
    </div>
  );
}
```

## State Management

### Zustand Stores

```typescript
// lib/store/useAppStore.ts — UI state
interface AppState {
  aiPanelOpen: boolean;
  aiPanelContext: { type: string; id: string } | null;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';

  toggleAIPanel: () => void;
  setAIContext: (ctx: { type: string; id: string } | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: AppState['theme']) => void;
}

// lib/store/useAIStore.ts — AI panel state (separate for perf)
interface AIState {
  messages: Message[];
  isStreaming: boolean;
  currentAgent: AgentType | null;
  suggestedActions: SuggestedAction[];

  addMessage: (msg: Message) => void;
  appendToken: (token: string) => void;
  setStreaming: (v: boolean) => void;
  clearMessages: () => void;
  setSuggestedActions: (actions: SuggestedAction[]) => void;
}
```

### TanStack Query (Server State)

```typescript
// lib/api/client.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min before refetch
      gcTime: 30 * 60 * 1000,     // 30 min garbage collection
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Example query hook
// features/profile/hooks/useProfile.ts
function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/profile'),
  });
}

// Example mutation with optimistic update
function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Profile>) =>
      api.patch('/api/profile', data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      const previous = queryClient.getQueryData(['profile']);
      queryClient.setQueryData(['profile'], (old: Profile) => ({ ...old, ...data }));
      return { previous };
    },
    onError: (err, data, context) => {
      queryClient.setQueryData(['profile'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
```

## Streaming Architecture

### SSE Connection Manager

```typescript
// lib/api/sse.ts
class SSEConnection {
  private abortController: AbortController;

  async connect(
    endpoint: string,
    body: any,
    handlers: {
      onToken: (token: string) => void;
      onToolCall?: (tool: ToolCall) => void;
      onDone?: () => void;
      onError?: (err: Error) => void;
    }
  ) {
    this.abortController = new AbortController();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      handlers.onError?.(new Error(`HTTP ${response.status}`));
      return;
    }

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
        if (data === '[DONE]') {
          handlers.onDone?.();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          switch (parsed.type) {
            case 'token':
              handlers.onToken(parsed.content);
              break;
            case 'tool_call':
              handlers.onToolCall?.(parsed);
              break;
            case 'error':
              handlers.onError?.(new Error(parsed.message));
              break;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    handlers.onDone?.();
  }

  disconnect() {
    this.abortController.abort();
  }
}
```

### Streaming Message Hook

```typescript
// features/ai-panel/hooks/useStreamingMessage.ts
function useStreamingMessage() {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const connectionRef = useRef<SSEConnection>();

  const stream = useCallback(async (endpoint: string, body: any) => {
    setIsStreaming(true);
    setContent('');

    connectionRef.current = new SSEConnection();
    await connectionRef.current.connect(endpoint, body, {
      onToken: (token) => setContent(prev => prev + token),
      onDone: () => setIsStreaming(false),
      onError: (err) => {
        console.error('Stream error:', err);
        setIsStreaming(false);
      },
    });
  }, []);

  const stop = useCallback(() => {
    connectionRef.current?.disconnect();
    setIsStreaming(false);
  }, []);

  return { content, isStreaming, stream, stop };
}
```

## Mobile Strategy

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

## Design System Tokens

```css
/* Tailwind config extensions */
{
  "colors": {
    "brand": {
      "50": "#eff6ff",
      "500": "#3b82f6",
      "600": "#2563eb",
      "700": "#1d4ed8"
    },
    "match": {
      "strong": "#22c55e",
      "partial": "#f59e0b",
      "gap": "#ef4444"
    }
  },
  "borderRadius": {
    "card": "12px",
    "button": "8px"
  }
}