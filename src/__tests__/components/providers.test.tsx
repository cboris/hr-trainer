/**
 * Tests for src/components/providers.tsx
 *
 * Verifies that Providers wraps children with SessionProvider and QueryClientProvider.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Providers } from '@/components/providers';

// Mock next-auth/react
const mockSessionProvider = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid="session-provider">{children}</div>
));
jest.mock('next-auth/react', () => ({
  SessionProvider: (props: any) => mockSessionProvider(props),
}));

// Mock @tanstack/react-query
const mockQueryClientProvider = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid="query-client-provider">{children}</div>
));
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({})),
  QueryClientProvider: (props: any) => mockQueryClientProvider(props),
}));

describe('Providers', () => {
  beforeEach(() => {
    mockSessionProvider.mockClear();
    mockQueryClientProvider.mockClear();
  });

  it('renders children', () => {
    render(
      <Providers>
        <div data-testid="child">Hello</div>
      </Providers>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('wraps children with SessionProvider', () => {
    render(
      <Providers>
        <span>Content</span>
      </Providers>
    );

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
  });

  it('wraps children with QueryClientProvider', () => {
    render(
      <Providers>
        <span>Content</span>
      </Providers>
    );

    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
  });

  it('nests QueryClientProvider inside SessionProvider', () => {
    render(
      <Providers>
        <span>Content</span>
      </Providers>
    );

    const sessionProvider = screen.getByTestId('session-provider');
    const queryClientProvider = screen.getByTestId('query-client-provider');

    // QueryClientProvider should be a descendant of SessionProvider
    expect(sessionProvider.contains(queryClientProvider)).toBe(true);
  });
});