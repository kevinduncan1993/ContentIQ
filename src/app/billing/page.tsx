import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getUserTierStatus } from '@/lib/tier';
import { Check, Sparkles, Zap, Clock } from 'lucide-react';

export default async function BillingPage() {
  const { userId: clerkUserId } = auth();

  if (!clerkUserId) {
    redirect('/sign-in');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!user) {
    redirect('/sign-in');
  }

  const tierStatus = await getUserTierStatus(user.id);

  const proFeatures = [
    'All 6 platforms (TikTok, Twitter, LinkedIn, Instagram, Threads, Email)',
    '500 generations per month',
    'All tone variations (Educational, Conversational, Opinionated, Authority)',
    'Priority support',
    'Advanced analytics',
  ];

  const freeFeatures = [
    '2 platforms only (Threads & LinkedIn)',
    '10 generations per month',
    '3-day trial with full access',
    'All tone variations',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      {/* Gradient Orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="relative border-b border-purple-500/20 bg-gray-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
              <p className="mt-2 text-sm text-gray-400">
                Manage your subscription and unlock all platforms
              </p>
            </div>
            <a
              href="/dashboard"
              className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Current Plan */}
        <div className="mb-8 rounded-xl border-2 border-purple-500/30 bg-purple-500/10 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-purple-300">Current Plan</h2>
              <p className="mt-1 text-3xl font-bold capitalize text-white">{tierStatus.tier}</p>
              {tierStatus.trialActive && (
                <p className="mt-2 flex items-center text-sm text-purple-200">
                  <Clock className="mr-1.5 h-4 w-4" />
                  Trial expires in {tierStatus.trialDaysRemaining} days ({tierStatus.trialHoursRemaining} hours)
                </p>
              )}
              {tierStatus.trialExpired && (
                <p className="mt-2 text-sm text-purple-200">
                  Trial has expired. Limited to Threads & LinkedIn.
                </p>
              )}
            </div>
            {tierStatus.tier === 'free' && (
              <Sparkles className="h-12 w-12 text-purple-400" />
            )}
            {tierStatus.tier === 'pro' && (
              <Zap className="h-12 w-12 text-purple-400" />
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Free Plan */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white">Free</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="ml-2 text-gray-400">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Perfect for trying out ContentIQ
              </p>
            </div>

            <ul className="space-y-3">
              {freeFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-400" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            {tierStatus.tier === 'free' && (
              <div className="mt-8">
                <div className="rounded-lg bg-white/10 px-4 py-3 text-center text-sm font-medium text-gray-300">
                  Current Plan
                </div>
              </div>
            )}
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-xl border-2 border-purple-500 bg-purple-500/10 p-8 backdrop-blur-sm shadow-lg shadow-purple-500/20">
            {/* Recommended Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1 text-sm font-semibold text-white">
                Recommended
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white">Pro</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-bold text-white">$20</span>
                <span className="ml-2 text-gray-400">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Unlock all platforms and features
              </p>
            </div>

            <ul className="space-y-3">
              {proFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-purple-400" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {tierStatus.tier === 'pro' ? (
                <div className="rounded-lg bg-purple-600/30 px-4 py-3 text-center text-sm font-medium text-purple-200">
                  Current Plan
                </div>
              ) : (
                <a
                  href="https://buy.stripe.com/28EeVcdfTaUmaai61oco005"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-center text-base font-semibold text-white shadow-lg hover:shadow-purple-500/50 transition-all"
                >
                  Upgrade to Pro
                </a>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="font-semibold text-white">What happens after my trial expires?</h3>
              <p className="mt-2 text-sm text-gray-400">
                After your 3-day trial expires, you'll be limited to Threads and LinkedIn platforms with 10 generations per month. Upgrade to Pro to unlock all 6 platforms and 500 generations per month.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Can I cancel anytime?</h3>
              <p className="mt-2 text-sm text-gray-400">
                Yes! You can cancel your Pro subscription at any time through the Stripe customer portal. You'll retain access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">What platforms are included in Pro?</h3>
              <p className="mt-2 text-sm text-gray-400">
                Pro includes all 6 platforms: TikTok/Reels, Twitter/X, LinkedIn, Instagram, Threads, and Email. Free tier only includes Threads and LinkedIn after trial.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">How does billing work?</h3>
              <p className="mt-2 text-sm text-gray-400">
                Pro is billed monthly at $20/month. Your card will be charged automatically each month. All payments are processed securely through Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
