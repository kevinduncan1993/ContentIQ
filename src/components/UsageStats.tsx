'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Zap, Clock } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface UsageData {
  used: number;
  limit: number;
  remaining: number;
  percentageUsed: number;
  tier: string;
  lastUsedAt: Date | null;
  resetsAt: Date;
}

interface TierStatus {
  tier: string;
  isFree: boolean;
  trialActive: boolean;
  trialExpired: boolean;
  trialDaysRemaining: number;
  trialHoursRemaining: number;
  trialEndDate: Date | null;
}

export function UsageStats() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [usageRes, tierRes] = await Promise.all([
        fetch('/api/usage'),
        fetch('/api/tier'),
      ]);

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      }

      if (tierRes.ok) {
        const tierData = await tierRes.json();
        setTierStatus(tierData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
              <div className="h-4 w-24 rounded bg-gray-200"></div>
              <div className="mt-2 h-8 w-16 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!usage) return null;

  const isLowQuota = usage.remaining <= 3 && usage.remaining > 0;
  const isOutOfQuota = usage.remaining === 0;
  const showTrialWarning = tierStatus?.isFree && tierStatus?.trialActive && tierStatus?.trialDaysRemaining <= 1;
  const showTrialExpired = tierStatus?.trialExpired;

  return (
    <div className="space-y-4">
      {/* Trial Warning Banner */}
      {showTrialWarning && tierStatus && (
        <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900">Trial Ending Soon</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Your free trial expires in {tierStatus.trialHoursRemaining} hours. After that, you'll only have access to Threads and LinkedIn.
              </p>
              <a
                href="/billing"
                className="mt-2 inline-block text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                Upgrade to Pro for $20/month →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Trial Expired Banner */}
      {showTrialExpired && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900">Trial Expired</h3>
              <p className="mt-1 text-sm text-red-700">
                Your free trial has ended. You now only have access to Threads and LinkedIn platforms.
              </p>
              <a
                href="/billing"
                className="mt-2 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Upgrade to Pro - $20/month
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
      {/* Generations Used */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Generations Used</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {usage.used}
              <span className="text-lg text-gray-500">/{usage.limit}</span>
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <TrendingUp className="h-6 w-6 text-primary-600" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${
                isOutOfQuota
                  ? 'bg-red-500'
                  : isLowQuota
                  ? 'bg-yellow-500'
                  : 'bg-primary-600'
              }`}
              style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
            />
          </div>
          {isOutOfQuota && (
            <p className="mt-2 text-sm font-medium text-red-600">
              Quota exceeded. Upgrade to continue.
            </p>
          )}
          {isLowQuota && !isOutOfQuota && (
            <p className="mt-2 text-sm font-medium text-yellow-600">
              {usage.remaining} generation{usage.remaining !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>
      </div>

      {/* Current Plan */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Current Plan</p>
            <p className="mt-2 text-3xl font-bold capitalize text-gray-900">{usage.tier}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        {usage.tier === 'free' && (
          <a
            href="/billing"
            className="mt-4 block text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Upgrade to Pro →
          </a>
        )}
      </div>

      {/* Resets */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Usage Resets</p>
            <p className="mt-2 text-xl font-bold text-gray-900">
              {formatRelativeTime(new Date(usage.resetsAt))}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
        </div>

        {usage.lastUsedAt && (
          <p className="mt-4 text-sm text-gray-500">
            Last used: {formatRelativeTime(new Date(usage.lastUsedAt))}
          </p>
        )}
      </div>
    </div>
    </div>
  );
}
