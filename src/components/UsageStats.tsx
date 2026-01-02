'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Zap } from 'lucide-react';
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

export function UsageStats() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  async function fetchUsage() {
    try {
      const response = await fetch('/api/usage');
      if (!response.ok) throw new Error('Failed to fetch usage');
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-4 w-24 rounded bg-gray-200"></div>
            <div className="mt-2 h-8 w-16 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!usage) return null;

  const isLowQuota = usage.remaining <= 3 && usage.remaining > 0;
  const isOutOfQuota = usage.remaining === 0;

  return (
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
  );
}
