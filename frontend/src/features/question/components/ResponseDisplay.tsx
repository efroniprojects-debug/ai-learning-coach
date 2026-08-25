import type { QuestionResponse } from '../types';

interface ResponseDisplayProps {
  response: QuestionResponse;
  questionText: string;
}

export function ResponseDisplay({ response, questionText }: ResponseDisplayProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">תשובה</h2>
        <p className="text-sm text-gray-500 mb-4">
          מודל: {response.model} | ספק: {response.provider.toUpperCase()}
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-6 prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {response.content}
          </div>
        </div>

        {response.tokensUsed && (
          <div className="mt-4 text-xs text-gray-500 border-t pt-4">
            <p>טוקנים בשימוש:</p>
            <p>קלט: {response.tokensUsed.input} | פלט: {response.tokensUsed.output}</p>
          </div>
        )}
      </div>
    </div>
  );
}
