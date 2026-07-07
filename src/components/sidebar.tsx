'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/profile', label: 'Profile', icon: '👤' },
  { href: '/jobs', label: 'Jobs', icon: '💼' },
  { href: '/documents', label: 'Documents', icon: '📄' },
  { href: '/training', label: 'Training', icon: '🎯' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 bg-white border-r border-surface-200 flex flex-col">
      <div className="p-6 border-b border-surface-200">
        <h1 className="text-xl font-bold text-primary-600">Job Trainer AI</h1>
        {session?.user?.name && (
          <p className="text-sm text-surface-500 mt-1">{session.user.name}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-200">
        <button className="sidebar-item w-full">
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}