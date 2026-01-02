'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-purple-500/20 bg-gray-900/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-purple-400" />
            <span className="text-xl font-bold text-white">ContentIQ</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Generate
            </Link>
            <Link
              href="/history"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              History
            </Link>
            <Link
              href="/billing"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
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
