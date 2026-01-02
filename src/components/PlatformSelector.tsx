'use client';

import { Video, Twitter, Linkedin, Instagram, MessageCircle, Mail } from 'lucide-react';
import type { Platform } from '@/prompts';
import { cn } from '@/lib/utils';

const platforms = [
  { id: 'tiktok' as Platform, name: 'TikTok / Reels', icon: Video, color: 'bg-pink-100 text-pink-600' },
  { id: 'twitter' as Platform, name: 'Twitter / X', icon: Twitter, color: 'bg-sky-100 text-sky-600' },
  { id: 'linkedin' as Platform, name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-100 text-blue-600' },
  { id: 'instagram' as Platform, name: 'Instagram', icon: Instagram, color: 'bg-purple-100 text-purple-600' },
  { id: 'threads' as Platform, name: 'Threads', icon: MessageCircle, color: 'bg-gray-100 text-gray-600' },
  { id: 'email' as Platform, name: 'Email', icon: Mail, color: 'bg-green-100 text-green-600' },
];

interface PlatformSelectorProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
  disabled?: boolean;
}

export function PlatformSelector({ selected, onChange, disabled }: PlatformSelectorProps) {
  const togglePlatform = (platform: Platform) => {
    if (disabled) return;

    if (selected.includes(platform)) {
      onChange(selected.filter((p) => p !== platform));
    } else {
      onChange([...selected, platform]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {platforms.map((platform) => {
        const isSelected = selected.includes(platform.id);
        const Icon = platform.icon;

        return (
          <button
            key={platform.id}
            type="button"
            onClick={() => togglePlatform(platform.id)}
            disabled={disabled}
            className={cn(
              'flex items-center space-x-3 rounded-lg border-2 p-4 text-left transition-all',
              isSelected
                ? 'border-primary-600 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', platform.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className={cn('text-sm font-medium', isSelected ? 'text-primary-900' : 'text-gray-900')}>
                {platform.name}
              </p>
            </div>
            {isSelected && (
              <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
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
