'use client';

import { GraduationCap, MessageSquare, Megaphone, Award } from 'lucide-react';
import type { Tone } from '@/prompts';
import { cn } from '@/lib/utils';

const tones = [
  {
    id: 'educational' as Tone,
    name: 'Educational',
    description: 'Teach something valuable',
    icon: GraduationCap,
  },
  {
    id: 'conversational' as Tone,
    name: 'Conversational',
    description: 'Casual and relatable',
    icon: MessageSquare,
  },
  {
    id: 'opinionated' as Tone,
    name: 'Opinionated',
    description: 'Bold takes and perspectives',
    icon: Megaphone,
  },
  {
    id: 'authority' as Tone,
    name: 'Authority',
    description: 'Expert and data-driven',
    icon: Award,
  },
];

interface ToneSelectorProps {
  selected: Tone;
  onChange: (tone: Tone) => void;
  disabled?: boolean;
}

export function ToneSelector({ selected, onChange, disabled }: ToneSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tones.map((tone) => {
        const isSelected = selected === tone.id;
        const Icon = tone.icon;

        return (
          <button
            key={tone.id}
            type="button"
            onClick={() => onChange(tone.id)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center space-y-2 rounded-lg border-2 p-4 text-center transition-all',
              isSelected
                ? 'border-primary-600 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                isSelected ? 'bg-primary-100' : 'bg-gray-100'
              )}
            >
              <Icon className={cn('h-6 w-6', isSelected ? 'text-primary-600' : 'text-gray-600')} />
            </div>
            <div>
              <p className={cn('text-sm font-semibold', isSelected ? 'text-primary-900' : 'text-gray-900')}>
                {tone.name}
              </p>
              <p className="mt-1 text-xs text-gray-500">{tone.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
