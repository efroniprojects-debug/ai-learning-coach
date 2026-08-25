import { useState } from 'react';
import { QuestionForm } from '../components/QuestionForm';
import { ResponseDisplay } from '../components/ResponseDisplay';
import type { QuestionResponse } from '../types';

export function QuestionWorkspacePage() {
  const [response, setResponse] = useState<QuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitQuestion = async (text: string, imageUrls?: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/questions/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ text, imageUrls }),
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
