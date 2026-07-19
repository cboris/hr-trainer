/**
 * Tests for src/lib/ai.ts
 *
 * Verifies the OpenAI client is configured correctly for DashScope.
 */

// Mock the openai module
const mockOpenAI = jest.fn().mockImplementation(() => ({
  chat: { completions: { create: jest.fn() } },
  embeddings: { create: jest.fn() },
}));

jest.mock('openai', () => ({
  __esModule: true,
  default: mockOpenAI,
}));

describe('ai client', () => {
  beforeEach(() => {
    jest.resetModules();
    mockOpenAI.mockClear();
    delete (globalThis as any).ai;
  });

  it('creates an OpenAI client instance', () => {
    const { ai } = require('@/lib/ai');
    expect(ai).toBeDefined();
    expect(mockOpenAI).toHaveBeenCalledTimes(1);
  });

  it('passes DashScope API key and base URL', () => {
    require('@/lib/ai');
    expect(mockOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: expect.any(String),
        baseURL: expect.any(String),
      })
    );
  });

  it('exports AI_CONFIG with model settings', () => {
    const { AI_CONFIG } = require('@/lib/ai');
    expect(AI_CONFIG).toBeDefined();
    expect(AI_CONFIG.model).toBeDefined();
    expect(typeof AI_CONFIG.model).toBe('string');
    expect(AI_CONFIG.embeddingModel).toBeDefined();
    expect(typeof AI_CONFIG.embeddingModel).toBe('string');
    expect(AI_CONFIG.maxTokens).toBe(4096);
    expect(AI_CONFIG.temperature).toBe(0.7);
  });

  it('returns same instance on subsequent imports (singleton)', () => {
    const { ai: a1 } = require('@/lib/ai');
    const { ai: a2 } = require('@/lib/ai');
    expect(a1).toBe(a2);
    expect(mockOpenAI).toHaveBeenCalledTimes(1);
  });

  it('does NOT store on globalThis in production', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    delete (globalThis as any).ai;

    jest.resetModules();
    const { ai } = require('@/lib/ai');
    expect((globalThis as any).ai).toBeUndefined();
    expect(ai).toBeDefined();

    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, configurable: true });
  });
});