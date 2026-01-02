import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { HistoryList } from '@/components/HistoryList';

export default function HistoryPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      {/* Gradient Orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <Header />

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Generation History</h1>
          <p className="mt-2 text-gray-400">View and reuse your past content generations</p>
        </div>

        <HistoryList />
      </main>
    </div>
  );
}
