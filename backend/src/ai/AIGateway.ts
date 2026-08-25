import type { AIProvider, AIResponse, AIMessage } from './types';

export class AIGateway {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  async ask(question: string, context?: string): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(context);
    
    switch (this.provider.name) {
      case 'claude':
        return this.askClaude(question, systemPrompt);
      case 'gemini':
        return this.askGemini(question, systemPrompt);
      case 'openai':
        return this.askOpenAI(question, systemPrompt);
      default:
        throw new Error(`Unknown provider: ${this.provider.name}`);
    }
  }

  private buildSystemPrompt(context?: string): string {
    return `You are an expert physics tutor. Your role is to:
1. Explain concepts clearly and intuitively
2. Break down problems into manageable steps
3. Adapt explanations to the student's level
4. Ask clarifying questions if needed
5. Cite your sources when referencing educational material

${context ? `Context: ${context}` : ''}

Always respond in Hebrew (עברית).`;
  }

  private async askClaude(question: string, systemPrompt: string): Promise<AIResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.provider.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: question,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return {
      content: data.content[0].text,
      model: this.provider.model,
      provider: 'claude',
      tokensUsed: {
        input: data.usage.input_tokens,
        output: data.usage.output_tokens,
      },
    };
  }

  private async askGemini(question: string, systemPrompt: string): Promise<AIResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.provider.model}:generateContent?key=${this.provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: question },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return {
      content: data.candidates[0].content.parts[0].text,
      model: this.provider.model,
      provider: 'gemini',
    };
  }

  private async askOpenAI(question: string, systemPrompt: string): Promise<AIResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.provider.apiKey}`,
      },
      body: JSON.stringify({
        model: this.provider.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: question,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return {
      content: data.choices[0].message.content,
      model: this.provider.model,
      provider: 'openai',
      tokensUsed: {
        input: data.usage.prompt_tokens,
        output: data.usage.completion_tokens,
      },
    };
  }
}
