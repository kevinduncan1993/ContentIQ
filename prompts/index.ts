/**
 * PROMPT ORCHESTRATION INDEX
 *
 * Central export for all prompt templates.
 * Import this file to access any platform's prompts.
 */

export { CONTENT_ANALYZER_PROMPT, type ContentAnalysis } from './content-analyzer';
export { TIKTOK_PROMPTS, type TikTokOutput } from './platform-tiktok';
export { TWITTER_PROMPTS, type TwitterOutput } from './platform-twitter';
export { LINKEDIN_PROMPTS, type LinkedInOutput } from './platform-linkedin';
export { INSTAGRAM_PROMPTS, type InstagramOutput } from './platform-instagram';
export { THREADS_PROMPTS, type ThreadsOutput } from './platform-threads';
export { EMAIL_PROMPTS, type EmailOutput } from './platform-email';

/**
 * Platform type definition
 */
export type Platform = 'tiktok' | 'twitter' | 'linkedin' | 'instagram' | 'threads' | 'email';

/**
 * Tone type definition
 */
export type Tone = 'educational' | 'conversational' | 'opinionated' | 'authority';

/**
 * Get the appropriate prompt for a platform and tone
 */
export function getPromptForPlatform(platform: Platform, tone: Tone): string {
  const promptMap: Record<Platform, Record<Tone, string>> = {
    tiktok: TIKTOK_PROMPTS as Record<Tone, string>,
    twitter: TWITTER_PROMPTS as Record<Tone, string>,
    linkedin: LINKEDIN_PROMPTS as Record<Tone, string>,
    instagram: INSTAGRAM_PROMPTS as Record<Tone, string>,
    threads: THREADS_PROMPTS as Record<Tone, string>,
    email: EMAIL_PROMPTS as Record<Tone, string>,
  };

  return promptMap[platform][tone];
}

/**
 * Replace placeholders in prompt template
 */
export function fillPromptTemplate(
  template: string,
  data: {
    content?: string;
    coreMessage?: string;
    keyPoints?: string[];
  }
): string {
  let filled = template;

  if (data.content) {
    filled = filled.replace('{content}', data.content);
  }

  if (data.coreMessage) {
    filled = filled.replace('{coreMessage}', data.coreMessage);
  }

  if (data.keyPoints) {
    const keyPointsText = data.keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join('\n');
    filled = filled.replace('{keyPoints}', keyPointsText);
  }

  return filled;
}

/**
 * Platform display names
 */
export const PLATFORM_NAMES: Record<Platform, string> = {
  tiktok: 'TikTok / Reels',
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  threads: 'Threads',
  email: 'Email Newsletter',
};

/**
 * Tone display names and descriptions
 */
export const TONE_INFO: Record<Tone, { name: string; description: string }> = {
  educational: {
    name: 'Educational',
    description: 'Teach something valuable. Clear and informative.',
  },
  conversational: {
    name: 'Conversational',
    description: 'Casual and relatable. Like talking to a friend.',
  },
  opinionated: {
    name: 'Opinionated',
    description: 'Bold takes. Challenge conventional thinking.',
  },
  authority: {
    name: 'Authority',
    description: 'Expert insights. Data-driven and credible.',
  },
};
