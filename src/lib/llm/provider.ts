/**
 * LLM Provider Abstraction Layer
 * Supports OpenAI, Anthropic, and Google Gemini with automatic failover
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type LLMProvider = 'openai' | 'anthropic' | 'gemini';

export interface LLMResponse {
  content: string;
  tokens: number;
  model: string;
  provider: LLMProvider;
}

export interface LLMConfig {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

class LLMService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private preferredProvider: LLMProvider;

  constructor() {
    // Set preferred provider
    this.preferredProvider = (process.env.LLM_PROVIDER as LLMProvider) || 'openai';
  }

  private initialize() {
    if (this.openai || this.anthropic || this.gemini) return; // Already initialized

    // Initialize clients
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    if (process.env.GOOGLE_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    }

    if (!this.openai && !this.anthropic && !this.gemini) {
      throw new Error('No LLM provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY.');
    }
  }

  /**
   * Generate completion using preferred provider with automatic failover
   */
  async generate(prompt: string, config: LLMConfig = {}): Promise<LLMResponse> {
    this.initialize(); // Lazy initialize on first use

    const {
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt = 'You are a helpful assistant.',
    } = config;

    try {
      // Try preferred provider first
      if (this.preferredProvider === 'openai' && this.openai) {
        return await this.generateWithOpenAI(prompt, systemPrompt, temperature, maxTokens);
      } else if (this.preferredProvider === 'anthropic' && this.anthropic) {
        return await this.generateWithAnthropic(prompt, systemPrompt, temperature, maxTokens);
      } else if (this.preferredProvider === 'gemini' && this.gemini) {
        return await this.generateWithGemini(prompt, systemPrompt, temperature, maxTokens);
      }

      // Fallback to alternative provider
      if (this.preferredProvider === 'openai' && (this.anthropic || this.gemini)) {
        console.warn('OpenAI unavailable, falling back');
        return this.anthropic
          ? await this.generateWithAnthropic(prompt, systemPrompt, temperature, maxTokens)
          : await this.generateWithGemini(prompt, systemPrompt, temperature, maxTokens);
      } else if (this.preferredProvider === 'anthropic' && (this.openai || this.gemini)) {
        console.warn('Anthropic unavailable, falling back');
        return this.openai
          ? await this.generateWithOpenAI(prompt, systemPrompt, temperature, maxTokens)
          : await this.generateWithGemini(prompt, systemPrompt, temperature, maxTokens);
      } else if (this.preferredProvider === 'gemini' && (this.openai || this.anthropic)) {
        console.warn('Gemini unavailable, falling back');
        return this.openai
          ? await this.generateWithOpenAI(prompt, systemPrompt, temperature, maxTokens)
          : await this.generateWithAnthropic(prompt, systemPrompt, temperature, maxTokens);
      }

      throw new Error('No LLM provider available');
    } catch (error) {
      // Try failover to any available provider
      console.error(`LLM generation failed with ${this.preferredProvider}:`, error);

      if (this.openai && this.preferredProvider !== 'openai') {
        console.log('Attempting failover to OpenAI...');
        return await this.generateWithOpenAI(prompt, systemPrompt, temperature, maxTokens);
      } else if (this.anthropic && this.preferredProvider !== 'anthropic') {
        console.log('Attempting failover to Anthropic...');
        return await this.generateWithAnthropic(prompt, systemPrompt, temperature, maxTokens);
      } else if (this.gemini && this.preferredProvider !== 'gemini') {
        console.log('Attempting failover to Gemini...');
        return await this.generateWithGemini(prompt, systemPrompt, temperature, maxTokens);
      }

      throw error;
    }
  }

  private async generateWithOpenAI(
    prompt: string,
    systemPrompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<LLMResponse> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    });

    return {
      content: response.choices[0]?.message?.content || '',
      tokens: response.usage?.total_tokens || 0,
      model: response.model,
      provider: 'openai',
    };
  }

  private async generateWithAnthropic(
    prompt: string,
    systemPrompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<LLMResponse> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '';

    return {
      content: textContent,
      tokens: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
      provider: 'anthropic',
    };
  }

  private async generateWithGemini(
    prompt: string,
    systemPrompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<LLMResponse> {
    if (!this.gemini) throw new Error('Gemini client not initialized');

    const model = this.gemini.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
      },
    });

    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    return {
      content: text,
      tokens: response.usageMetadata?.totalTokenCount || 0,
      model: 'gemini-2.0-flash-exp',
      provider: 'gemini',
    };
  }

  /**
   * Parse JSON response from LLM
   */
  parseJSON<T>(response: LLMResponse): T {
    try {
      return JSON.parse(response.content) as T;
    } catch (error) {
      console.error('Failed to parse LLM JSON response:', response.content);
      throw new Error('LLM returned invalid JSON');
    }
  }
}

// Export singleton instance
export const llmService = new LLMService();
