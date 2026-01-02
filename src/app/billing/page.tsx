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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your subscription and unlock all platforms
              </p>
            </div>
            <a
              href="/dashboard"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Current Plan */}
        <div className="mb-8 rounded-lg border-2 border-primary-200 bg-primary-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-900">Current Plan</h2>
              <p className="mt-1 text-3xl font-bold capitalize text-primary-700">{tierStatus.tier}</p>
              {tierStatus.trialActive && (
                <p className="mt-2 flex items-center text-sm text-primary-600">
                  <Clock className="mr-1.5 h-4 w-4" />
                  Trial expires in {tierStatus.trialDaysRemaining} days ({tierStatus.trialHoursRemaining} hours)
                </p>
              )}
              {tierStatus.trialExpired && (
                <p className="mt-2 text-sm text-primary-600">
                  Trial has expired. Limited to Threads & LinkedIn.
                </p>
              )}
            </div>
            {tierStatus.tier === 'free' && (
              <Sparkles className="h-12 w-12 text-primary-600" />
            )}
            {tierStatus.tier === 'pro' && (
              <Zap className="h-12 w-12 text-primary-600" />
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Free Plan */}
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Free</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="ml-2 text-gray-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Perfect for trying out ContentIQ
              </p>
            </div>

            <ul className="space-y-3">
              {freeFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {tierStatus.tier === 'free' && (
              <div className="mt-8">
                <div className="rounded-lg bg-gray-100 px-4 py-3 text-center text-sm font-medium text-gray-700">
                  Current Plan
                </div>
              </div>
            )}
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-lg border-2 border-primary-600 bg-white p-8 shadow-lg">
            {/* Recommended Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-primary-600 px-4 py-1 text-sm font-semibold text-white">
                Recommended
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Pro</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">$20</span>
                <span className="ml-2 text-gray-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Unlock all platforms and features
              </p>
            </div>

            <ul className="space-y-3">
              {proFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-primary-600" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {tierStatus.tier === 'pro' ? (
                <div className="rounded-lg bg-primary-100 px-4 py-3 text-center text-sm font-medium text-primary-700">
                  Current Plan
                </div>
              ) : (
                <a
                  href="https://buy.stripe.com/28EeVcdfTaUmaai61oco005"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-primary-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Upgrade to Pro
                </a>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900">What happens after my trial expires?</h3>
              <p className="mt-2 text-sm text-gray-600">
                After your 3-day trial expires, you'll be limited to Threads and LinkedIn platforms with 10 generations per month. Upgrade to Pro to unlock all 6 platforms and 500 generations per month.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Can I cancel anytime?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Yes! You can cancel your Pro subscription at any time through the Stripe customer portal. You'll retain access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">What platforms are included in Pro?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Pro includes all 6 platforms: TikTok/Reels, Twitter/X, LinkedIn, Instagram, Threads, and Email. Free tier only includes Threads and LinkedIn after trial.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">How does billing work?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Pro is billed monthly at $20/month. Your card will be charged automatically each month. All payments are processed securely through Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
