/**
 * Tests for src/components/ai-panel.tsx
 *
 * Verifies chat UI: message rendering, input handling, send behavior, loading state.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiPanel } from '@/components/ai-panel';

// Mock crypto.randomUUID
let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${++uuidCounter}`,
  },
  writable: true,
});

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AiPanel', () => {
  beforeEach(() => {
    uuidCounter = 0;
    mockFetch.mockClear();
  });

  it('renders the header', () => {
    render(<AiPanel />);
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Ask about your profile, jobs, or training')).toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    render(<AiPanel />);
    expect(screen.getByText('💬')).toBeInTheDocument();
    expect(screen.getByText('Start a conversation with your AI assistant')).toBeInTheDocument();
  });

  it('renders the input textarea and send button', () => {
    render(<AiPanel />);
    expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(<AiPanel />);
    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has text', () => {
    render(<AiPanel />);
    const textarea = screen.getByPlaceholderText('Ask me anything...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    const sendButton = screen.getByText('Send');
    expect(sendButton).not.toBeDisabled();
  });

  it('adds user message to the chat on send', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { content: 'Hi there!' } }),
    });

    render(<AiPanel />);
    const textarea = screen.getByPlaceholderText('Ask me anything...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));

    // User message should appear
    expect(screen.getByText('Hello')).toBeInTheDocument();

    // Wait for assistant response
    await waitFor(() => {
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });

  it('clears input after sending', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { content: 'Response' } }),
    });

    render(<AiPanel />);
    const textarea = screen.getByPlaceholderText('Ask me anything...') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));

    expect(textarea.value).toBe('');
  });

  it('shows error message when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<AiPanel />);
    const textarea = screen.getByPlaceholderText('Ask me anything...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows fallback when response has no content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });

    render(<AiPanel />);
    const textarea = screen.getByPlaceholderText('Ask me anything...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(screen.getByText('Sorry, I could not process that.')).toBeInTheDocument();
    });
  });

  it('does not send when input is only whitespace', () => {
    render(<AiPanel />);
    const textarea = screen.getByPlaceholderText('Ask me anything...');
    fireEvent.change(textarea, { target: { value: '   ' } });

    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeDisabled();
  });

  it('sends on Enter key (without Shift)', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { content: 'Response' } }),
    });

    render(<AiPanel />);
    const textarea = screen.getByPlaceholderText('Ask me anything...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    // Message should be sent (textarea cleared)
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it('does NOT send on Shift+Enter (allows new line)', () => {
    render(<AiPanel />);
    const textarea = screen.getByPlaceholderText('Ask me anything...') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    // Message should NOT be sent (textarea not cleared)
    expect(textarea.value).toBe('Hello');
  });

  it('disables input and button while loading', async () => {
    // Make fetch hang (never resolve)
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    render(<AiPanel />);
    const textarea = screen.getByPlaceholderText('Ask me anything...') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(textarea).toBeDisabled();
      expect(screen.getByText('Send')).toBeDisabled();
    });
  });

  it('shows "Thinking..." indicator while loading', async () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    render(<AiPanel />);
    const textarea = screen.getByPlaceholderText('Ask me anything...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });
  });

  it('calls the correct API endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { content: 'Response' } }),
    });

    render(<AiPanel />);
    const textarea = screen.getByPlaceholderText('Ask me anything...');
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByText('Send'));

    expect(mockFetch).toHaveBeenCalledWith('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test message' }),
    });
  });
});