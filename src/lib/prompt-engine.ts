/**
 * Prompt Engine - Orchestrates content analysis and platform-specific generation
 * This is the brain of RepurposeFlow
 */

import { llmService, type LLMResponse } from './llm/provider';
import {
  CONTENT_ANALYZER_PROMPT,
  type ContentAnalysis,
  getPromptForPlatform,
  fillPromptTemplate,
  type Platform,
  type Tone,
  type TikTokOutput,
  type TwitterOutput,
  type LinkedInOutput,
  type InstagramOutput,
  type ThreadsOutput,
  type EmailOutput,
} from '@/prompts';

export interface GenerationInput {
  content: string;
  platforms: Platform[];
  tone: Tone;
}

export interface PlatformOutput {
  platform: Platform;
  content: TikTokOutput | TwitterOutput | LinkedInOutput | InstagramOutput | ThreadsOutput | EmailOutput;
  error?: string;
}

export interface GenerationResult {
  analysis: ContentAnalysis;
  outputs: PlatformOutput[];
  totalTokens: number;
  generationTimeMs: number;
  llmProvider: string;
  llmModel: string;
}

class PromptEngine {
  /**
   * Main generation flow
   */
  async generate(input: GenerationInput): Promise<GenerationResult> {
    const startTime = Date.now();
    let totalTokens = 0;
    let llmProvider = '';
    let llmModel = '';

    try {
      // STAGE 1: Content Analysis
      console.log('[PromptEngine] Starting content analysis...');
      const analysisPrompt = fillPromptTemplate(CONTENT_ANALYZER_PROMPT, {
        content: input.content,
      });

      const analysisResponse = await llmService.generate(analysisPrompt, {
        temperature: 0.3, // Lower temperature for consistent analysis
        maxTokens: 1000,
        systemPrompt: 'You are a content analysis expert. Always return valid JSON.',
      });

      const analysis = llmService.parseJSON<ContentAnalysis>(analysisResponse);
      totalTokens += analysisResponse.tokens;
      llmProvider = analysisResponse.provider;
      llmModel = analysisResponse.model;

      console.log('[PromptEngine] Analysis complete:', {
        coreMessage: analysis.coreMessage,
        keyPoints: analysis.keyPoints.length,
      });

      // STAGE 2: Parallel Platform Generation
      console.log('[PromptEngine] Starting parallel platform generation...');
      const generationPromises = input.platforms.map((platform) =>
        this.generatePlatform(platform, input.tone, analysis)
      );

      const platformResults = await Promise.allSettled(generationPromises);

      // Process results
      const outputs: PlatformOutput[] = platformResults.map((result, index) => {
        const platform = input.platforms[index];

        if (result.status === 'fulfilled') {
          totalTokens += result.value.tokens;
          return {
            platform,
            content: result.value.content,
          };
        } else {
          console.error(`[PromptEngine] Failed to generate ${platform}:`, result.reason);
          return {
            platform,
            content: {} as any,
            error: result.reason.message || 'Generation failed',
          };
        }
      });

      const generationTimeMs = Date.now() - startTime;

      console.log('[PromptEngine] Generation complete:', {
        platforms: outputs.length,
        totalTokens,
        timeMs: generationTimeMs,
      });

      return {
        analysis,
        outputs,
        totalTokens,
        generationTimeMs,
        llmProvider,
        llmModel,
      };
    } catch (error) {
      console.error('[PromptEngine] Generation failed:', error);
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate content for a single platform
   */
  private async generatePlatform(
    platform: Platform,
    tone: Tone,
    analysis: ContentAnalysis
  ): Promise<{ content: any; tokens: number }> {
    const promptTemplate = getPromptForPlatform(platform, tone);
    const prompt = fillPromptTemplate(promptTemplate, {
      coreMessage: analysis.coreMessage,
      keyPoints: analysis.keyPoints,
    });

    const response = await llmService.generate(prompt, {
      temperature: 0.8, // Higher temperature for creative content
      maxTokens: 2500,
      systemPrompt: `You are a ${platform} content expert. Always return valid JSON matching the exact output format specified.`,
    });

    const content = llmService.parseJSON(response);

    return {
      content,
      tokens: response.tokens,
    };
  }

  /**
   * Validate input content
   */
  validateInput(input: GenerationInput): { valid: boolean; error?: string } {
    // Check content length
    if (!input.content || input.content.trim().length < 100) {
      return {
        valid: false,
        error: 'Content must be at least 100 characters long',
      };
    }

    if (input.content.length > 10000) {
      return {
        valid: false,
        error: 'Content must be less than 10,000 characters',
      };
    }

    // Check platforms
    if (!input.platforms || input.platforms.length === 0) {
      return {
        valid: false,
        error: 'At least one platform must be selected',
      };
    }

    if (input.platforms.length > 6) {
      return {
        valid: false,
        error: 'Maximum 6 platforms can be selected',
      };
    }

    // Check tone
    const validTones: Tone[] = ['educational', 'conversational', 'opinionated', 'authority'];
    if (!validTones.includes(input.tone)) {
      return {
        valid: false,
        error: 'Invalid tone selected',
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize user input to prevent prompt injection
   */
  sanitizeInput(content: string): string {
    // Remove any potential system prompt attempts
    const dangerous = [
      /system:/gi,
      /assistant:/gi,
      /\[system\]/gi,
      /\[assistant\]/gi,
      /<\|im_start\|>/gi,
      /<\|im_end\|>/gi,
    ];

    let sanitized = content;
    dangerous.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Trim and normalize whitespace
    sanitized = sanitized.trim().replace(/\s+/g, ' ');

    return sanitized;
  }
}

// Export singleton instance
export const promptEngine = new PromptEngine();
