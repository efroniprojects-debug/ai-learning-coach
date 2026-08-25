import { useState } from 'react';
import { QuestionForm } from '../components/QuestionForm';
import { ResponseDisplay } from '../components/ResponseDisplay';
import type { QuestionResponse } from '../types';

export function QuestionWorkspacePage() {
  const [response, setResponse] = useState<QuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'claude' | 'gemini' | 'openai'>('claude');

  const handleSubmitQuestion = async (text: string) => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/questions/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: text, provider }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process question');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto py-8 px-4">
      <div>
        <h1 className="text-3xl font-bold mb-4">שאל שאלה בפיזיקה</h1>
        <p className="text-gray-600 mb-6">
          הקלד או העלה את השאלה שלך, והמורה האישי שלך יעזור לך להבין את הפתרון בשלבים.
        </p>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">בחר ספק AI:</label>
          <div className="flex gap-3">
            {(['claude', 'gemini', 'openai'] as const).map((p) => (
              <label key={p} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  value={p}
                  checked={provider === p}
                  onChange={(e) => setProvider(e.target.value as typeof provider)}
                  disabled={loading}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium capitalize">
                  {p === 'claude' ? 'Claude' : p === 'gemini' ? 'Google Gemini' : 'OpenAI'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <QuestionForm onSubmit={handleSubmitQuestion} disabled={loading} />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}
      </div>

      <div>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : response ? (
          <ResponseDisplay response={response} questionText="" />
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-600">
            <p>התשובה תופיע כאן...</p>
          </div>
        )}
      </div>
    </div>
  );
}
