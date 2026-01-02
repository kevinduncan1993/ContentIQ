import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default function BillingPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="mt-4 text-gray-600">Coming soon - Manage your subscription and billing here.</p>
      </div>
    </div>
  );
}
