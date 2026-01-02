'use client';

import { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Platform } from '@/prompts';
import { PLATFORM_NAMES } from '@/prompts';

interface OutputPanelProps {
  platform: Platform;
  content: any;
  error?: string;
}

export function OutputPanel({ platform, content, error }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = formatContentForCopy(platform, content);

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success(`Copied ${PLATFORM_NAMES[platform]} content!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div>
            <h3 className="font-semibold text-red-300">{PLATFORM_NAMES[platform]}</h3>
            <p className="mt-1 text-sm text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{PLATFORM_NAMES[platform]}</h3>
        <button
          onClick={handleCopy}
          className="inline-flex items-center rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition-all"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="prose prose-sm prose-invert max-w-none">
        {renderContent(platform, content)}
      </div>
    </div>
  );
}

function renderContent(platform: Platform, content: any) {
  switch (platform) {
    case 'tiktok':
      return (
        <div className="space-y-4">
          <div>
            <strong className="text-purple-400">Hook:</strong>
            <p className="text-gray-300">{content.hook}</p>
          </div>
          {content.promise && (
            <div>
              <strong className="text-purple-400">Promise:</strong>
              <p className="text-gray-300">{content.promise}</p>
            </div>
          )}
          <div>
            <strong className="text-purple-400">Talking Points:</strong>
            <ul className="mt-2 space-y-3">
              {content.talkingPoints?.map((point: any, idx: number) => (
                <li key={idx}>
                  <strong className="text-white">{point.point}</strong>
                  <br />
                  <span className="text-sm text-gray-400">Visual: {point.visual}</span>
                  <br />
                  <span className="text-xs text-gray-500">{point.duration}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong className="text-purple-400">CTA:</strong>
            <p className="text-gray-300">{content.cta}</p>
          </div>
          {content.hashtags && (
            <div>
              <strong className="text-purple-400">Hashtags:</strong>
              <p className="text-sm text-gray-400">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'twitter':
      return (
        <div className="space-y-2">
          {content.thread?.map((tweet: string, idx: number) => (
            <div key={idx} className="rounded-lg bg-white/5 p-3 border border-white/10">
              <p className="whitespace-pre-wrap text-gray-300">{tweet}</p>
            </div>
          ))}
          {content.hashtags && (
            <div className="mt-4">
              <strong className="text-purple-400">Hashtags:</strong>
              <p className="text-sm text-gray-400">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'linkedin':
      return (
        <div className="space-y-4">
          <div>
            <strong className="text-purple-400">Hook:</strong>
            <p className="font-medium text-white">{content.hook}</p>
          </div>
          <div>
            <p className="whitespace-pre-wrap text-gray-300">{content.post}</p>
          </div>
          {content.hashtags && (
            <div>
              <strong className="text-purple-400">Hashtags:</strong>
              <p className="text-sm text-gray-400">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'instagram':
      return (
        <div className="space-y-4">
          <div>
            <strong className="text-purple-400">Caption:</strong>
            <p className="whitespace-pre-wrap text-gray-300">{content.caption}</p>
          </div>
          {content.slideIdeas && (
            <div>
              <strong className="text-purple-400">Carousel Ideas:</strong>
              <ul className="mt-2 space-y-1">
                {content.slideIdeas.map((slide: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-400">
                    {slide}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.hashtags && (
            <div>
              <strong className="text-purple-400">Hashtags:</strong>
              <p className="text-sm text-gray-400">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'threads':
      return (
        <div className="space-y-2">
          {content.posts?.map((post: string, idx: number) => (
            <div key={idx} className="rounded-lg bg-white/5 p-3 border border-white/10">
              <p className="whitespace-pre-wrap text-gray-300">{post}</p>
            </div>
          ))}
        </div>
      );

    case 'email':
      return (
        <div className="space-y-4">
          <div>
            <strong className="text-purple-400">Subject Line:</strong>
            <p className="font-medium text-white">{content.subjectLine}</p>
          </div>
          <div>
            <strong className="text-purple-400">Preview Text:</strong>
            <p className="text-sm text-gray-400">{content.previewText}</p>
          </div>
          <div>
            <strong className="text-purple-400">Email Body:</strong>
            <p className="whitespace-pre-wrap text-gray-300">{content.emailBody}</p>
          </div>
        </div>
      );

    case 'facebook':
      return (
        <div className="space-y-4">
          <div>
            <strong className="text-purple-400">Hook:</strong>
            <p className="font-medium text-white">{content.hook}</p>
          </div>
          <div>
            <p className="whitespace-pre-wrap text-gray-300">{content.post}</p>
          </div>
          {content.keyTips && (
            <div>
              <strong className="text-purple-400">Key Tips:</strong>
              <ul className="mt-2 space-y-1">
                {content.keyTips.map((tip: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-400">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.keyInsights && (
            <div>
              <strong className="text-purple-400">Key Insights:</strong>
              <ul className="mt-2 space-y-1">
                {content.keyInsights.map((insight: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-400">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.mainArguments && (
            <div>
              <strong className="text-purple-400">Main Arguments:</strong>
              <ul className="mt-2 space-y-1">
                {content.mainArguments.map((arg: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-400">
                    {arg}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.hashtags && content.hashtags.length > 0 && (
            <div>
              <strong className="text-purple-400">Hashtags:</strong>
              <p className="text-sm text-gray-400">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    default:
      return <pre className="text-xs">{JSON.stringify(content, null, 2)}</pre>;
  }
}

function formatContentForCopy(platform: Platform, content: any): string {
  switch (platform) {
    case 'tiktok':
      return `${content.hook}\n\n${content.talkingPoints
        ?.map((p: any) => `• ${p.point}\n  Visual: ${p.visual}`)
        .join('\n\n')}\n\n${content.cta}\n\n${content.hashtags?.join(' ') || ''}`;

    case 'twitter':
      return content.thread?.join('\n\n') || '';

    case 'linkedin':
      return `${content.post}\n\n${content.hashtags?.join(' ') || ''}`;

    case 'instagram':
      return `${content.caption}\n\n${content.hashtags?.join(' ') || ''}`;

    case 'threads':
      return content.posts?.join('\n\n') || '';

    case 'email':
      return `Subject: ${content.subjectLine}\n\nPreview: ${content.previewText}\n\n${content.emailBody}`;

    case 'facebook':
      return `${content.post}\n\n${content.hashtags && content.hashtags.length > 0 ? content.hashtags.join(' ') : ''}`;

    default:
      return JSON.stringify(content, null, 2);
  }
}
