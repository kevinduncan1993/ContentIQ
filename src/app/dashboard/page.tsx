/**
 * Dashboard - Main generation interface
 */

import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { GeneratorInterface } from '@/components/GeneratorInterface';
import { UsageStats } from '@/components/UsageStats';
import { Header } from '@/components/Header';

export default async function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Usage Stats */}
        <div className="mb-8">
          <UsageStats />
        </div>

        {/* Main Generator Interface */}
        <GeneratorInterface />
      </main>
    </div>
  );
}
