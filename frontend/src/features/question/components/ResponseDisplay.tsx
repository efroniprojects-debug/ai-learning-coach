import { useState } from 'react';
import type { QuestionResponse } from '../types';

interface ResponseDisplayProps {
  response: QuestionResponse;
  questionText: string;
}

export function ResponseDisplay({ response, questionText }: ResponseDisplayProps) {
  const [showFullSolution, setShowFullSolution] = useState(false);
  const [showSources, setShowSources] = useState(false);

  return (
    <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
      {/* Concepts & Difficulty */}
      <div>
        <p className="text-sm text-gray-600 mb-2">
          <strong>נושאים:</strong> {response.analysis.concepts.join(', ') || 'כללי'}
        </p>
        <p className="text-sm text-gray-600">
          <strong>רמת קושי:</strong> {'⭐'.repeat(response.analysis.difficulty)}
        </p>
      </div>

      {/* Main Explanation */}
      <div>
        <h3 className="font-semibold mb-3">הסבר</h3>
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
          {response.explanation}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowSources(!showSources)}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
        >
          {showSources ? 'הסתר' : 'הראה'} מקורות ({response.sources.length})
        </button>

        <button
          onClick={() => setShowFullSolution(!showFullSolution)}
          className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
        >
          {showFullSolution ? 'הסתר' : 'הראה'} פתרון מלא
        </button>
      </div>

      {/* Sources */}
      {showSources && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">מקורות</h4>
          {response.sources.map((source, idx) => (
            <div key={source.id} className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
              <p className="font-medium text-blue-900">
                {idx + 1}. {source.source}
              </p>
              <p className="text-blue-800 mt-1">{source.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full Solution Placeholder */}
      {showFullSolution && (
        <div className="bg-green-50 p-4 rounded border border-green-200">
          <h4 className="font-semibold text-sm mb-2">פתרון מלא</h4>
          <p className="text-sm text-gray-600">(פתרון מלא יוגדר כאן...)</p>
        </div>
      )}

      {/* Share Button */}
      <button
        className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
        onClick={() => alert('שיתוף יויושם בעתיד')}
      >
        שתף הסבר זה
      </button>
    </div>
  );
}
