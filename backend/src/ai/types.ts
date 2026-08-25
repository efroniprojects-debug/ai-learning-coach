export interface AIProvider {
  name: 'claude' | 'gemini' | 'openai';
  apiKey: string;
  model: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: 'claude' | 'gemini' | 'openai';
  tokensUsed?: {
    input: number;
    output: number;
  };
}
