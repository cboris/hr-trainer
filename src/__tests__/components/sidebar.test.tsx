/**
 * Tests for src/components/sidebar.tsx
 *
 * Verifies navigation items render, active state highlighting, and user display.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/sidebar';

// Mock next/navigation
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next-auth/react
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
  });

  it('renders the app title', () => {
    render(<Sidebar />);
    expect(screen.getByText('Job Trainer AI')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Training')).toBeInTheDocument();
  });

  it('renders navigation icons', () => {
    render(<Sidebar />);

    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
    expect(screen.getByText('💼')).toBeInTheDocument();
    expect(screen.getByText('📄')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('highlights the active navigation item', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Sidebar />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('sidebar-item-active');

    const profileLink = screen.getByText('Profile').closest('a');
    expect(profileLink).not.toHaveClass('sidebar-item-active');
  });

  it('updates active item when pathname changes', () => {
    mockUsePathname.mockReturnValue('/jobs');
    render(<Sidebar />);

    const jobsLink = screen.getByText('Jobs').closest('a');
    expect(jobsLink).toHaveClass('sidebar-item-active');

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).not.toHaveClass('sidebar-item-active');
  });

  it('displays user name when session exists', () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'John Doe' } },
      status: 'authenticated',
    });
    render(<Sidebar />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('does not display user name when no session', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<Sidebar />);

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('renders settings button', () => {
    render(<Sidebar />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('navigation links have correct hrefs', () => {
    render(<Sidebar />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    const profileLink = screen.getByText('Profile').closest('a');
    expect(profileLink).toHaveAttribute('href', '/profile');

    const jobsLink = screen.getByText('Jobs').closest('a');
    expect(jobsLink).toHaveAttribute('href', '/jobs');
  });
});