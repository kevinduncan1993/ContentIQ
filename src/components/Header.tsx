'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ContentIQ</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Generate
            </Link>
            <Link
              href="/history"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              History
            </Link>
            <Link
              href="/billing"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Billing
            </Link>

            {/* User Menu */}
            <UserButton afterSignOutUrl="/" />
          </nav>
        </div>
      </div>
    </header>
  );
}
