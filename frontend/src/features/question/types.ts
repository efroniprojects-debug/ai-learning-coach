export interface QuestionResponse {
  content: string;
  model: string;
  provider: 'claude' | 'gemini' | 'openai';
  tokensUsed?: {
    input: number;
    output: number;
  };
}
