export interface QuestionAnalysis {
  concepts: string[];
  difficulty: number;
  topicHint: string;
}

export interface SourceChunk {
  id: string;
  text: string;
  source: string;
}

export interface QuestionResponse {
  analysis: QuestionAnalysis;
  explanation: string;
  sources: SourceChunk[];
}

export interface HintResponse {
  hint: string;
}

export interface SolutionResponse {
  solution: string;
}
