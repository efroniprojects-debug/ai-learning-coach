export interface TutorStep {
  number: number;
  title: string;
  content: string;
}

export interface TutorMisconception {
  misconception: string;
  correction: string;
}

export interface SourceChunk {
  id: string;
  text: string;
  source: string;
}

/** Full structured response from S04 Physics Tutor Engine */
export interface TutorResponse {
  conversationId: string;
  messageId: string;
  explanation: string;
  steps: TutorStep[];
  hints: string[];
  misconceptions: TutorMisconception[];
  socraticQuestion?: string;
  sources: SourceChunk[];
  // Legacy compat fields
  content?: string;
  provider?: 'claude' | 'gemini' | 'openai';
  model?: string;
  tokensUsed?: { input: number; output: number };
}

/** Legacy type kept for backward compatibility */
export type QuestionResponse = TutorResponse;

export interface ConversationSummary {
  id: string;
  title: string | null;
  subject: string | null;
  createdAt: string;
  updatedAt: string;
}
