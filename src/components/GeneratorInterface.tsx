'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { PlatformSelector } from './PlatformSelector';
import { ToneSelector } from './ToneSelector';
import { OutputPanel } from './OutputPanel';
import type { Platform, Tone } from '@/prompts';

interface GenerationResult {
  analysis: {
    coreMessage: string;
    keyPoints: string[];
    topic: string;
    audience: string;
  };
  outputs: Array<{
    platform: Platform;
    content: any;
    error?: string;
  }>;
  metadata: {
    generationTimeMs: number;
    tokensUsed: number;
    quotaRemaining: number;
  };
}

export function GeneratorInterface() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [selectedTone, setSelectedTone] = useState<Tone>('conversational');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const handleGenerate = async () => {
    // Validation
    if (!content.trim()) {
      toast.error('Please enter some content to repurpose');
      return;
    }

    if (content.length < 100) {
      toast.error('Content must be at least 100 characters');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          platforms: selectedPlatforms,
          tone: selectedTone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(data.message || 'Quota exceeded. Please upgrade or wait until reset.');
        } else {
          toast.error(data.error || 'Generation failed');
        }
        return;
      }

      setResult(data);
      toast.success(
        `Generated content for ${selectedPlatforms.length} platform${
          selectedPlatforms.length > 1 ? 's' : ''
        } in ${(data.metadata.generationTimeMs / 1000).toFixed(1)}s`
      );
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const characterCount = content.length;
  const isValidLength = characterCount >= 100 && characterCount <= 10000;

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-semibold text-white">Input Your Content</h2>

        <div className="space-y-4">
          {/* Content Input */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-300">
              Long-form Content
            </label>
            <p className="mt-1 text-sm text-gray-400">
              Paste your blog post, podcast transcript, YouTube script, or notes
            </p>
            <textarea
              id="content"
              rows={10}
              className="mt-2 block w-full rounded-lg border border-white/10 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder="Paste your content here... (minimum 100 characters)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isGenerating}
            />
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`text-sm ${
                  !isValidLength && characterCount > 0 ? 'text-red-400' : 'text-gray-400'
                }`}
              >
                {characterCount.toLocaleString()} / 10,000 characters
                {characterCount > 0 && characterCount < 100 && (
                  <span className="ml-2 text-red-400">
                    (minimum 100)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Select Platforms
            </label>
            <p className="mt-1 text-sm text-gray-400">
              Choose which platforms you want to create content for
            </p>
            <div className="mt-3">
              <PlatformSelector
                selected={selectedPlatforms}
                onChange={setSelectedPlatforms}
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Creator Tone
            </label>
            <p className="mt-1 text-sm text-gray-400">
              Set the tone and style for your content
            </p>
            <div className="mt-3">
              <ToneSelector
                selected={selectedTone}
                onChange={setSelectedTone}
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !isValidLength || selectedPlatforms.length === 0}
              className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-purple-500/50 transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Content
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Core Message */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-6 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-purple-300">Core Message</h3>
            <p className="mt-2 text-lg text-white">{result.analysis.coreMessage}</p>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-purple-300">Key Points:</h4>
              <ul className="mt-2 space-y-1">
                {result.analysis.keyPoints.map((point, idx) => (
                  <li key={idx} className="text-sm text-purple-200">
                    • {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Platform Outputs */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Generated Content</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {result.outputs.map((output) => (
                <OutputPanel
                  key={output.platform}
                  platform={output.platform}
                  content={output.content}
                  error={output.error}
                />
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>
                Generated in {(result.metadata.generationTimeMs / 1000).toFixed(2)}s
              </span>
              <span>Tokens used: {result.metadata.tokensUsed.toLocaleString()}</span>
              <span>Remaining: {result.metadata.quotaRemaining} generations</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
