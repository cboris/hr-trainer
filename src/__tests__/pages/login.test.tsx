import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '@/app/login/page';

const mockSignIn = jest.fn();
jest.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('LoginPage', () => {
  beforeEach(() => mockSignIn.mockClear());

  it('renders sign-in buttons', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('calls signIn with azure-ad when Microsoft button is clicked', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in with microsoft/i }));
    expect(mockSignIn).toHaveBeenCalledWith('azure-ad', { callbackUrl: '/dashboard' });
  });

  it('calls signIn with google when Google button is clicked', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' });
  });

  it('has a link to the signup page', () => {
    render(<LoginPage />);
    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('has a link back to the home page', () => {
    render(<LoginPage />);
    const homeLink = screen.getByRole('link', { name: /jobtrainer/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });
});