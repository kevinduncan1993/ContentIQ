'use client';

import { useEffect, useState } from 'react';
import { Video, Twitter, Linkedin, Instagram, MessageCircle, Mail, Facebook, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { Platform } from '@/prompts';
import { cn } from '@/lib/utils';

const platforms = [
  { id: 'tiktok' as Platform, name: 'TikTok / Reels', icon: Video, color: 'bg-pink-100 text-pink-600' },
  { id: 'twitter' as Platform, name: 'Twitter / X', icon: Twitter, color: 'bg-sky-100 text-sky-600' },
  { id: 'linkedin' as Platform, name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-100 text-blue-600' },
  { id: 'instagram' as Platform, name: 'Instagram', icon: Instagram, color: 'bg-purple-100 text-purple-600' },
  { id: 'threads' as Platform, name: 'Threads', icon: MessageCircle, color: 'bg-gray-100 text-gray-600' },
  { id: 'email' as Platform, name: 'Email', icon: Mail, color: 'bg-green-100 text-green-600' },
  { id: 'facebook' as Platform, name: 'Facebook', icon: Facebook, color: 'bg-blue-100 text-blue-700' },
];

interface PlatformSelectorProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
  disabled?: boolean;
}

interface TierStatus {
  tier: string;
  trialActive: boolean;
  trialExpired: boolean;
  lockedPlatforms: Platform[];
  availablePlatforms: Platform[];
}

export function PlatformSelector({ selected, onChange, disabled }: PlatformSelectorProps) {
  const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTierStatus();
  }, []);

  async function fetchTierStatus() {
    try {
      const response = await fetch('/api/tier');
      if (!response.ok) throw new Error('Failed to fetch tier status');
      const data = await response.json();
      setTierStatus(data);
    } catch (error) {
      console.error('Error fetching tier status:', error);
    } finally {
      setLoading(false);
    }
  }

  const togglePlatform = (platform: Platform, isLocked: boolean) => {
    if (disabled) return;

    if (isLocked) {
      toast.error(`${platform} is only available on the Pro plan. Upgrade to access all platforms.`, {
        action: {
          label: 'Upgrade',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    if (selected.includes(platform)) {
      onChange(selected.filter((p) => p !== platform));
    } else {
      onChange([...selected, platform]);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {platforms.map((platform) => (
          <div key={platform.id} className="animate-pulse rounded-lg border-2 border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gray-700"></div>
              <div className="h-4 w-20 rounded bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {platforms.map((platform) => {
        const isSelected = selected.includes(platform.id);
        const isLocked = tierStatus?.lockedPlatforms.includes(platform.id) || false;
        const Icon = platform.icon;

        return (
          <button
            key={platform.id}
            type="button"
            onClick={() => togglePlatform(platform.id, isLocked)}
            disabled={disabled}
            className={cn(
              'relative flex items-center space-x-3 rounded-lg border-2 p-4 text-left transition-all',
              isLocked
                ? 'border-white/10 bg-white/5 cursor-pointer hover:border-purple-500/30 hover:bg-purple-500/10'
                : isSelected
                ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isLocked ? 'bg-gray-700/50 text-gray-500' : 'bg-gray-800/50',
              !isLocked && platform.color
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className={cn(
                'text-sm font-medium',
                isLocked ? 'text-gray-500' : isSelected ? 'text-white' : 'text-gray-300'
              )}>
                {platform.name}
              </p>
              {isLocked && (
                <p className="text-xs text-gray-500 mt-0.5">Pro only</p>
              )}
            </div>
            {isLocked && (
              <div className="h-5 w-5 rounded-full bg-gray-700 flex items-center justify-center">
                <Lock className="h-3 w-3 text-gray-500" />
              </div>
            )}
            {!isLocked && isSelected && (
              <div className="h-5 w-5 rounded-full bg-purple-600 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
