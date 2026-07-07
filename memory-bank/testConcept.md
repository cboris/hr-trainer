# Test Concept — Job Trainer AI

## Testing Philosophy

Following **test-first development**: tests are written BEFORE implementation logic. No code is considered complete until tests pass with ≥90% coverage.

## Testing Stack

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner + assertion library |
| **ts-jest** | TypeScript support for Jest |
| **@testing-library/react** | React component testing |
| **@testing-library/jest-dom** | DOM matchers (toBeInTheDocument, etc.) |
| **jest-environment-jsdom** | Browser-like environment for component tests |
| **MSW (Mock Service Worker)** | Mock API calls in tests |

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts              # Global test setup
│   ├── config/
│   │   └── env.test.ts       # Environment validation tests
│   ├── lib/
│   │   ├── prisma.test.ts    # Prisma singleton tests
│   │   ├── ai.test.ts        # AI client tests
│   │   ├── s3.test.ts        # S3 storage tests
│   │   └── redis.test.ts     # Redis client tests
│   ├── components/
│   │   ├── providers.test.tsx # Provider wrapper tests
│   │   ├── sidebar.test.tsx  # Sidebar navigation tests
│   │   └── ai-panel.test.tsx # AI chat panel tests
│   └── app/
│       └── api/
│           ├── auth/
│           │   └── route.test.ts  # Auth API tests
│           └── ai/
│               └── chat.test.ts   # AI chat SSE tests
```

## Test Categories

### 1. Unit Tests (Core Libs)

Test pure logic and module behavior in isolation.

#### `src/config/env.test.ts`
```typescript
describe('env()', () => {
  it('validates required env vars', () => {
    // DATABASE_URL is required
    delete process.env.DATABASE_URL;
    expect(() => env()).toThrow();
  });

  it('applies defaults for optional vars', () => {
    process.env.DATABASE_URL = 'postgresql://...';
    const config = env();
    expect(config.REDIS_URL).toBe('redis://localhost:6379');
    expect(config.S3_BUCKET).toBe('job-trainer-dev');
  });

  it('throws on invalid URL format', () => {
    process.env.DATABASE_URL = 'not-a-url';
    expect(() => env()).toThrow();
  });
});
```

#### `src/lib/prisma.test.ts`
```typescript
describe('prisma', () => {
  it('returns singleton instance', () => {
    const { prisma: p1 } = require('@/lib/prisma');
    const { prisma: p2 } = require('@/lib/prisma');
    expect(p1).toBe(p2);
  });
});
```

#### `src/lib/ai.test.ts`
```typescript
describe('ai client', () => {
  it('creates OpenAI client with DashScope config', () => {
    const { ai, AI_CONFIG } = require('@/lib/ai');
    expect(ai).toBeDefined();
    expect(AI_CONFIG.model).toBe('qwen-plus');
    expect(AI_CONFIG.baseURL).toContain('dashscope');
  });
});
```

#### `src/lib/s3.test.ts`
```typescript
describe('s3 client', () => {
  it('creates S3Client with MinIO-compatible config', () => {
    const { s3 } = require('@/lib/s3');
    expect(s3).toBeDefined();
  });

  it('uploadToS3 calls PutObjectCommand', async () => {
    // Mock S3Client.send
    // Verify PutObjectCommand is called with correct params
  });
});
```

#### `src/lib/redis.test.ts`
```typescript
describe('redis client', () => {
  it('creates Redis instance with correct URL', () => {
    const { redis } = require('@/lib/redis');
    expect(redis).toBeDefined();
  });
});
```

### 2. Component Tests

Test React components in isolation using @testing-library/react.

#### `src/components/sidebar.test.tsx`
```typescript
describe('Sidebar', () => {
  it('renders all navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });

  it('highlights active route', () => {
    // Mock usePathname to return '/dashboard'
    // Verify Dashboard link has active class
  });

  it('displays user name from session', () => {
    // Mock useSession with user data
    // Verify name is displayed
  });
});
```

#### `src/components/ai-panel.test.tsx`
```typescript
describe('AIPanel', () => {
  it('renders toggle button', () => {
    render(<AIPanel />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens panel on button click', () => {
    render(<AIPanel />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('displays welcome message when empty', () => {
    // Open panel
    // Verify welcome message is shown
  });

  it('sends message and displays response', async () => {
    // Mock fetch to return SSE stream
    // Type message, press Enter
    // Verify user message appears
    // Verify assistant response streams in
  });

  it('handles API errors gracefully', async () => {
    // Mock fetch to reject
    // Send message
    // Verify error message is displayed
  });
});
```

#### `src/components/providers.test.tsx`
```typescript
describe('Providers', () => {
  it('wraps children with SessionProvider', () => {
    render(
      <Providers>
        <div>Test Child</div>
      </Providers>
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });
});
```

### 3. API Route Tests

Test API endpoints with mocked dependencies.

#### `src/app/api/ai/chat.test.ts`
```typescript
describe('POST /api/ai/chat', () => {
  it('returns SSE stream for valid request', async () => {
    // Mock AI client to return stream
    // Call route handler
    // Verify response is ReadableStream
    // Verify content-type is text/event-stream
  });

  it('returns 400 for missing messages', async () => {
    // Call with empty body
    // Verify 400 response
  });

  it('returns 401 for unauthenticated user', async () => {
    // Mock getServerSession to return null
    // Verify 401 response
  });
});
```

#### `src/app/api/auth/route.test.ts`
```typescript
describe('NextAuth routes', () => {
  it('handles Google OAuth callback', async () => {
    // Mock Google provider
    // Verify session is created
  });

  it('creates user in database on first login', async () => {
    // Mock Prisma create
    // Verify user record is created
  });
});
```

## Mocking Strategy

### External Services
- **AI (DashScope)**: Mock OpenAI client, return predefined responses
- **S3 (MinIO)**: Mock S3Client.send, verify commands
- **Redis**: Mock ioredis methods (get, set, etc.)
- **Database**: Use test database or mock Prisma client

### API Calls
- **MSW (Mock Service Worker)**: Intercept fetch calls in tests
- Define handlers in `src/__tests__/mocks/handlers.ts`

### Next.js
- **next/navigation**: Mock usePathname, useRouter
- **next-auth/react**: Mock useSession, getSession

## Jest Configuration

```typescript
// jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

export default createJestConfig(config);
```

## Test Execution

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npx jest src/lib/ai.test.ts
```

## Coverage Requirements

Per `.clinerules/testing.md`:
- **Minimum 90% coverage** for all new code
- Coverage includes: branches, functions, lines, statements
- Run `npm run test:coverage` to verify

## CI Integration (Future)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:coverage
      - name: Check coverage threshold
        run: |
          # Fail if coverage < 90%
```

## Test-First Workflow

For every new feature:

1. **Write failing tests** that define expected behavior
2. **Run tests** — verify they fail (red)
3. **Implement code** to make tests pass
4. **Run tests** — verify they pass (green)
5. **Refactor** if needed, keep tests green
6. **Check coverage** — ensure ≥90%

This ensures:
- No untested code enters the codebase
- Requirements are clear before implementation
- Regressions are caught immediately