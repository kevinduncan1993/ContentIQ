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
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">{PLATFORM_NAMES[platform]}</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{PLATFORM_NAMES[platform]}</h3>
        <button
          onClick={handleCopy}
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-600" />
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
      <div className="prose prose-sm max-w-none">
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
            <strong className="text-primary-600">Hook:</strong>
            <p>{content.hook}</p>
          </div>
          {content.promise && (
            <div>
              <strong className="text-primary-600">Promise:</strong>
              <p>{content.promise}</p>
            </div>
          )}
          <div>
            <strong className="text-primary-600">Talking Points:</strong>
            <ul className="mt-2 space-y-3">
              {content.talkingPoints?.map((point: any, idx: number) => (
                <li key={idx}>
                  <strong>{point.point}</strong>
                  <br />
                  <span className="text-sm text-gray-600">Visual: {point.visual}</span>
                  <br />
                  <span className="text-xs text-gray-500">{point.duration}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong className="text-primary-600">CTA:</strong>
            <p>{content.cta}</p>
          </div>
          {content.hashtags && (
            <div>
              <strong className="text-primary-600">Hashtags:</strong>
              <p className="text-sm text-gray-600">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'twitter':
      return (
        <div className="space-y-2">
          {content.thread?.map((tweet: string, idx: number) => (
            <div key={idx} className="rounded-lg bg-gray-50 p-3">
              <p className="whitespace-pre-wrap">{tweet}</p>
            </div>
          ))}
          {content.hashtags && (
            <div className="mt-4">
              <strong className="text-primary-600">Hashtags:</strong>
              <p className="text-sm text-gray-600">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'linkedin':
      return (
        <div className="space-y-4">
          <div>
            <strong className="text-primary-600">Hook:</strong>
            <p className="font-medium">{content.hook}</p>
          </div>
          <div>
            <p className="whitespace-pre-wrap">{content.post}</p>
          </div>
          {content.hashtags && (
            <div>
              <strong className="text-primary-600">Hashtags:</strong>
              <p className="text-sm text-gray-600">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'instagram':
      return (
        <div className="space-y-4">
          <div>
            <strong className="text-primary-600">Caption:</strong>
            <p className="whitespace-pre-wrap">{content.caption}</p>
          </div>
          {content.slideIdeas && (
            <div>
              <strong className="text-primary-600">Carousel Ideas:</strong>
              <ul className="mt-2 space-y-1">
                {content.slideIdeas.map((slide: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-700">
                    {slide}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.hashtags && (
            <div>
              <strong className="text-primary-600">Hashtags:</strong>
              <p className="text-sm text-gray-600">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'threads':
      return (
        <div className="space-y-2">
          {content.posts?.map((post: string, idx: number) => (
            <div key={idx} className="rounded-lg bg-gray-50 p-3">
              <p className="whitespace-pre-wrap">{post}</p>
            </div>
          ))}
        </div>
      );

    case 'email':
      return (
        <div className="space-y-4">
          <div>
            <strong className="text-primary-600">Subject Line:</strong>
            <p className="font-medium">{content.subjectLine}</p>
          </div>
          <div>
            <strong className="text-primary-600">Preview Text:</strong>
            <p className="text-sm text-gray-600">{content.previewText}</p>
          </div>
          <div>
            <strong className="text-primary-600">Email Body:</strong>
            <p className="whitespace-pre-wrap">{content.emailBody}</p>
          </div>
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

    default:
      return JSON.stringify(content, null, 2);
  }
}
