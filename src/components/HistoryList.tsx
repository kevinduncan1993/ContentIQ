'use client';

import { useEffect, useState } from 'react';
import { Clock, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';
import type { Platform } from '@/prompts';

interface Generation {
  id: string;
  inputContent: string;
  selectedPlatforms: string[];
  selectedTone: string;
  coreMessage: string | null;
  keyPoints: any;
  status: string;
  createdAt: Date;
  outputTiktok: any;
  outputTwitter: any;
  outputLinkedin: any;
  outputInstagram: any;
  outputThreads: any;
  outputEmail: any;
}

function renderPlatformContent(platform: Platform, content: any) {
  switch (platform) {
    case 'tiktok':
      return (
        <div className="space-y-3">
          <div>
            <strong className="text-purple-400 text-xs">Hook:</strong>
            <p className="text-gray-300 text-sm mt-1">{content.hook}</p>
          </div>
          {content.promise && (
            <div>
              <strong className="text-purple-400 text-xs">Promise:</strong>
              <p className="text-gray-300 text-sm mt-1">{content.promise}</p>
            </div>
          )}
          <div>
            <strong className="text-purple-400 text-xs">Talking Points:</strong>
            <ul className="mt-2 space-y-2">
              {content.talkingPoints?.map((point: any, idx: number) => (
                <li key={idx} className="text-xs">
                  <strong className="text-white">{point.point}</strong>
                  <br />
                  <span className="text-gray-400">Visual: {point.visual}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong className="text-purple-400 text-xs">CTA:</strong>
            <p className="text-gray-300 text-sm mt-1">{content.cta}</p>
          </div>
          {content.hashtags && (
            <div>
              <strong className="text-purple-400 text-xs">Hashtags:</strong>
              <p className="text-xs text-gray-400 mt-1">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'twitter':
      return (
        <div className="space-y-2">
          {content.thread?.map((tweet: string, idx: number) => (
            <div key={idx} className="rounded-lg bg-white/5 p-2 border border-white/10">
              <p className="whitespace-pre-wrap text-gray-300 text-sm">{tweet}</p>
            </div>
          ))}
          {content.hashtags && (
            <div className="mt-3">
              <strong className="text-purple-400 text-xs">Hashtags:</strong>
              <p className="text-xs text-gray-400 mt-1">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'linkedin':
      return (
        <div className="space-y-3">
          <div>
            <strong className="text-purple-400 text-xs">Hook:</strong>
            <p className="font-medium text-white text-sm mt-1">{content.hook}</p>
          </div>
          <div>
            <p className="whitespace-pre-wrap text-gray-300 text-sm">{content.post}</p>
          </div>
          {content.hashtags && (
            <div>
              <strong className="text-purple-400 text-xs">Hashtags:</strong>
              <p className="text-xs text-gray-400 mt-1">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'instagram':
      return (
        <div className="space-y-3">
          <div>
            <strong className="text-purple-400 text-xs">Caption:</strong>
            <p className="whitespace-pre-wrap text-gray-300 text-sm mt-1">{content.caption}</p>
          </div>
          {content.slideIdeas && (
            <div>
              <strong className="text-purple-400 text-xs">Carousel Ideas:</strong>
              <ul className="mt-2 space-y-1">
                {content.slideIdeas.map((slide: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-400">
                    {slide}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.hashtags && (
            <div>
              <strong className="text-purple-400 text-xs">Hashtags:</strong>
              <p className="text-xs text-gray-400 mt-1">{content.hashtags.join(' ')}</p>
            </div>
          )}
        </div>
      );

    case 'threads':
      return (
        <div className="space-y-2">
          {content.posts?.map((post: string, idx: number) => (
            <div key={idx} className="rounded-lg bg-white/5 p-2 border border-white/10">
              <p className="whitespace-pre-wrap text-gray-300 text-sm">{post}</p>
            </div>
          ))}
        </div>
      );

    case 'email':
      return (
        <div className="space-y-3">
          <div>
            <strong className="text-purple-400 text-xs">Subject Line:</strong>
            <p className="font-medium text-white text-sm mt-1">{content.subjectLine}</p>
          </div>
          <div>
            <strong className="text-purple-400 text-xs">Preview Text:</strong>
            <p className="text-xs text-gray-400 mt-1">{content.previewText}</p>
          </div>
          <div>
            <strong className="text-purple-400 text-xs">Email Body:</strong>
            <p className="whitespace-pre-wrap text-gray-300 text-sm mt-1">{content.emailBody}</p>
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

export function HistoryList() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const response = await fetch('/api/history');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setGenerations(data.generations);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="h-4 w-48 rounded bg-gray-700"></div>
            <div className="mt-4 h-4 w-full rounded bg-gray-700"></div>
          </div>
        ))}
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
        <Clock className="mx-auto h-12 w-12 text-gray-500" />
        <h3 className="mt-4 text-lg font-medium text-white">No generations yet</h3>
        <p className="mt-2 text-sm text-gray-400">
          Your content generations will appear here once you create them
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
        >
          Create Content
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {generations.map((gen) => {
        const isExpanded = expandedId === gen.id;
        const platformOutputs = [
          { platform: 'TikTok', data: gen.outputTiktok },
          { platform: 'Twitter', data: gen.outputTwitter },
          { platform: 'LinkedIn', data: gen.outputLinkedin },
          { platform: 'Instagram', data: gen.outputInstagram },
          { platform: 'Threads', data: gen.outputThreads },
          { platform: 'Email', data: gen.outputEmail },
        ].filter((p) => gen.selectedPlatforms.includes(p.platform.toLowerCase()));

        return (
          <div
            key={gen.id}
            className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {gen.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : gen.status === 'failed' ? (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-400" />
                  )}
                  <span className="text-sm font-medium capitalize text-gray-400">
                    {gen.selectedTone} • {gen.selectedPlatforms.length} platform
                    {gen.selectedPlatforms.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="mt-2 text-white line-clamp-2">{gen.coreMessage || 'Processing...'}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {formatRelativeTime(new Date(gen.createdAt))}
                </p>
              </div>
              <button
                onClick={() => setExpandedId(isExpanded ? null : gen.id)}
                className="ml-4 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                {isExpanded ? 'Hide' : 'View'}
              </button>
            </div>

            {/* Expanded Content */}
            {isExpanded && gen.status === 'completed' && (
              <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                {/* Original Content */}
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Original Content</h4>
                    <button
                      onClick={() => copyToClipboard(gen.inputContent, 'Original content')}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-400 whitespace-pre-wrap">
                    {gen.inputContent.substring(0, 300)}
                    {gen.inputContent.length > 300 && '...'}
                  </p>
                </div>

                {/* Platform Outputs */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {platformOutputs.map((output) => (
                    <div
                      key={output.platform}
                      className="rounded-lg border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">{output.platform}</h4>
                        {output.data && (
                          <button
                            onClick={() => copyToClipboard(formatContentForCopy(output.platform.toLowerCase() as Platform, output.data), output.platform)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="mt-2">
                        {output.data ? (
                          renderPlatformContent(output.platform.toLowerCase() as Platform, output.data)
                        ) : (
                          <span className="text-sm text-gray-500">Not generated</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
